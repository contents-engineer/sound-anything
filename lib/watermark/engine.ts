// lib/watermark/engine.ts
//
// Client-side Gemini / Nano Banana watermark remover.
//
// The Gemini sparkle (✦) watermark is composited onto generated images via
// alpha blending against an opaque-white logo:
//
//     result = α · 255 + (1 − α) · original
//
// Inverting per RGB channel recovers the original pixel exactly:
//
//     original = (result − α · 255) / (1 − α)
//
// The per-pixel α map comes from two pre-baked logo PNGs (the gray sparkle on
// black), where brightness encodes opacity: α = max(R, G, B) / 255.
// We locate the watermark with normalized cross-correlation around its known
// bottom-right anchor, then reverse the blend.

/** Square watermark mask: a per-pixel alpha map plus its pixel size. */
export interface WatermarkMask {
  alphaMap: Float32Array
  width: number
  height: number
}

export interface DetectionResult {
  x: number
  y: number
  /** Normalized cross-correlation score in [0, 1]; higher means a better match. */
  confidence: number
}

export interface ProcessResult {
  success: boolean
  confidence: number
  message: string
}

// --- Tuning constants (match the reference implementation) -----------------

/** Alpha floor subtracted from every sample to ignore JPEG/encoding noise. */
const ALPHA_FLOOR = 3 / 255
/** Below this effective alpha a pixel is left untouched (nothing to undo). */
const ALPHA_SKIP_THRESHOLD = 0.002
/** Cap on alpha so the (1 − α) divisor never explodes near fully-opaque. */
const ALPHA_CAP = 0.99
/** Watermark logo color — opaque white. */
const WATERMARK_VALUE = 255
/** NCC search half-window, in pixels, around the expected anchor. */
const SEARCH_RADIUS = 4
/** Mask pixels dimmer than this are excluded from the NCC sum. */
const NCC_ALPHA_MIN = 0.05
/** Minimum NCC score to consider a watermark present. */
export const CONFIDENCE_THRESHOLD = 0.92
/** Images larger than this on both sides carry the bigger 96px watermark. */
const LARGE_IMAGE_THRESHOLD = 1024

const MASK_SMALL_URL = '/assets/bg_48.png'
const MASK_LARGE_URL = '/assets/bg_96.png'

/**
 * Build an alpha map from logo image data. The logo is white-on-black, so each
 * pixel's brightness (max channel) is its alpha contribution.
 */
function buildAlphaMap({ data, width, height }: ImageData): Float32Array {
  const alpha = new Float32Array(width * height)
  for (let i = 0; i < alpha.length; i++) {
    const o = i * 4
    alpha[i] = Math.max(data[o], data[o + 1], data[o + 2]) / 255
  }
  return alpha
}

/** Load an image URL and return its pixel data via an offscreen canvas. */
function loadImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('2D 컨텍스트를 생성할 수 없습니다.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, img.width, img.height))
    }
    img.onerror = reject
    img.src = src
  })
}

// Masks are loaded once and reused across every image.
let smallMask: WatermarkMask | null = null
let largeMask: WatermarkMask | null = null
let maskLoad: Promise<void> | null = null

/** Load (and cache) both watermark masks. Safe to call repeatedly. */
export function ensureMasksLoaded(): Promise<void> {
  if (!maskLoad) {
    maskLoad = Promise.all([loadImageData(MASK_SMALL_URL), loadImageData(MASK_LARGE_URL)])
      .then(([small, large]) => {
        smallMask = { alphaMap: buildAlphaMap(small), width: 48, height: 48 }
        largeMask = { alphaMap: buildAlphaMap(large), width: 96, height: 96 }
      })
      .catch((err) => {
        // Allow a later retry if loading failed.
        maskLoad = null
        throw err
      })
  }
  return maskLoad
}

/** Pick the watermark mask and bottom-right margin for an image's dimensions. */
function selectMask(width: number, height: number): { mask: WatermarkMask; margin: number } {
  if (width > LARGE_IMAGE_THRESHOLD && height > LARGE_IMAGE_THRESHOLD) {
    return { mask: largeMask!, margin: 64 }
  }
  return { mask: smallMask!, margin: 32 }
}

/**
 * Normalized cross-correlation search. Slides the mask across a small window
 * around (startX, startY) and returns the offset whose brightness pattern best
 * matches the sparkle's alpha shape.
 */
function findWatermark(
  image: ImageData,
  alphaMap: Float32Array,
  startX: number,
  startY: number,
  size: number,
  searchRadius = SEARCH_RADIUS,
): DetectionResult {
  const { data, width } = image
  let bestX = startX
  let bestY = startY
  let bestScore = -1

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const ox = startX + dx
      const oy = startY + dy
      if (ox < 0 || oy < 0 || ox + size > image.width || oy + size > image.height) continue

      let dot = 0
      let normA = 0
      let normS = 0
      let count = 0
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const a = alphaMap[row * size + col]
          if (a < NCC_ALPHA_MIN) continue
          const idx = ((oy + row) * width + (ox + col)) * 4
          const s = (data[idx] + data[idx + 1] + data[idx + 2]) / 765
          dot += a * s
          normA += a * a
          normS += s * s
          count++
        }
      }
      if (count === 0 || normA === 0 || normS === 0) continue

      const score = dot / (Math.sqrt(normA) * Math.sqrt(normS))
      if (score > bestScore) {
        bestScore = score
        bestX = ox
        bestY = oy
      }
    }
  }

  return { x: bestX, y: bestY, confidence: bestScore }
}

/**
 * Reverse the alpha blend in place over the mask region anchored at (x, y).
 * `strength` scales the assumed opacity (1 = the watermark's full strength).
 */
function removeWatermarkRegion(
  image: ImageData,
  alphaMap: Float32Array,
  x: number,
  y: number,
  maskWidth: number,
  maskHeight: number,
  strength = 1,
): void {
  const { data, width } = image
  for (let row = 0; row < maskHeight; row++) {
    for (let col = 0; col < maskWidth; col++) {
      let alpha = alphaMap[row * maskWidth + col] * strength
      alpha = Math.max(0, alpha - ALPHA_FLOOR)
      if (alpha < ALPHA_SKIP_THRESHOLD) continue
      alpha = Math.min(alpha, ALPHA_CAP)

      const idx = ((y + row) * width + (x + col)) * 4
      for (let c = 0; c < 3; c++) {
        const original = (data[idx + c] - alpha * WATERMARK_VALUE) / (1 - alpha)
        data[idx + c] = Math.round(Math.max(0, Math.min(255, original)))
      }
    }
  }
}

/**
 * Detect and remove the Gemini watermark on a canvas, mutating it in place.
 * Returns whether a watermark was found and removed, plus the match confidence.
 */
export function processCanvas(canvas: HTMLCanvasElement): ProcessResult {
  if (!smallMask || !largeMask) {
    return { success: false, confidence: 0, message: '마스크가 로드되지 않았습니다.' }
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { success: false, confidence: 0, message: '2D 컨텍스트를 생성할 수 없습니다.' }
  }

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { mask, margin } = selectMask(canvas.width, canvas.height)
  const anchorX = canvas.width - mask.width - margin
  const anchorY = canvas.height - mask.height - margin
  const detection = findWatermark(image, mask.alphaMap, anchorX, anchorY, mask.width)

  const pct = (detection.confidence * 100).toFixed(1)
  if (detection.confidence < CONFIDENCE_THRESHOLD) {
    return {
      success: false,
      confidence: detection.confidence,
      message: `워터마크가 감지되지 않았습니다. (신뢰도: ${pct}%)`,
    }
  }

  removeWatermarkRegion(image, mask.alphaMap, detection.x, detection.y, mask.width, mask.height)
  ctx.putImageData(image, 0, 0)
  return {
    success: true,
    confidence: detection.confidence,
    message: `워터마크 제거 완료 (신뢰도: ${pct}%)`,
  }
}

export interface ProcessedImage {
  /** Data URL of the original upload, for before/after comparison. */
  originalUrl: string
  /** Canvas holding the (possibly cleaned) image. */
  canvas: HTMLCanvasElement
  result: ProcessResult
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * End-to-end pipeline for a single uploaded file: decode it, run watermark
 * removal, and hand back the original data URL plus the result canvas.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  await ensureMasksLoaded()
  const originalUrl = await readFileAsDataURL(file)
  const img = await loadImageElement(originalUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D 컨텍스트를 생성할 수 없습니다.')
  ctx.drawImage(img, 0, 0)

  const result = processCanvas(canvas)
  return { originalUrl, canvas, result }
}
