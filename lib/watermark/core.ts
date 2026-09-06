// lib/watermark/core.ts
//
// Pure (DOM-free) algorithms for Gemini watermark detection and removal, so
// they can be exercised directly under Node. Detection strategy and the size
// catalog are ported in reduced form from the MIT-licensed reference
// implementation (github.com/GargantuaX/gemini-watermark-remover, © Jad,
// AllenK):
//
//   1. Candidate catalog — Gemini stamps the sparkle at a handful of known
//      layouts (logo size + bottom-right margins) that changed over 2025–2026,
//      so every plausible layout for the image size is tried.
//   2. Zero-mean NCC scoring — spatial correlation on luma plus Sobel gradient
//      correlation against the sparkle's edge structure, plus a local variance
//      cue. Unlike a plain positive-vector dot product, zero-mean NCC actually
//      discriminates: flat or bright regions score ≈ 0, not ≈ 1.
//   3. Anchor search — coarse-then-fine offset scan around each candidate
//      anchor, keeping the best-scoring (config, position) pair.
//
// Removal is exact inverse alpha blending: the watermark is composited as
// result = α·255 + (1−α)·original, so original = (result − α·255) / (1 − α).

export interface PixelImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** Which pre-baked sparkle rendering a layout was stamped with. */
export type AlphaVariant = 'default' | '20260520' | 'v2'

export interface WatermarkConfig {
  logoSize: number
  marginRight: number
  marginBottom: number
  alphaVariant: AlphaVariant
}

export interface AlphaMaps {
  /** 48×48 sparkle (classic small). */
  alpha48: Float32Array
  /** 96×96 sparkle (classic large). */
  alpha96: Float32Array
  /** 96×96 sparkle, 2026-05 re-render used by the margin-192 layouts. */
  alpha96New: Float32Array
  /** 36×36 sparkle, Gemini 3.5+ "V2" render (fainter, different falloff). */
  alpha36V2: Float32Array
}

export interface Detection {
  config: WatermarkConfig
  alphaMap: Float32Array
  x: number
  y: number
  confidence: number
  spatial: number
  gradient: number
  /** Estimated opacity scale of this render relative to the mask (≈ 0.5–1.25). */
  strength: number
  /**
   * Sparkle amplitude (luma per unit alpha) left after simulating removal —
   * how visible the mark would still be; near 0 for a true match.
   */
  residual: number
  /** How much sparkle amplitude the removal eliminates (before − after). */
  suppression: number
  /**
   * Whether the match is trustworthy enough to remove: either the blended
   * confidence clears CONFIDENCE_THRESHOLD, or removal verifiably suppresses a
   * strong sparkle signal (rescues partially occluded watermarks).
   */
  accepted: boolean
}

// --- Removal tuning ---------------------------------------------------------

/** Alpha floor subtracted from every sample to ignore JPEG/encoding noise. */
const ALPHA_FLOOR = 3 / 255
/** Below this effective alpha a pixel is left untouched (nothing to undo). */
const ALPHA_SKIP_THRESHOLD = 0.002
/** Cap on alpha so the (1 − α) divisor never explodes near fully-opaque. */
const ALPHA_CAP = 0.99
/** Watermark logo color — opaque white. */
const WATERMARK_VALUE = 255

// --- Detection tuning -------------------------------------------------------

/** Minimum blended confidence to consider a watermark present. */
export const CONFIDENCE_THRESHOLD = 0.25
/** Coarse anchor scan: offsets in [−6, 6] at this step. */
const COARSE_RADIUS = 6
const COARSE_STEP = 3
/** Fine scan radius around the best coarse offset. */
const FINE_RADIUS = 2
/** Candidates at or above this confidence get removal-simulation validation. */
const VALIDATION_MIN_CONFIDENCE = 0.12
/** Remaining sparkle amplitude (luma per unit alpha) that counts as "gone". */
const RESIDUAL_CLEARED = 0.04
/** Amplitude drop that accepts an occluded match below CONFIDENCE_THRESHOLD. */
const SUPPRESSION_ACCEPT = 0.15
const EPSILON = 1e-6

// --- Alpha maps -------------------------------------------------------------

/**
 * Build an alpha map from logo image data. The logo is a gray sparkle on
 * black, so each pixel's brightness (max channel) is its alpha contribution.
 */
export function buildAlphaMap({ data, width, height }: PixelImage): Float32Array {
  const alpha = new Float32Array(width * height)
  for (let i = 0; i < alpha.length; i++) {
    const o = i * 4
    alpha[i] = Math.max(data[o], data[o + 1], data[o + 2]) / 255
  }
  return alpha
}

/** Bilinear resample of a square alpha map (for 36/46px layout variants). */
export function interpolateAlphaMap(source: Float32Array, sourceSize: number, targetSize: number): Float32Array {
  if (sourceSize === targetSize) return new Float32Array(source)
  const out = new Float32Array(targetSize * targetSize)
  const scale = (sourceSize - 1) / Math.max(1, targetSize - 1)
  for (let y = 0; y < targetSize; y++) {
    const sy = y * scale
    const y0 = Math.floor(sy)
    const y1 = Math.min(sourceSize - 1, y0 + 1)
    const fy = sy - y0
    for (let x = 0; x < targetSize; x++) {
      const sx = x * scale
      const x0 = Math.floor(sx)
      const x1 = Math.min(sourceSize - 1, x0 + 1)
      const fx = sx - x0
      const p00 = source[y0 * sourceSize + x0]
      const p10 = source[y0 * sourceSize + x1]
      const p01 = source[y1 * sourceSize + x0]
      const p11 = source[y1 * sourceSize + x1]
      const top = p00 + (p10 - p00) * fx
      const bottom = p01 + (p11 - p01) * fx
      out[y * targetSize + x] = top + (bottom - top) * fy
    }
  }
  return out
}

/** Resolve the alpha map for a layout, resampling for non-standard sizes. */
export function alphaMapFor(config: WatermarkConfig, maps: AlphaMaps): Float32Array {
  if (config.alphaVariant === 'v2') {
    return config.logoSize === 36 ? maps.alpha36V2 : interpolateAlphaMap(maps.alpha36V2, 36, config.logoSize)
  }
  const base96 = config.alphaVariant === '20260520' ? maps.alpha96New : maps.alpha96
  if (config.logoSize === 96) return base96
  if (config.logoSize === 48 && config.alphaVariant === 'default') return maps.alpha48
  return interpolateAlphaMap(base96, 96, config.logoSize)
}

// --- Candidate layouts ------------------------------------------------------

/**
 * Known Gemini watermark layouts plausible for an image of this size, most
 * likely first. Margins are measured from the bottom-right corner.
 */
export function candidateConfigs(width: number, height: number): WatermarkConfig[] {
  const configs: WatermarkConfig[] = []
  const push = (c: WatermarkConfig) => {
    if (width - c.marginRight - c.logoSize < 0) return
    if (height - c.marginBottom - c.logoSize < 0) return
    const dup = configs.some(
      (o) =>
        o.logoSize === c.logoSize &&
        o.marginRight === c.marginRight &&
        o.marginBottom === c.marginBottom &&
        o.alphaVariant === c.alphaVariant,
    )
    if (!dup) configs.push(c)
  }
  const std48: WatermarkConfig = { logoSize: 48, marginRight: 32, marginBottom: 32, alphaVariant: 'default' }
  const std96: WatermarkConfig = { logoSize: 96, marginRight: 64, marginBottom: 64, alphaVariant: 'default' }

  // Historical default rule first, then the opposite standard layout — older
  // and newer Gemini builds disagree about which one a given size gets.
  if (width > 1024 && height > 1024) push(std96)
  push(std48)
  push(std96)

  // 2026-06+ Gemini 3.x 1k/2k outputs: 48px logo pushed in to 96px margins.
  push({ logoSize: 48, marginRight: 96, marginBottom: 96, alphaVariant: 'default' })

  // Gemini 3.5+ "V2" small sparkle: 36px logo, margin scaled down from the
  // 192px margin of its ~2.8k-wide source layout.
  if (Math.max(width, height) <= 2048) {
    const longSide = Math.max(width, height)
    const shortSide = Math.min(width, height)
    const sourceLongDim = shortSide >= 566 ? 2752 : shortSide >= 550 ? 2816 : 2848
    const margin = Math.round(192 * (longSide / sourceLongDim))
    push({ logoSize: 36, marginRight: margin, marginBottom: margin, alphaVariant: 'v2' })
  }

  // 2026-05+ large outputs: 96px logo at 192px margins, newer sparkle render.
  if (Math.min(width, height) >= 1024) {
    push({ logoSize: 96, marginRight: 192, marginBottom: 192, alphaVariant: '20260520' })
  }

  // Known fixed-size exception observed in the wild.
  if (width === 1408 && height === 768) {
    push({ logoSize: 46, marginRight: 32, marginBottom: 32, alphaVariant: 'default' })
  }

  return configs
}

/** Anchor (top-left of the logo) for a layout in an image. */
export function anchorFor(width: number, height: number, config: WatermarkConfig): { x: number; y: number } {
  return {
    x: width - config.marginRight - config.logoSize,
    y: height - config.marginBottom - config.logoSize,
  }
}

// --- Scoring ----------------------------------------------------------------

/** Rec.709 luma of a w×h rectangle, in [0, 1]. Returns empty if out of bounds. */
function lumaRegion(image: PixelImage, x: number, y: number, w: number, h: number): Float32Array {
  if (x < 0 || y < 0 || x + w > image.width || y + h > image.height) return new Float32Array(0)
  const { data, width } = image
  const out = new Float32Array(w * h)
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const idx = ((y + row) * width + (x + col)) * 4
      out[row * w + col] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255
    }
  }
  return out
}

/** Pearson correlation of two equal-length signals (zero-mean NCC). */
function zeroMeanNCC(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < a.length; i++) {
    sumA += a[i]
    sumB += b[i]
  }
  const meanA = sumA / a.length
  const meanB = sumB / b.length
  let dot = 0
  let varA = 0
  let varB = 0
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    dot += da * db
    varA += da * da
    varB += db * db
  }
  const den = Math.sqrt(varA * varB)
  return den < EPSILON ? 0 : dot / den
}

/** Sobel gradient magnitude of a square field. */
function sobelMagnitude(gray: Float32Array, size: number): Float32Array {
  const grad = new Float32Array(size * size)
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x
      const gx =
        -gray[i - size - 1] - 2 * gray[i - 1] - gray[i + size - 1] +
        gray[i - size + 1] + 2 * gray[i + 1] + gray[i + size + 1]
      const gy =
        -gray[i - size - 1] - 2 * gray[i - size] - gray[i - size + 1] +
        gray[i + size - 1] + 2 * gray[i + size] + gray[i + size + 1]
      grad[i] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return grad
}

function stdDev(values: Float32Array): number {
  if (values.length === 0) return 0
  let sum = 0
  for (let i = 0; i < values.length; i++) sum += values[i]
  const mean = sum / values.length
  let sq = 0
  for (let i = 0; i < values.length; i++) {
    const d = values[i] - mean
    sq += d * d
  }
  return Math.sqrt(sq / values.length)
}

interface Score {
  confidence: number
  spatial: number
  gradient: number
}

/**
 * Blended watermark-presence score at one position: spatial luma correlation
 * (50%), sparkle edge-structure correlation (30%), and texture dampening
 * versus the region directly above (20%) — a semi-transparent white logo
 * lowers local contrast relative to its surroundings.
 */
function scoreAt(
  image: PixelImage,
  alphaMap: Float32Array,
  alphaGrad: Float32Array,
  x: number,
  y: number,
  size: number,
): Score | null {
  const patch = lumaRegion(image, x, y, size, size)
  if (patch.length === 0) return null

  const spatial = zeroMeanNCC(patch, alphaMap)
  const gradient = zeroMeanNCC(sobelMagnitude(patch, size), alphaGrad)

  let variance = 0
  if (y > 8) {
    const refY = Math.max(0, y - size)
    const refH = Math.min(size, y - refY)
    if (refH > 8) {
      const wmStd = stdDev(patch)
      const refStd = stdDev(lumaRegion(image, x, refY, size, refH))
      if (refStd > EPSILON) variance = Math.min(1, Math.max(0, 1 - wmStd / refStd))
    }
  }

  const confidence = Math.max(0, spatial) * 0.5 + Math.max(0, gradient) * 0.3 + variance * 0.2
  return { confidence: Math.min(1, confidence), spatial, gradient }
}

// --- Strength calibration ----------------------------------------------------

/** Clamp bounds for the per-image watermark opacity scale. */
const STRENGTH_MIN = 0.25
const STRENGTH_MAX = 1.35
/** Alpha bands: pixels below BG_ALPHA_MAX are background; votes need [VOTE_MIN, VOTE_MAX]. */
const BG_ALPHA_MAX = 0.04
const VOTE_ALPHA_MIN = 0.12
const VOTE_ALPHA_MAX = 0.6
/** Half-size of the window scanned for background samples around a voting pixel. */
const BG_WINDOW = 6
const MIN_BG_SAMPLES = 6
const MIN_VOTES = 12

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Estimate how strongly the watermark was actually blended, as a scale on the
 * mask's alpha — real Gemini renders vary in opacity, and removing at the
 * wrong strength leaves a bright (under) or dark (over) sparkle.
 *
 * Each semi-transparent edge pixel casts a vote: with the local background b
 * taken as the median of nearby fully-transparent pixels, the blend
 * p = s·α + (1 − s·α)·b solves to s = (p − b) / (α·(1 − b)). The median vote
 * is robust to structures that overlap the watermark (text, highlights),
 * which break least-squares/correlation-based estimates.
 */
export function estimateStrength(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
): number {
  const patch = lumaRegion(image, x, y, size, size)
  if (patch.length === 0) return 1

  const votes: number[] = []
  const bg: number[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const a = alphaMap[row * size + col]
      if (a < VOTE_ALPHA_MIN || a > VOTE_ALPHA_MAX) continue

      bg.length = 0
      for (let wy = Math.max(0, row - BG_WINDOW); wy <= Math.min(size - 1, row + BG_WINDOW); wy++) {
        for (let wx = Math.max(0, col - BG_WINDOW); wx <= Math.min(size - 1, col + BG_WINDOW); wx++) {
          if (alphaMap[wy * size + wx] < BG_ALPHA_MAX) bg.push(patch[wy * size + wx])
        }
      }
      if (bg.length < MIN_BG_SAMPLES) continue
      const b = median(bg)
      if (b > 0.9) continue // watermark is invisible on near-white anyway

      const s = (patch[row * size + col] - b) / (a * (1 - b))
      if (s > 0 && s < 2) votes.push(s)
    }
  }
  if (votes.length < MIN_VOTES) return 1
  return Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, median(votes)))
}

/**
 * Regression slope of luma on alpha (cov/var): how many luma units the patch
 * brightens per unit of mask alpha. Unlike a correlation, this measures the
 * sparkle's visible amplitude — a residue that is perfectly alpha-shaped but
 * invisibly faint scores ≈ 0, not 1.
 */
function alphaSlope(values: Float32Array, alphaMap: Float32Array): number {
  let sumV = 0
  let sumA = 0
  for (let i = 0; i < values.length; i++) {
    sumV += values[i]
    sumA += alphaMap[i]
  }
  const meanV = sumV / values.length
  const meanA = sumA / values.length
  let cov = 0
  let varA = 0
  for (let i = 0; i < values.length; i++) {
    const da = alphaMap[i] - meanA
    cov += da * (values[i] - meanV)
    varA += da * da
  }
  return varA < EPSILON ? 0 : cov / varA
}

/** Simulate removal at `strength` and return the luma patch it would leave. */
function simulateRemoval(patch: Float32Array, alphaMap: Float32Array, strength: number): Float32Array {
  const cleaned = new Float32Array(patch.length)
  for (let i = 0; i < patch.length; i++) {
    const a = Math.min(alphaMap[i] * strength, ALPHA_CAP)
    cleaned[i] = a >= ALPHA_SKIP_THRESHOLD ? (patch[i] - a) / (1 - a) : patch[i]
  }
  return cleaned
}

// --- Detection --------------------------------------------------------------

interface Candidate extends Score {
  config: WatermarkConfig
  alphaMap: Float32Array
  x: number
  y: number
}

/**
 * Find the watermark in three stages: (1) per-layout coarse-then-fine anchor
 * scan scored by NCC blend, (2) removal simulation on the top candidates —
 * the right layout is the one whose inverse blend actually erases the sparkle
 * correlation, which disambiguates overlapping layouts and partially occluded
 * watermarks, (3) acceptance by confidence or by verified suppression.
 * Always returns the best candidate (or null if none fit); check `accepted`.
 */
export function detectWatermark(image: PixelImage, maps: AlphaMaps): Detection | null {
  const candidates: Candidate[] = []

  for (const config of candidateConfigs(image.width, image.height)) {
    const alphaMap = alphaMapFor(config, maps)
    const alphaGrad = sobelMagnitude(alphaMap, config.logoSize)
    const anchor = anchorFor(image.width, image.height, config)

    let best: Candidate | null = null
    for (let dy = -COARSE_RADIUS; dy <= COARSE_RADIUS; dy += COARSE_STEP) {
      for (let dx = -COARSE_RADIUS; dx <= COARSE_RADIUS; dx += COARSE_STEP) {
        const score = scoreAt(image, alphaMap, alphaGrad, anchor.x + dx, anchor.y + dy, config.logoSize)
        if (!score) continue
        if (!best || score.confidence > best.confidence) {
          best = { config, alphaMap, x: anchor.x + dx, y: anchor.y + dy, ...score }
        }
      }
    }
    if (!best) continue

    for (let dy = -FINE_RADIUS; dy <= FINE_RADIUS; dy++) {
      for (let dx = -FINE_RADIUS; dx <= FINE_RADIUS; dx++) {
        if (dx === 0 && dy === 0) continue
        const score = scoreAt(image, alphaMap, alphaGrad, best.x + dx, best.y + dy, config.logoSize)
        if (score && score.confidence > best.confidence) {
          best = { config, alphaMap, x: best.x + dx, y: best.y + dy, ...score }
        }
      }
    }
    candidates.push(best)
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.confidence - a.confidence)

  let winner: Detection | null = null
  for (const cand of candidates) {
    if (cand.confidence < VALIDATION_MIN_CONFIDENCE) continue
    const strength = estimateStrength(image, cand.alphaMap, cand.x, cand.y, cand.config.logoSize)
    const patch = lumaRegion(image, cand.x, cand.y, cand.config.logoSize, cand.config.logoSize)
    const cleaned = simulateRemoval(patch, cand.alphaMap, strength)
    const residual = Math.abs(alphaSlope(cleaned, cand.alphaMap))
    const suppression = Math.abs(alphaSlope(patch, cand.alphaMap)) - residual
    const detection: Detection = {
      ...cand,
      strength,
      residual,
      suppression,
      accepted:
        cand.confidence >= CONFIDENCE_THRESHOLD ||
        (suppression >= SUPPRESSION_ACCEPT && residual <= RESIDUAL_CLEARED),
    }
    // Prefer the candidate whose removal most convincingly erases the sparkle;
    // confidence breaks near-ties between overlapping layouts.
    const key = detection.suppression + detection.confidence * 0.5
    if (!winner || key > winner.suppression + winner.confidence * 0.5) winner = detection
  }

  if (!winner) {
    const cand = candidates[0]
    return { ...cand, strength: 1, residual: 0, suppression: 0, accepted: false }
  }
  return winner
}

// --- Removal ----------------------------------------------------------------

/**
 * Reverse the alpha blend in place over the logo region anchored at (x, y).
 * `strength` scales the assumed opacity (1 = the watermark's full strength).
 */
export function removeWatermarkRegion(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
  strength = 1,
): void {
  const { data, width } = image
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let alpha = alphaMap[row * size + col] * strength
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
