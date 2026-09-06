// lib/watermark/engine.ts
//
// Browser glue for the Gemini / Nano Banana watermark remover: loads the
// pre-baked sparkle alpha assets, decodes uploads onto a canvas, and runs the
// pure detection/removal pipeline in lib/watermark/core.ts.

import type { AlphaMaps } from '@/lib/watermark/core'
import {
  CONFIDENCE_THRESHOLD,
  buildAlphaMap,
  detectWatermark,
  removeWatermarkRegion,
} from '@/lib/watermark/core'

export { CONFIDENCE_THRESHOLD }

export interface ProcessResult {
  success: boolean
  confidence: number
  message: string
}

const MASK_SMALL_URL = '/assets/bg_48.png'
const MASK_LARGE_URL = '/assets/bg_96.png'
const MASK_LARGE_NEW_URL = '/assets/bg_96_20260520.png'
const MASK_V2_SMALL_URL = '/assets/bg_36_v2.png'

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
let masks: AlphaMaps | null = null
let maskLoad: Promise<void> | null = null

/** Load (and cache) the watermark alpha masks. Safe to call repeatedly. */
export function ensureMasksLoaded(): Promise<void> {
  if (!maskLoad) {
    maskLoad = Promise.all([
      loadImageData(MASK_SMALL_URL),
      loadImageData(MASK_LARGE_URL),
      loadImageData(MASK_LARGE_NEW_URL),
      loadImageData(MASK_V2_SMALL_URL),
    ])
      .then(([small, large, largeNew, v2Small]) => {
        masks = {
          alpha48: buildAlphaMap(small),
          alpha96: buildAlphaMap(large),
          alpha96New: buildAlphaMap(largeNew),
          alpha36V2: buildAlphaMap(v2Small),
        }
      })
      .catch((err) => {
        // Allow a later retry if loading failed.
        maskLoad = null
        throw err
      })
  }
  return maskLoad
}

/**
 * Detect and remove the Gemini watermark on a canvas, mutating it in place.
 * Returns whether a watermark was found and removed, plus the match confidence.
 */
export function processCanvas(canvas: HTMLCanvasElement): ProcessResult {
  if (!masks) {
    return { success: false, confidence: 0, message: '마스크가 로드되지 않았습니다.' }
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { success: false, confidence: 0, message: '2D 컨텍스트를 생성할 수 없습니다.' }
  }

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const detection = detectWatermark(image, masks)

  if (!detection || !detection.accepted) {
    const pct = ((detection?.confidence ?? 0) * 100).toFixed(1)
    return {
      success: false,
      confidence: detection?.confidence ?? 0,
      message: `워터마크가 감지되지 않았습니다. (신뢰도: ${pct}%)`,
    }
  }

  removeWatermarkRegion(image, detection.alphaMap, detection.x, detection.y, detection.config.logoSize, detection.strength)
  ctx.putImageData(image, 0, 0)
  return {
    success: true,
    confidence: detection.confidence,
    message: `워터마크 제거 완료 (${detection.config.logoSize}px, 신뢰도: ${(detection.confidence * 100).toFixed(1)}%)`,
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
