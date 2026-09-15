// lib/watermark/core.ts
//
// Pure (DOM-free) algorithms for Gemini watermark detection and removal, so
// they can be exercised directly under Node. Detection strategy and the size
// catalog are ported in reduced form from the MIT-licensed reference
// implementation (github.com/GargantuaX/gemini-watermark-remover, © Jad,
// AllenK):
//
//   1. Candidate layouts — Gemini stamps the sparkle at a handful of known
//      layouts (logo size + bottom-right margins) that changed repeatedly over
//      2025–2026, so every plausible layout for the image size is tried. A
//      file whose dimensions are not one Gemini emits is a resized copy, and
//      matching its aspect ratio back to a native size recovers the factor its
//      sparkle was scaled by — 43px at 85px margins, and such.
//   2. Zero-mean NCC scoring — spatial correlation on luma plus Sobel gradient
//      correlation against the sparkle's edge structure, plus a local variance
//      cue. Unlike a plain positive-vector dot product, zero-mean NCC actually
//      discriminates: flat or bright regions score ≈ 0, not ≈ 1.
//   3. Anchor search — coarse-then-fine offset scan around each candidate
//      anchor, keeping the best-scoring (config, position) pair.
//   4. Corner search — the layouts above are a snapshot of where Google has put
//      the mark so far, and a cropped image has no margin any of them predicts,
//      so the corner is also searched for the mark itself: the brightest
//      compact blob standing above its own local background proposes a position
//      and size of its own, which then has to survive the same checks.
//   5. Layout sweep — and if that finds nothing either, every plausible logo
//      size is tried against every margin on a coarse grid, the best few
//      refined. This is the answer to Google moving the mark: a new layout is
//      found the week it ships rather than the week somebody measures it.
//   6. Validation — a candidate is only accepted when the opacity of the blend
//      can actually be measured from its semi-transparent edge pixels, and
//      either the correlation is strong or simulated removal verifiably erases
//      the sparkle.
//
// Removal is exact inverse alpha blending: the watermark is composited as
// result = α·255 + (1−α)·original, so original = (result − α·255) / (1 − α).
// That recovers the pixels exactly where the file is lossless.
//
// `eraseWatermark` wraps all of it in a check that the removal worked, because
// detection alone cannot tell: a layout overlapping part of a mark it does not
// fit scores well enough to be accepted, and removing with it scrubs picture
// detail while leaving the mark. So the mark is erased on a copy and the copy is
// measured — the mask's own shape must be gone from it — and only then does the
// edit reach the image. A failed check falls through to the sweep, and if that
// fails too the upload is returned untouched. Where the blend cannot be undone
// at all — the ringing a JPEG encoder wrapped around the mark's edges is not a
// blend of anything any more — the affected pixels are filled by diffusing the
// surrounding ones inward, which invents no detail, only the flattest
// continuation of what is already there.

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
  /** Whether a catalogued layout proposed this, rather than the corner sweep. */
  fromCatalog: boolean
  /**
   * Whether the match is trustworthy enough to remove: either the blended
   * confidence clears CONFIDENCE_THRESHOLD, or removal verifiably suppresses a
   * strong sparkle signal (rescues partially occluded watermarks).
   */
  accepted: boolean
}

// --- Removal tuning ---------------------------------------------------------

/**
 * Below this effective alpha the blend is within JPEG/encoding noise, so the
 * pixel is left untouched. It is a skip test, never a subtraction: shaving a
 * constant off every alpha under-removes the sparkle body by that much, which
 * on a dark background is a ~5-level ghost in exactly the shape of the mark.
 */
const ALPHA_SKIP_THRESHOLD = 3 / 255
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

/**
 * Resample a square alpha map to another size.
 *
 * Shrinking uses area averaging rather than bilinear point sampling: a resized
 * Gemini download carries a sparkle that a real resampler box-filtered, and
 * point sampling a 48px mask down to, say, 29px drops whole rows of the thin
 * points and mismatches what is actually in the pixels. Growing stays bilinear.
 */
export function interpolateAlphaMap(source: Float32Array, sourceSize: number, targetSize: number): Float32Array {
  if (sourceSize === targetSize) return new Float32Array(source)
  const out = new Float32Array(targetSize * targetSize)

  if (targetSize < sourceSize) {
    const step = sourceSize / targetSize
    for (let y = 0; y < targetSize; y++) {
      const y0 = Math.floor(y * step)
      const y1 = Math.min(sourceSize, Math.max(y0 + 1, Math.ceil((y + 1) * step)))
      for (let x = 0; x < targetSize; x++) {
        const x0 = Math.floor(x * step)
        const x1 = Math.min(sourceSize, Math.max(x0 + 1, Math.ceil((x + 1) * step)))
        let sum = 0
        for (let sy = y0; sy < y1; sy++) {
          for (let sx = x0; sx < x1; sx++) sum += source[sy * sourceSize + sx]
        }
        out[y * targetSize + x] = sum / ((y1 - y0) * (x1 - x0))
      }
    }
    return out
  }

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

/**
 * Resolve the alpha map for a layout, resampling for non-standard sizes. The
 * `default` variant ships at two baked sizes; resampling from whichever is
 * closer keeps the least resampling error for the in-between sizes that resized
 * downloads produce.
 */
export function alphaMapFor(config: WatermarkConfig, maps: AlphaMaps): Float32Array {
  const { logoSize } = config
  if (config.alphaVariant === 'v2') {
    return logoSize === 36 ? maps.alpha36V2 : interpolateAlphaMap(maps.alpha36V2, 36, logoSize)
  }
  if (config.alphaVariant === '20260520') {
    return logoSize === 96 ? maps.alpha96New : interpolateAlphaMap(maps.alpha96New, 96, logoSize)
  }
  if (logoSize === 48) return maps.alpha48
  if (logoSize === 96) return maps.alpha96
  // Geometric midpoint of the two baked sizes.
  return logoSize <= 68
    ? interpolateAlphaMap(maps.alpha48, 48, logoSize)
    : interpolateAlphaMap(maps.alpha96, 96, logoSize)
}

// --- Candidate layouts ------------------------------------------------------

/**
 * Layouts Gemini has stamped at native resolution, most common first. Margins
 * are measured from the bottom-right corner to the logo box.
 */
const BASE_LAYOUTS: readonly WatermarkConfig[] = [
  // Gemini 3.x, mid-2026 onward — the layout behind most current downloads.
  { logoSize: 48, marginRight: 96, marginBottom: 96, alphaVariant: 'default' },
  // Classic small mark, still used for 0.5k and some 1k outputs.
  { logoSize: 48, marginRight: 32, marginBottom: 32, alphaVariant: 'default' },
  // Classic large mark (1k legacy, 2k/4k).
  { logoSize: 96, marginRight: 64, marginBottom: 64, alphaVariant: 'default' },
  // 2026-05 re-render, pushed in to 192px margins.
  { logoSize: 96, marginRight: 192, marginBottom: 192, alphaVariant: '20260520' },
  // Gemini 3.5+ "V2" small sparkle.
  { logoSize: 36, marginRight: 96, marginBottom: 96, alphaVariant: 'v2' },
]

/**
 * Layouts confirmed by measurement on real downloads of exactly this size,
 * which no tier rule predicts. 2752×1536 is the current 2k 16:9 export and its
 * 89px margin sits 7px off the nearest tier layout — close enough that the
 * anchor scan used to stumble onto it, far enough that it often did not.
 */
const FIXED_LAYOUTS_BY_SIZE: Readonly<Record<string, readonly WatermarkConfig[]>> = {
  '2752x1536': [{ logoSize: 48, marginRight: 89, marginBottom: 89, alphaVariant: 'default' }],
  '1408x768': [{ logoSize: 46, marginRight: 32, marginBottom: 32, alphaVariant: 'default' }],
}

/**
 * The discrete set of sizes Gemini image models emit. An upload that is not one
 * of these is a resized copy — saved through an editor, a messenger, or a CMS —
 * and its sparkle was scaled with it. Matching the upload's aspect ratio back
 * to a native size recovers that resize factor, and with it the logo size and
 * margins, which no fixed integer catalog can express.
 */
const OFFICIAL_SIZES: readonly (readonly [number, number])[] = [
  // gemini-3.x 0.5k
  [512, 512], [256, 1024], [192, 1536], [424, 632], [632, 424], [448, 600],
  [1024, 256], [600, 448], [464, 576], [576, 464], [1536, 192], [384, 688],
  [688, 384], [792, 168],
  // gemini-3.x 1k
  [1024, 1024], [512, 2048], [384, 3072], [848, 1264], [1264, 848], [896, 1200],
  [2048, 512], [1200, 896], [928, 1152], [1152, 928], [3072, 384], [768, 1376],
  [1376, 768], [1408, 768], [1584, 672],
  // gemini-3.x 2k
  [2048, 2048], [1024, 4096], [768, 6144], [1696, 2528], [2528, 1696],
  [1792, 2400], [4096, 1024], [2400, 1792], [1856, 2304], [2304, 1856],
  [6144, 768], [1536, 2752], [2752, 1536], [3168, 1344], [2816, 1536],
  // gemini-3.x 4k
  [4096, 4096], [2048, 8192], [1536, 12288], [3392, 5056], [5056, 3392],
  [3584, 4800], [8192, 2048], [4800, 3584], [3712, 4608], [4608, 3712],
  [12288, 1536], [3072, 5504], [5504, 3072], [6336, 2688],
  // gemini-2.5-flash-image 1k
  [832, 1248], [1248, 832], [864, 1184], [1184, 864], [896, 1152], [1152, 896],
  [768, 1344], [1344, 768], [1536, 672],
]

/**
 * Smallest logo worth correlating against. Below roughly this the sparkle is a
 * handful of pixels, matches almost any bright speck, and a heavily downscaled
 * image would not show a visible mark anyway.
 */
const MIN_LOGO_SIZE = 24
/** How far two resize factors may disagree between the axes, as a fraction. */
const ASPECT_TOLERANCE = 0.012
/** At most this many resize factors are tried, largest first. */
const MAX_RESIZE_FACTORS = 3

/**
 * Resize factors that could have produced this image from a native Gemini size.
 * Returns [1] when the size is native.
 */
export function resizeFactors(width: number, height: number): number[] {
  const factors: number[] = []
  for (const [ow, oh] of OFFICIAL_SIZES) {
    if (ow === width && oh === height) return [1]
    const kx = width / ow
    const ky = height / oh
    if (kx > 1.02 || kx < 0.2) continue
    if (Math.abs(kx - ky) > ASPECT_TOLERANCE * Math.max(kx, ky)) continue
    factors.push((kx + ky) / 2)
  }
  factors.sort((a, b) => b - a)
  return factors.slice(0, MAX_RESIZE_FACTORS)
}

/**
 * Known Gemini watermark layouts plausible for an image of this size, most
 * likely first: the size's measured exceptions, then every base layout at
 * native scale, then the base layouts scaled by each plausible resize factor.
 */
export function candidateConfigs(width: number, height: number): WatermarkConfig[] {
  const configs: WatermarkConfig[] = []
  const push = (c: WatermarkConfig) => {
    if (c.logoSize < MIN_LOGO_SIZE) return
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

  for (const c of FIXED_LAYOUTS_BY_SIZE[`${width}x${height}`] ?? []) push(c)
  for (const c of BASE_LAYOUTS) push(c)

  for (const k of resizeFactors(width, height)) {
    if (k === 1) break
    for (const c of BASE_LAYOUTS) {
      push({
        logoSize: Math.round(c.logoSize * k),
        marginRight: Math.round(c.marginRight * k),
        marginBottom: Math.round(c.marginBottom * k),
        alphaVariant: c.alphaVariant,
      })
    }
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
export interface StrengthEstimate {
  /** Opacity scale to remove at, clamped into the plausible range. */
  value: number
  /**
   * Whether the votes actually landed in that range. A clamped or defaulted
   * value means no measurable blend was found here — the region may be bright,
   * flat, or simply not a watermark — so nothing downstream should treat the
   * number as evidence that a mark is present.
   */
  measured: boolean
}

export function estimateStrength(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
): StrengthEstimate {
  const patch = lumaRegion(image, x, y, size, size)
  if (patch.length === 0) return { value: 1, measured: false }

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
  if (votes.length < MIN_VOTES) return { value: 1, measured: false }
  const vote = median(votes)
  return {
    value: Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, vote)),
    measured: vote >= STRENGTH_MIN && vote <= STRENGTH_MAX,
  }
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

// --- Layout-free corner search ----------------------------------------------

// Gemini has moved the sparkle four times in a year, and a cropped download has
// no margin any catalog could predict. When no known layout validates, find the
// mark the way an eye does: a small bright blob sitting above its own local
// background in the bottom-right corner. This proposes only a position and a
// size — the usual correlation and removal-simulation checks still decide
// whether it is really the sparkle, with a stricter bar since there is no
// layout prior backing it up.

/** Fraction of the long edge searched, and the bounds on that window. */
const ROI_FRACTION = 0.4
const ROI_MIN = 200
const ROI_MAX = 600
/** The corner scan works on a downsampled copy; background is smooth anyway. */
const ROI_DOWNSCALE = 4
/** Widest mark the background estimate must see past, in full-resolution px. */
const MAX_BLOB_SIZE = 128
/** A blob must stand at least this far above its background to be worth testing. */
const MIN_PEAK_EXCESS = 6 / 255
/** Blob extent is taken where excess crosses this fraction of its peak. */
const BLOB_GROW_FRACTION = 0.25
/** The sparkle is square; reject blobs further from square than this. */
const MAX_BLOB_ASPECT = 1.5
/** Layout-free matches clear this confidence instead of CONFIDENCE_THRESHOLD. */
const BLIND_CONFIDENCE_THRESHOLD = 0.35
/** Sizes tried around the blob's measured extent, as fractions of it. */
const BLIND_SIZE_LADDER = [0.8, 0.9, 1, 1.1]

/** Area-averaged downscale of a single-channel field. */
function downscale(src: Float32Array, w: number, h: number, factor: number): {
  data: Float32Array
  width: number
  height: number
} {
  const width = Math.max(1, Math.floor(w / factor))
  const height = Math.max(1, Math.floor(h / factor))
  const data = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    const y0 = y * factor
    const y1 = Math.min(h, y0 + factor)
    for (let x = 0; x < width; x++) {
      const x0 = x * factor
      const x1 = Math.min(w, x0 + factor)
      let sum = 0
      for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) sum += src[sy * w + sx]
      data[y * width + x] = sum / ((y1 - y0) * (x1 - x0))
    }
  }
  return { data, width, height }
}

/** Separable square min- or max-filter of half-width `r`. */
function morphology(src: Float32Array, w: number, h: number, r: number, max: boolean): Float32Array {
  const pick = max ? Math.max : Math.min
  const mid = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = src[y * w + x]
      for (let d = Math.max(0, x - r); d <= Math.min(w - 1, x + r); d++) acc = pick(acc, src[y * w + d])
      mid[y * w + x] = acc
    }
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = mid[y * w + x]
      for (let d = Math.max(0, y - r); d <= Math.min(h - 1, y + r); d++) acc = pick(acc, mid[d * w + x])
      out[y * w + x] = acc
    }
  }
  return out
}

/** Bilinear upsample of a field back to `w`×`h`. */
function upscale(src: Float32Array, sw: number, sh: number, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h)
  const fx = sw / w
  const fy = sh / h
  for (let y = 0; y < h; y++) {
    const sy = Math.min(sh - 1, Math.max(0, (y + 0.5) * fy - 0.5))
    const y0 = Math.floor(sy)
    const y1 = Math.min(sh - 1, y0 + 1)
    const ty = sy - y0
    for (let x = 0; x < w; x++) {
      const sx = Math.min(sw - 1, Math.max(0, (x + 0.5) * fx - 0.5))
      const x0 = Math.floor(sx)
      const x1 = Math.min(sw - 1, x0 + 1)
      const tx = sx - x0
      const top = src[y0 * sw + x0] + (src[y0 * sw + x1] - src[y0 * sw + x0]) * tx
      const bottom = src[y1 * sw + x0] + (src[y1 * sw + x1] - src[y1 * sw + x0]) * tx
      out[y * w + x] = top + (bottom - top) * ty
    }
  }
  return out
}

export interface BlobBox {
  x: number
  y: number
  size: number
  /** Peak excess over local background, in luma units [0, 1]. */
  peak: number
}

/**
 * Locate the brightest compact blob in the bottom-right corner, as a square box
 * in image coordinates. Returns null when nothing there stands out enough or
 * the blob is the wrong shape or size to be a sparkle.
 */
export function findCornerBlob(image: PixelImage): BlobBox | null {
  const roi = Math.min(
    image.width,
    image.height,
    Math.max(ROI_MIN, Math.min(ROI_MAX, Math.round(ROI_FRACTION * Math.max(image.width, image.height)))),
  )
  const originX = image.width - roi
  const originY = image.height - roi
  const luma = lumaRegion(image, originX, originY, roi, roi)
  if (luma.length === 0) return null

  const small = downscale(luma, roi, roi, ROI_DOWNSCALE)
  const radius = Math.ceil(MAX_BLOB_SIZE / 2 / ROI_DOWNSCALE)
  const opened = morphology(morphology(small.data, small.width, small.height, radius, false), small.width, small.height, radius, true)
  const background = upscale(opened, small.width, small.height, roi, roi)

  const excess = new Float32Array(roi * roi)
  let seed = -1
  let peak = 0
  for (let i = 0; i < excess.length; i++) {
    const e = luma[i] - background[i]
    excess[i] = e > 0 ? e : 0
    if (excess[i] > peak) {
      peak = excess[i]
      seed = i
    }
  }
  if (seed < 0 || peak < MIN_PEAK_EXCESS) return null

  // Region-grow the connected component around the peak.
  const threshold = peak * BLOB_GROW_FRACTION
  const seen = new Uint8Array(excess.length)
  const stack = [seed]
  seen[seed] = 1
  let minX = roi
  let maxX = -1
  let minY = roi
  let maxY = -1
  let visited = 0
  const limit = MAX_BLOB_SIZE * MAX_BLOB_SIZE * 2
  while (stack.length > 0) {
    const i = stack.pop() as number
    const x = i % roi
    const y = (i / roi) | 0
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (++visited > limit) return null
    const neighbours = [x > 0 ? i - 1 : -1, x < roi - 1 ? i + 1 : -1, y > 0 ? i - roi : -1, y < roi - 1 ? i + roi : -1]
    for (const j of neighbours) {
      if (j < 0 || seen[j] === 1 || excess[j] < threshold) continue
      seen[j] = 1
      stack.push(j)
    }
  }

  const blobW = maxX - minX + 1
  const blobH = maxY - minY + 1
  if (Math.max(blobW, blobH) / Math.min(blobW, blobH) > MAX_BLOB_ASPECT) return null
  // A watermark is inset from the edges; a blob running off the search window
  // is part of the picture, not a stamp.
  if (minX === 0 || minY === 0 || maxX === roi - 1 || maxY === roi - 1) return null

  const size = Math.max(blobW, blobH)
  if (size < MIN_LOGO_SIZE || size > MAX_BLOB_SIZE) return null

  const cx = originX + (minX + maxX) / 2
  const cy = originY + (minY + maxY) / 2
  return {
    x: Math.round(cx - size / 2),
    y: Math.round(cy - size / 2),
    size,
    peak,
  }
}

// --- Detection --------------------------------------------------------------

interface Candidate extends Score {
  config: WatermarkConfig
  alphaMap: Float32Array
  x: number
  y: number
  /** Whether a catalogued layout proposed this, rather than the corner sweep. */
  fromCatalog: boolean
}

/** Coarse-then-fine offset scan around `anchor`, keeping the best score. */
function scanAround(
  image: PixelImage,
  config: WatermarkConfig,
  alphaMap: Float32Array,
  anchor: { x: number; y: number },
): Candidate | null {
  const alphaGrad = sobelMagnitude(alphaMap, config.logoSize)
  let best: Candidate | null = null

  for (let dy = -COARSE_RADIUS; dy <= COARSE_RADIUS; dy += COARSE_STEP) {
    for (let dx = -COARSE_RADIUS; dx <= COARSE_RADIUS; dx += COARSE_STEP) {
      const score = scoreAt(image, alphaMap, alphaGrad, anchor.x + dx, anchor.y + dy, config.logoSize)
      if (!score) continue
      if (!best || score.confidence > best.confidence) {
        best = { config, alphaMap, x: anchor.x + dx, y: anchor.y + dy, fromCatalog: true, ...score }
      }
    }
  }
  if (!best) return null

  for (let dy = -FINE_RADIUS; dy <= FINE_RADIUS; dy++) {
    for (let dx = -FINE_RADIUS; dx <= FINE_RADIUS; dx++) {
      if (dx === 0 && dy === 0) continue
      const score = scoreAt(image, alphaMap, alphaGrad, best.x + dx, best.y + dy, config.logoSize)
      if (score && score.confidence > best.confidence) {
        best = { config, alphaMap, x: best.x + dx, y: best.y + dy, fromCatalog: true, ...score }
      }
    }
  }
  return best
}

/**
 * Simulate removal of `cand` and decide whether it is really the sparkle.
 * `minConfidence` is the bar the correlation has to clear on its own; a layout
 * the catalog vouches for gets the normal bar and a second chance on verified
 * suppression, a layout-free match has to clear a higher one outright.
 */
function validate(image: PixelImage, cand: Candidate, minConfidence: number, allowSuppressionRescue: boolean): Detection {
  const { logoSize } = cand.config
  const strength = estimateStrength(image, cand.alphaMap, cand.x, cand.y, logoSize)
  const patch = lumaRegion(image, cand.x, cand.y, logoSize, logoSize)
  const cleaned = simulateRemoval(patch, cand.alphaMap, strength.value)
  const residual = Math.abs(alphaSlope(cleaned, cand.alphaMap))
  const suppression = Math.abs(alphaSlope(patch, cand.alphaMap)) - residual
  // Removal only counts as evidence when the opacity behind it was actually
  // measured. A clamped estimate means the region never looked like a blend, so
  // a strong "suppression" there is the simulation scrubbing away picture
  // detail, not a watermark.
  const cleared = suppression >= SUPPRESSION_ACCEPT && residual <= RESIDUAL_CLEARED
  const looksBlended = cand.confidence >= minConfidence || cleared
  return {
    ...cand,
    strength: strength.value,
    residual,
    suppression,
    // Every real stamp has an opacity that can be read off its semi-transparent
    // edge pixels. Where that reading clamps or runs out of votes there is no
    // blend to undo, whatever the correlation says — and correlation alone gets
    // less reliable the more layouts are on offer, since the best of many tries
    // clears a fixed bar more often.
    accepted: strength.measured && (allowSuppressionRescue ? looksBlended : cand.confidence >= minConfidence && cleared),
  }
}

/** Rank validated candidates: erasing the sparkle wins, confidence breaks ties. */
function selectionKey(d: Detection): number {
  return d.suppression + d.confidence * 0.5
}

/** Best of a set by `selectionKey`, with an accepted match always beating an unaccepted one. */
function selectBest(candidates: Detection[]): Detection | null {
  let winner: Detection | null = null
  for (const detection of candidates) {
    if (winner?.accepted && !detection.accepted) continue
    if (!winner || (detection.accepted && !winner.accepted) || selectionKey(detection) > selectionKey(winner)) {
      winner = detection
    }
  }
  return winner
}

// --- Layout sweep ------------------------------------------------------------

// The catalog is a snapshot of where Google has put the mark so far, and it has
// moved four times in a year. Rather than wait for each new layout to be
// measured, the bottom-right corner is swept outright: every plausible logo size
// against every margin on a coarse grid, and only the best few of those are
// refined. The catalog still runs first and still wins ties — it is a prior, not
// the search space.

/**
 * Logo sizes worth sweeping: the sizes Gemini has actually stamped, plus the
 * rungs a downstream resize tends to land on. A size in between shows up as a
 * near-miss on the neighbouring rung and is recovered by the refinement pass.
 */
const SWEEP_SIZES = [24, 28, 32, 36, 44, 48, 56, 72, 96] as const
/** Sweep margins out to here; past it the mark would not read as a corner stamp. */
const SWEEP_MARGIN_MAX = 208
/** Margin grid step. The refinement pass covers the gaps. */
const SWEEP_MARGIN_STEP = 6
/** Logo sizes tried around a surviving hit, as deltas. */
const SWEEP_SIZE_DELTAS = [-2, -1, 1, 2] as const
/** Coarse hits refined, across all variants and sizes. */
const SWEEP_REFINE = 8
/** Sweep candidates carried into removal validation, most confident first. */
const SWEEP_VALIDATE = 16
/** A sparkle never takes up more than this fraction of the short edge. */
const SWEEP_MAX_SIZE_FRACTION = 0.25

const SWEEP_VARIANTS: readonly AlphaVariant[] = ['default', '20260520', 'v2']

/**
 * Cheap presence score for the coarse pass: spatial correlation only. The edge
 * and texture terms in `scoreAt` cost three more passes over the patch, and at
 * this stage their job — separating a real mark from a bright blob — is not
 * needed yet, because everything that survives is re-scored in full.
 */
function coarseScore(image: PixelImage, alphaMap: Float32Array, x: number, y: number, size: number): number {
  const patch = lumaRegion(image, x, y, size, size)
  if (patch.length === 0) return -1
  return zeroMeanNCC(patch, alphaMap)
}

/**
 * Score every (variant, size, margin) on a coarse grid in the bottom-right
 * corner, refine the best few by position and size, and return the candidates
 * worth validating, most confident first.
 */
function sweepCandidates(image: PixelImage, maps: AlphaMaps): Candidate[] {
  const { width, height } = image
  const maxSize = Math.min(width, height) * SWEEP_MAX_SIZE_FRACTION

  interface Seed {
    alphaVariant: AlphaVariant
    logoSize: number
    alphaMap: Float32Array
    x: number
    y: number
    score: number
  }
  const seeds: Seed[] = []

  for (const alphaVariant of SWEEP_VARIANTS) {
    for (const logoSize of SWEEP_SIZES) {
      if (logoSize > maxSize) continue
      const alphaMap = alphaMapFor({ logoSize, marginRight: 0, marginBottom: 0, alphaVariant }, maps)
      let best: Seed | null = null
      for (let margin = 0; margin <= SWEEP_MARGIN_MAX; margin += SWEEP_MARGIN_STEP) {
        const x = width - margin - logoSize
        const y = height - margin - logoSize
        if (x < 0 || y < 0) break
        const score = coarseScore(image, alphaMap, x, y, logoSize)
        if (!best || score > best.score) best = { alphaVariant, logoSize, alphaMap, x, y, score }
      }
      if (best) seeds.push(best)
    }
  }

  seeds.sort((a, b) => b.score - a.score)

  const out: Candidate[] = []
  const configAt = (variant: AlphaVariant, size: number, x: number, y: number): WatermarkConfig => ({
    logoSize: size,
    marginRight: width - x - size,
    marginBottom: height - y - size,
    alphaVariant: variant,
  })

  for (const seed of seeds.slice(0, SWEEP_REFINE)) {
    // Off-grid margins, asymmetric margins, and the pixel of drift a resize
    // leaves all live inside this window; the anchor scan handles it the same
    // way the catalog path does.
    const anchored = scanAround(
      image,
      configAt(seed.alphaVariant, seed.logoSize, seed.x, seed.y),
      seed.alphaMap,
      { x: seed.x, y: seed.y },
    )
    if (!anchored) continue
    out.push({ ...anchored, fromCatalog: false, config: configAt(seed.alphaVariant, seed.logoSize, anchored.x, anchored.y) })

    // A size the ladder skipped reads as a near-miss on the rung next to it, so
    // the neighbouring sizes get a look at the anchor that won.
    for (const delta of SWEEP_SIZE_DELTAS) {
      const size = seed.logoSize + delta
      if (size < MIN_LOGO_SIZE || size > maxSize) continue
      const config = configAt(seed.alphaVariant, size, anchored.x, anchored.y)
      if (config.marginRight < 0 || config.marginBottom < 0) continue
      const alphaMap = alphaMapFor(config, maps)
      const score = scoreAt(image, alphaMap, sobelMagnitude(alphaMap, size), anchored.x, anchored.y, size)
      if (score) out.push({ config, alphaMap, x: anchored.x, y: anchored.y, fromCatalog: false, ...score })
    }
  }

  out.sort((a, b) => b.confidence - a.confidence)
  return out.slice(0, SWEEP_VALIDATE)
}

/**
 * Find the watermark in three stages: (1) per-layout coarse-then-fine anchor
 * scan scored by NCC blend, (2) removal simulation on the top candidates —
 * the right layout is the one whose inverse blend actually erases the sparkle
 * correlation, which disambiguates overlapping layouts and partially occluded
 * watermarks, (3) acceptance by confidence or by verified suppression.
 *
 * If no known layout survives that, the corner is searched for the mark
 * directly — first as the brightest compact blob, then by sweeping every
 * plausible logo size against every margin — and those go through the same
 * validation under a stricter bar, having no layout prior behind them. Always
 * returns the best candidate (or null if none fit); check `accepted`.
 */
export interface DetectOptions {
  /**
   * Sweep the corner even when a catalogued layout was accepted. The erase
   * pipeline turns this on for its second attempt: a catalogued layout that
   * overlaps part of a mark it does not really fit can look convincing enough
   * to be accepted, and the only way to find that out is to remove with it and
   * see that the sparkle is still there.
   */
  forceSweep?: boolean
}

export function detectWatermark(
  image: PixelImage,
  maps: AlphaMaps,
  options: DetectOptions = {},
): Detection | null {
  const candidates: Candidate[] = []
  for (const config of candidateConfigs(image.width, image.height)) {
    const cand = scanAround(image, config, alphaMapFor(config, maps), anchorFor(image.width, image.height, config))
    if (cand) candidates.push(cand)
  }
  candidates.sort((a, b) => b.confidence - a.confidence)

  const validated: Detection[] = []
  for (const cand of candidates) {
    if (cand.confidence < VALIDATION_MIN_CONFIDENCE) continue
    validated.push(validate(image, cand, CONFIDENCE_THRESHOLD, true))
  }

  // The corner search runs even when a layout did validate. A layout that lines
  // up with only part of the mark — after a crop, say — can suppress enough of
  // it to look convincing while removing from the wrong place, and the only way
  // to know is to let the mark's actual position compete.
  const blind = detectBlind(image, maps)
  if (blind) validated.push(blind)

  const known = selectBest(validated)
  if (known?.accepted && !options.forceSweep) return known

  // Nothing catalogued explains the corner, so sweep it: every plausible logo
  // size against every margin. This runs as a fallback rather than alongside the
  // catalog because its masks are resampled approximations of the baked
  // sparkles. The renders are close cousins — several of them correlate with the
  // same mark — so a resampled one allowed to compete can outscore the layout
  // Gemini actually stamped, and removing with a mask of the wrong shape leaves
  // a ghost. Finding geometry the catalog lacks is the sweep's job; second-
  // guessing the catalog where it already fits is not.
  for (const cand of sweepCandidates(image, maps)) {
    if (cand.confidence < VALIDATION_MIN_CONFIDENCE) continue
    validated.push(validate(image, cand, BLIND_CONFIDENCE_THRESHOLD, false))
  }

  const winner = selectBest(validated)
  if (winner) return winner

  if (candidates.length > 0) {
    const cand = candidates[0]
    return { ...cand, strength: 1, residual: 0, suppression: 0, accepted: false }
  }
  return null
}

/**
 * Last resort: take the position and size of the brightest compact blob in the
 * corner as the layout, and see whether the sparkle mask explains it.
 */
function detectBlind(image: PixelImage, maps: AlphaMaps): Detection | null {
  const blob = findCornerBlob(image)
  if (!blob) return null

  const trySize = (size: number): Detection | null => {
    if (size < MIN_LOGO_SIZE || size > MAX_BLOB_SIZE) return null
    const x = blob.x + Math.round((blob.size - size) / 2)
    const y = blob.y + Math.round((blob.size - size) / 2)
    const config: WatermarkConfig = {
      logoSize: size,
      marginRight: image.width - x - size,
      marginBottom: image.height - y - size,
      alphaVariant: 'default',
    }
    const cand = scanAround(image, config, alphaMapFor(config, maps), { x, y })
    if (!cand || cand.confidence < VALIDATION_MIN_CONFIDENCE) return null
    // Keep the layout honest: the scan may have drifted off the proposed box.
    const found: Candidate = {
      ...cand,
      fromCatalog: false,
      config: {
        ...config,
        marginRight: image.width - cand.x - size,
        marginBottom: image.height - cand.y - size,
      },
    }
    return validate(image, found, BLIND_CONFIDENCE_THRESHOLD, false)
  }

  const found: Detection[] = []
  const consider = (detection: Detection | null) => {
    if (detection) found.push(detection)
  }

  // The blob's extent is where its glow fades into the background, which reads
  // wide over a bright or noisy picture and narrow over a flat dark one, so
  // sweep sizes around it rather than trusting the measurement, then refine by
  // a pixel or two — the sparkle's thin points are where a size error shows.
  for (const factor of BLIND_SIZE_LADDER) consider(trySize(Math.round(blob.size * factor)))
  const coarse = selectBest(found)
  if (!coarse) return null
  for (const delta of [-2, -1, 1, 2]) consider(trySize(coarse.config.logoSize + delta))
  return selectBest(found)
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
      const alpha = Math.min(alphaMap[row * size + col] * strength, ALPHA_CAP)
      if (alpha < ALPHA_SKIP_THRESHOLD) continue

      const idx = ((y + row) * width + (x + col)) * 4
      for (let c = 0; c < 3; c++) {
        const original = (data[idx + c] - alpha * WATERMARK_VALUE) / (1 - alpha)
        data[idx + c] = Math.round(Math.max(0, Math.min(255, original)))
      }
    }
  }
}

// --- Residual measurement ----------------------------------------------------

/** Below this mask gradient a pixel is not on the sparkle's outline. */
const OUTLINE_GRADIENT_MIN = 0.08
/** Half-width of the reference ring sampled just outside the logo box. */
const RESIDUAL_RING = 6

/**
 * How strongly the sparkle's outline still stands out, as a ratio.
 *
 * Averages the Laplacian magnitude over the pixels where the mask has an edge,
 * and divides by the same average over a ring just outside the logo box. A
 * patch of ordinary picture reads ≈ 1; anything the removal left behind — a
 * ghost, a mis-scaled blend, the ringing a JPEG encoder wrapped around the
 * mark — reads well above it, because it is shaped like the mask and the
 * surroundings are not.
 */
export function markResidual(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
): number {
  const laplacian = (px: number, py: number): number | null => {
    if (px < 1 || py < 1 || px >= image.width - 1 || py >= image.height - 1) return null
    const at = (qx: number, qy: number) => {
      const i = (qy * image.width + qx) * 4
      return 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2]
    }
    return Math.abs(4 * at(px, py) - at(px - 1, py) - at(px + 1, py) - at(px, py - 1) - at(px, py + 1))
  }

  let markSum = 0
  let markCount = 0
  for (let row = 1; row < size - 1; row++) {
    for (let col = 1; col < size - 1; col++) {
      const gx = alphaMap[row * size + col + 1] - alphaMap[row * size + col - 1]
      const gy = alphaMap[(row + 1) * size + col] - alphaMap[(row - 1) * size + col]
      if (Math.hypot(gx, gy) <= OUTLINE_GRADIENT_MIN) continue
      const value = laplacian(x + col, y + row)
      if (value !== null) {
        markSum += value
        markCount++
      }
    }
  }
  if (markCount === 0) return 1

  let ringSum = 0
  let ringCount = 0
  for (let py = y - RESIDUAL_RING; py < y + size + RESIDUAL_RING; py++) {
    for (let px = x - RESIDUAL_RING; px < x + size + RESIDUAL_RING; px++) {
      if (px >= x && px < x + size && py >= y && py < y + size) continue
      const value = laplacian(px, py)
      if (value !== null) {
        ringSum += value
        ringCount++
      }
    }
  }
  const mark = markSum / markCount
  // Nothing to compare against: call it raised only if the outline is strong in
  // absolute terms.
  if (ringCount === 0) return mark > 6 ? 3 : 1
  // One luma level of floor under the divisor. A flat sky or a black backdrop
  // has no Laplacian energy at all, and dividing by that turns a half-level of
  // dither into a screaming residual; with the floor, such a patch simply reads
  // its ghost's height in luma levels, which is the number that matters there.
  return mark / Math.max(1, ringSum / ringCount)
}

/**
 * How much luma still tracks the mask's alpha, in luma per unit alpha [0, 1].
 *
 * The companion to `markResidual`, and the one that answers "is the mark still
 * there". Because it regresses on the mask's own shape, isotropic noise around
 * the region — the ringing a JPEG encoder leaves, film grain, a busy picture —
 * averages out of it, while a sparkle that survived removal does not.
 */
export function markLeftover(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
): number {
  const patch = lumaRegion(image, x, y, size, size)
  if (patch.length === 0) return 0
  return Math.abs(alphaSlope(patch, alphaMap))
}

// --- Erase pipeline ----------------------------------------------------------

export interface EraseResult {
  status: 'clean' | 'inpainted' | 'not-detected'
  reason?: 'no-match' | 'not-removed'
  detection: Detection | null
}

/** Outline strength above which removal is followed by a repair pass. */
const INPAINT_RESIDUAL = 1.5
/** Above this the outline is not ringing but a failed removal: fill it all. */
const INPAINT_WHOLE_RESIDUAL = 2.5
/**
 * Sparkle-shaped signal a finished region has to be under. This is the check
 * that decides whether the edit is allowed out, and it is deliberately not the
 * outline measure above: on a flat backdrop a re-encoded download keeps ringing
 * that reads loud there while the mark itself is gone. What must be gone is the
 * mask's own shape.
 */
const VERIFY_LEFTOVER = RESIDUAL_CLEARED

function copyImage(image: PixelImage): PixelImage {
  return { data: new Uint8ClampedArray(image.data), width: image.width, height: image.height }
}

/**
 * Detect and erase the watermark, mutating `image` in place.
 *
 * Detection is checked by doing it: the mark is removed on a copy and the copy
 * is measured, and the edit only reaches `image` once the sparkle's outline has
 * actually gone flat. A layout that overlaps part of a mark it does not fit can
 * score well enough to be accepted, and removing with it scrubs picture detail
 * while leaving the mark — so a failed check falls through to the corner sweep,
 * and if that fails too the upload comes back untouched. An image that is
 * returned edited is one that was verified clean.
 */
export function eraseWatermark(image: PixelImage, maps: AlphaMaps): EraseResult {
  let lastDetection: Detection | null = null

  // The second attempt exists for one case: a catalogued layout scored well
  // enough to be accepted and so short-circuited the corner sweep, then failed
  // to actually clean the mark. Anywhere else the sweep has already run inside
  // the first detect, and running it again would only cost the same work twice.
  for (const options of [{}, { forceSweep: true }] as DetectOptions[]) {
    const detection = detectWatermark(image, maps, options)
    if (detection) lastDetection = detection
    if (!detection?.accepted) break

    const { alphaMap, x, y } = detection
    const { logoSize } = detection.config
    const working = copyImage(image)
    removeWatermarkRegion(working, alphaMap, x, y, logoSize, detection.strength)

    const residual = markResidual(working, alphaMap, x, y, logoSize)
    let status: EraseResult['status'] = 'clean'
    if (residual > INPAINT_RESIDUAL) {
      inpaintMarkRegion(working, alphaMap, x, y, logoSize, residual > INPAINT_WHOLE_RESIDUAL)
      status = 'inpainted'
    }

    if (markLeftover(working, alphaMap, x, y, logoSize) <= VERIFY_LEFTOVER) {
      image.data.set(working.data)
      return { status, detection }
    }
    if (!detection.fromCatalog) break
  }

  return {
    status: 'not-detected',
    reason: lastDetection?.accepted ? 'not-removed' : 'no-match',
    detection: lastDetection,
  }
}

// --- Inpainting --------------------------------------------------------------

/** Iterations of Laplace diffusion used to fill a hole. */
const INPAINT_ITERATIONS = 60
/** Mask alpha above which a pixel counts as covered by the mark at all. */
const INPAINT_ALPHA_MIN = 0.02

/**
 * Fill the pixels `hole` marks by diffusing the surrounding ones inward —
 * repeated 4-neighbour averaging, which converges on the smooth (Laplace)
 * surface that meets the known border. Nothing is invented: the result is the
 * flattest continuation of what is already there.
 */
function diffuseInto(image: PixelImage, hole: Uint8Array, x: number, y: number, size: number): void {
  // One ring of known pixels around the box gives the diffusion a boundary.
  const pad = 1
  const w = size + pad * 2
  const h = size + pad * 2
  const originX = x - pad
  const originY = y - pad
  const field = new Float32Array(w * h * 3)
  const fixed = new Uint8Array(w * h)
  const clampX = (v: number) => Math.min(Math.max(v, 0), image.width - 1)
  const clampY = (v: number) => Math.min(Math.max(v, 0), image.height - 1)

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const src = (clampY(originY + row) * image.width + clampX(originX + col)) * 4
      const dst = (row * w + col) * 3
      field[dst] = image.data[src]
      field[dst + 1] = image.data[src + 1]
      field[dst + 2] = image.data[src + 2]
      const inside = col >= pad && row >= pad && col < pad + size && row < pad + size
      fixed[row * w + col] = inside && hole[(row - pad) * size + (col - pad)] ? 0 : 1
    }
  }

  for (let pass = 0; pass < INPAINT_ITERATIONS; pass++) {
    for (let row = 1; row < h - 1; row++) {
      for (let col = 1; col < w - 1; col++) {
        if (fixed[row * w + col]) continue
        const at = (r: number, c: number, channel: number) => field[(r * w + c) * 3 + channel]
        const dst = (row * w + col) * 3
        for (let channel = 0; channel < 3; channel++) {
          field[dst + channel] =
            (at(row, col - 1, channel) + at(row, col + 1, channel) +
              at(row - 1, col, channel) + at(row + 1, col, channel)) / 4
        }
      }
    }
  }

  for (let row = pad; row < pad + size; row++) {
    for (let col = pad; col < pad + size; col++) {
      if (fixed[row * w + col]) continue
      const src = (row * w + col) * 3
      const dst = ((originY + row) * image.width + originX + col) * 4
      for (let channel = 0; channel < 3; channel++) {
        const value = field[src + channel]
        image.data[dst + channel] = value < 0 ? 0 : value > 255 ? 255 : Math.round(value)
      }
    }
  }
}

/**
 * Repair what the inverse blend could not.
 *
 * `whole` fills everything the mark covered; otherwise only the band along its
 * outline, which is where a re-encoded download keeps the ringing the encoder
 * wrapped around the sparkle's edges — no alpha model can undo that, because
 * those pixels are not a blend of the mark and the picture any more.
 */
export function inpaintMarkRegion(
  image: PixelImage,
  alphaMap: Float32Array,
  x: number,
  y: number,
  size: number,
  whole: boolean,
): void {
  const hole = new Uint8Array(size * size)
  if (whole) {
    for (let i = 0; i < hole.length; i++) if (alphaMap[i] > INPAINT_ALPHA_MIN) hole[i] = 1
  } else {
    for (let row = 1; row < size - 1; row++) {
      for (let col = 1; col < size - 1; col++) {
        const gx = alphaMap[row * size + col + 1] - alphaMap[row * size + col - 1]
        const gy = alphaMap[(row + 1) * size + col] - alphaMap[(row - 1) * size + col]
        if (Math.hypot(gx, gy) <= OUTLINE_GRADIENT_MIN) continue
        // Dilate by one: the ringing straddles the edge the mask draws.
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) hole[(row + dy) * size + (col + dx)] = 1
        }
      }
    }
  }
  let any = false
  for (let i = 0; i < hole.length; i++) if (hole[i]) { any = true; break }
  if (!any) return
  diffuseInto(image, hole, x, y, size)
}
