// scripts/watermark-core.test.mjs
//
// Synthetic end-to-end tests for lib/watermark/core.ts, run with plain Node
// (which type-strips the .ts import):
//
//   node scripts/watermark-core.test.mjs
//
// For every known Gemini watermark layout, a sparkle is composited onto varied
// backgrounds with the same alpha model the remover assumes; the test then
// asserts the detector finds the right layout at the right position, that
// removal restores the original pixels, and that clean images are NOT flagged
// (the old engine's pseudo-NCC scored 0.93+ on everything, watermark or not).
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  alphaMapFor,
  anchorFor,
  buildAlphaMap,
  candidateConfigs,
  detectWatermark,
  eraseWatermark,
  interpolateAlphaMap,
  markLeftover,
  markResidual,
  removeWatermarkRegion,
} from '../lib/watermark/core.ts'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

let failures = 0
let checks = 0
function check(ok, label) {
  checks++
  if (!ok) {
    failures++
    console.error(`  ✗ ${label}`)
  }
}

async function loadAlpha(file) {
  const { data, info } = await sharp(path.join(ROOT, 'public/assets', file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return buildAlphaMap({ data: new Uint8ClampedArray(data), width: info.width, height: info.height })
}

function makeImage(w, h, kind) {
  const data = new Uint8ClampedArray(w * h * 4)
  let rng = 42
  const rand = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let r, g, b
      switch (kind) {
        case 'dark': r = g = b = 18; break
        case 'mid': r = g = b = 128; break
        case 'gradient':
          r = Math.round((x / w) * 255); g = Math.round((y / h) * 255); b = 120; break
        case 'photo': {
          const base = 90 + Math.round((x / w) * 80)
          const n = Math.round((rand() - 0.5) * 24)
          r = base + n; g = base + 20 + n; b = base - 20 + n; break
        }
        case 'busy':
          r = Math.round(rand() * 255); g = Math.round(rand() * 255); b = Math.round(rand() * 255); break
      }
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

const clone = (img) => ({ data: new Uint8ClampedArray(img.data), width: img.width, height: img.height })

/** Encode to JPEG and decode back, so the mark's edges carry real ringing. */
async function roundTripJpeg(image, quality) {
  const buf = await sharp(Buffer.from(image.data), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .jpeg({ quality })
    .toBuffer()
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data: new Uint8ClampedArray(data), width: info.width, height: info.height }
}

// Composite exactly as Gemini does: result = α·255 + (1−α)·original.
// `strength` scales the mask alpha, mimicking Gemini's varying render opacity.
function stampWatermark(image, alphaMap, x, y, size, strength = 1) {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const a = alphaMap[row * size + col] * strength
      if (a <= 0) continue
      const idx = ((y + row) * image.width + (x + col)) * 4
      for (let c = 0; c < 3; c++) {
        image.data[idx + c] = Math.round(a * 255 + (1 - a) * image.data[idx + c])
      }
    }
  }
}

function regionError(a, b, x, y, size) {
  let max = 0, sum = 0, n = 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const idx = ((y + row) * a.width + (x + col)) * 4
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(a.data[idx + c] - b.data[idx + c])
        max = Math.max(max, d); sum += d; n++
      }
    }
  }
  return { max, mean: sum / n }
}

const sameConfig = (a, b) =>
  a.logoSize === b.logoSize && a.marginRight === b.marginRight &&
  a.marginBottom === b.marginBottom && a.alphaVariant === b.alphaVariant

const maps = {
  alpha48: await loadAlpha('bg_48.png'),
  alpha96: await loadAlpha('bg_96.png'),
  alpha96New: await loadAlpha('bg_96_20260520.png'),
  alpha36V2: await loadAlpha('bg_36_v2.png'),
}

// Every layout the catalog knows for that image size must round-trip.
const layoutCases = [
  { w: 1024, h: 1024, pick: (c) => c.logoSize === 48 && c.marginRight === 32 },
  { w: 1024, h: 1024, pick: (c) => c.logoSize === 48 && c.marginRight === 96 },
  { w: 1024, h: 1024, pick: (c) => c.logoSize === 36 },
  { w: 1344, h: 768, pick: (c) => c.logoSize === 48 && c.marginRight === 32 },
  { w: 2048, h: 2048, pick: (c) => c.logoSize === 96 && c.marginRight === 64 },
  { w: 2048, h: 2048, pick: (c) => c.logoSize === 48 && c.marginRight === 96 },
  { w: 2816, h: 1536, pick: (c) => c.alphaVariant === '20260520' },
  { w: 1408, h: 768, pick: (c) => c.logoSize === 46 },
]
const backgrounds = ['dark', 'mid', 'gradient', 'photo']

console.log('--- watermarked images: detect right layout, restore pixels ---')
for (const { w, h, pick } of layoutCases) {
  const config = candidateConfigs(w, h).find(pick)
  check(!!config, `catalog for ${w}x${h} contains expected layout`)
  if (!config) continue
  const alphaMap = alphaMapFor(config, maps)
  const anchor = anchorFor(w, h, config)
  const label = `${w}x${h} logo=${config.logoSize} margin=${config.marginRight} (${config.alphaVariant})`

  for (const bg of backgrounds) {
    const original = makeImage(w, h, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, anchor.x, anchor.y, config.logoSize)

    const det = detectWatermark(marked, maps)
    const detected = det && det.accepted
    check(detected, `${label} on ${bg}: detected (conf=${det?.confidence.toFixed(3)})`)
    if (!detected) continue
    check(sameConfig(det.config, config), `${label} on ${bg}: right layout (got logo=${det.config.logoSize} margin=${det.config.marginRight})`)
    check(det.x === anchor.x && det.y === anchor.y, `${label} on ${bg}: exact position (off ${det.x - anchor.x},${det.y - anchor.y})`)

    if (sameConfig(det.config, config)) {
      check(Math.abs(det.strength - 1) <= 0.15, `${label} on ${bg}: strength ≈ 1 (got ${det.strength.toFixed(3)})`)
      const cleaned = clone(marked)
      removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, det.config.logoSize, det.strength)
      const err = regionError(cleaned, original, anchor.x, anchor.y, config.logoSize)
      // Inverse blending doubles 8-bit quantization noise where α ≈ 0.5, so a
      // mean error of a few levels is the noise floor, not a defect.
      check(err.max <= 20 && err.mean <= 5, `${label} on ${bg}: restored (maxErr=${err.max} meanErr=${err.mean.toFixed(2)})`)
    }
  }
}

console.log('--- weaker renders: strength estimated, no over-removal ---')
for (const trueStrength of [0.5, 0.7]) {
  const config = candidateConfigs(1024, 1024).find((c) => c.logoSize === 48 && c.marginRight === 32)
  const alphaMap = alphaMapFor(config, maps)
  const anchor = anchorFor(1024, 1024, config)
  for (const bg of ['mid', 'gradient', 'photo']) {
    const original = makeImage(1024, 1024, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, anchor.x, anchor.y, config.logoSize, trueStrength)

    const det = detectWatermark(marked, maps)
    const detected = det && det.accepted && sameConfig(det.config, config)
    check(detected, `strength=${trueStrength} on ${bg}: detected right layout (conf=${det?.confidence.toFixed(3)})`)
    if (!detected) continue

    check(Math.abs(det.strength - trueStrength) <= 0.1, `strength=${trueStrength} on ${bg}: estimated ${det.strength.toFixed(3)}`)
    const cleaned = clone(marked)
    removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, config.logoSize, det.strength)
    const err = regionError(cleaned, original, anchor.x, anchor.y, config.logoSize)
    check(err.max <= 25 && err.mean <= 5, `strength=${trueStrength} on ${bg}: restored (maxErr=${err.max} meanErr=${err.mean.toFixed(2)})`)
  }
}

console.log('--- clean images: no false positives ---')
for (const [w, h] of [[1024, 1024], [2048, 2048], [1344, 768], [800, 600]]) {
  for (const bg of ['dark', 'mid', 'gradient', 'photo', 'busy']) {
    const det = detectWatermark(makeImage(w, h, bg), maps)
    check(!det || !det.accepted, `clean ${w}x${h} ${bg}: not flagged (conf=${(det?.confidence ?? 0).toFixed(3)})`)
  }
}

console.log('--- detection latency ---')
const perfImage = makeImage(2048, 2048, 'photo')
const t0 = performance.now()
detectWatermark(perfImage, maps)
console.log(`detect on 2048x2048: ${(performance.now() - t0).toFixed(0)}ms`)


// ---------------------------------------------------------------------------
// Regressions for the 2026-09 Gemini watermark (issue: the tool stopped working)
//
// Ground truth measured from three real Gemini downloads (GargantuaX/
// gemini-watermark-remover issues #153, #155, #165):
//   * the sparkle shape is unchanged — a 48px bg_48 mask fits with rms α 0.015
//   * it is stamped at ≈ 0.60 of that mask's opacity (peak α ≈ 0.30, not 0.51)
//   * 2752×1536 downloads carry it at 48px with 89px margins
//   * resized/re-encoded downloads carry it at the same layout times the resize
//     factor — e.g. 824×1024 (0.888× of the official 928×1152) has a 43px
//     sparkle at 85px margins, which no integer catalog entry can express
// ---------------------------------------------------------------------------

/** Mean absolute error over the sparkle core only — where a ghost is visible. */
function coreError(a, b, alphaMap, x, y, size) {
  let peak = 0
  for (let i = 0; i < alphaMap.length; i++) if (alphaMap[i] > peak) peak = alphaMap[i]
  let sum = 0, n = 0, max = 0
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (alphaMap[row * size + col] < 0.45 * peak) continue
      const idx = ((y + row) * a.width + (x + col)) * 4
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(a.data[idx + c] - b.data[idx + c])
        sum += d; n++; max = Math.max(max, d)
      }
    }
  }
  return { mean: n ? sum / n : 0, max }
}

console.log('--- 2026-09 mark: ~0.6 opacity leaves no ghost after removal ---')
for (const bg of ['dark', 'mid', 'photo']) {
  const config = candidateConfigs(2048, 2048).find((c) => c.logoSize === 48 && c.marginRight === 96)
  const alphaMap = alphaMapFor(config, maps)
  const anchor = anchorFor(2048, 2048, config)
  const original = makeImage(2048, 2048, bg)
  const marked = clone(original)
  stampWatermark(marked, alphaMap, anchor.x, anchor.y, config.logoSize, 0.6)

  const det = detectWatermark(marked, maps)
  check(det?.accepted, `0.6-opacity on ${bg}: detected (conf=${det?.confidence.toFixed(3)})`)
  if (!det?.accepted) continue
  const cleaned = clone(marked)
  removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, det.config.logoSize, det.strength)
  const err = coreError(cleaned, original, det.alphaMap, det.x, det.y, det.config.logoSize)
  // A flat alpha bias shows up here as a uniform few-level ghost over the whole
  // sparkle body, which is exactly what users see on dark backgrounds.
  check(err.mean <= 1.5, `0.6-opacity on ${bg}: no core ghost (meanErr=${err.mean.toFixed(2)} maxErr=${err.max})`)
}

console.log('--- 2752×1536: the measured 89px margin layout ---')
{
  const hit = candidateConfigs(2752, 1536).find(
    (c) => c.logoSize === 48 && c.marginRight === 89 && c.marginBottom === 89,
  )
  check(!!hit, 'catalog for 2752x1536 contains 48px @ 89px margins')
  if (hit) {
    const alphaMap = alphaMapFor(hit, maps)
    const anchor = anchorFor(2752, 1536, hit)
    for (const bg of ['dark', 'photo']) {
      const original = makeImage(2752, 1536, bg)
      const marked = clone(original)
      stampWatermark(marked, alphaMap, anchor.x, anchor.y, hit.logoSize, 0.6)
      const det = detectWatermark(marked, maps)
      check(det?.accepted, `2752x1536 @89 on ${bg}: detected`)
      if (!det?.accepted) continue
      check(det.x === anchor.x && det.y === anchor.y, `2752x1536 @89 on ${bg}: exact position (off ${det.x - anchor.x},${det.y - anchor.y})`)
      const cleaned = clone(marked)
      removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, det.config.logoSize, det.strength)
      const err = regionError(cleaned, original, anchor.x, anchor.y, hit.logoSize)
      check(err.max <= 20 && err.mean <= 5, `2752x1536 @89 on ${bg}: restored (maxErr=${err.max} meanErr=${err.mean.toFixed(2)})`)
    }
  }
}

console.log('--- resized downloads: fractional logo sizes and margins ---')
// Each case is an official Gemini size scaled by a factor a user's editor or
// messenger would apply, with the 48 @ 96/96 layout scaled the same way.
const resizeCases = [
  { label: '824x1024 (0.888x of 928x1152)', w: 824, h: 1024, size: 43, margin: 85 },
  { label: '1376x768 -> 1101x614 (0.8x)', w: 1101, h: 614, size: 38, margin: 77 },
  { label: '2048x2048 -> 1229x1229 (0.6x)', w: 1229, h: 1229, size: 29, margin: 58 },
]
for (const { label, w, h, size, margin } of resizeCases) {
  const alphaMap = interpolateAlphaMap(maps.alpha48, 48, size)
  const x = w - margin - size
  const y = h - margin - size
  for (const bg of ['dark', 'photo']) {
    const original = makeImage(w, h, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, x, y, size, 0.6)

    const det = detectWatermark(marked, maps)
    check(det?.accepted, `${label} on ${bg}: detected (conf=${det?.confidence.toFixed(3)})`)
    if (!det?.accepted) continue
    check(
      Math.abs(det.config.logoSize - size) <= 1,
      `${label} on ${bg}: logo size ≈ ${size} (got ${det.config.logoSize})`,
    )
    check(
      Math.abs(det.x - x) <= 1 && Math.abs(det.y - y) <= 1,
      `${label} on ${bg}: position (off ${det.x - x},${det.y - y})`,
    )
    const cleaned = clone(marked)
    removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, det.config.logoSize, det.strength)
    const err = regionError(cleaned, original, x, y, size)
    check(err.max <= 25 && err.mean <= 5, `${label} on ${bg}: restored (maxErr=${err.max} meanErr=${err.mean.toFixed(2)})`)
  }
}

console.log('--- unknown layouts: found without a catalog entry ---')
// The mark has moved four times already, and a cropped image has no margin the
// catalog could ever predict. Neither of these sizes matches an official Gemini
// size or any resize of one, so nothing here can come from the catalog.
const unknownCases = [
  { label: 'unlisted size, unlisted layout (1000x700, 60px @ 120)', w: 1000, h: 700, size: 60, right: 120, bottom: 120 },
  { label: 'cropped download (2700x1500, 48px @ 37/53)', w: 2700, h: 1500, size: 48, right: 37, bottom: 53 },
  { label: 'future small mark (1500x1000, 28px @ 150)', w: 1500, h: 1000, size: 28, right: 150, bottom: 150 },
]
for (const { label, w, h, size, right, bottom } of unknownCases) {
  const fromCatalog = candidateConfigs(w, h).some(
    (c) => c.logoSize === size && c.marginRight === right && c.marginBottom === bottom,
  )
  check(!fromCatalog, `${label}: genuinely absent from the catalog`)

  const alphaMap = interpolateAlphaMap(maps.alpha48, 48, size)
  const x = w - right - size
  const y = h - bottom - size
  for (const bg of ['dark', 'mid', 'photo']) {
    const original = makeImage(w, h, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, x, y, size, 0.6)

    const det = detectWatermark(marked, maps)
    check(det?.accepted, `${label} on ${bg}: detected (conf=${det?.confidence.toFixed(3)})`)
    if (!det?.accepted) continue
    check(
      Math.abs(det.x - x) <= 2 && Math.abs(det.y - y) <= 2,
      `${label} on ${bg}: position (off ${det.x - x},${det.y - y})`,
    )
    const cleaned = clone(marked)
    removeWatermarkRegion(cleaned, det.alphaMap, det.x, det.y, det.config.logoSize, det.strength)
    const err = regionError(cleaned, original, x, y, size)
    // Recovering a layout nobody catalogued means recovering its size from how
    // far the glow reaches, which lands within a pixel or two — so the sparkle's
    // thin points keep a few outlier pixels that the inverse blend amplifies.
    // The mean is the metric that says the mark is gone; hold that tighter than
    // the catalog path does and let the per-pixel tail be wider.
    check(err.max <= 40 && err.mean <= 3, `${label} on ${bg}: restored (maxErr=${err.max} meanErr=${err.mean.toFixed(2)})`)
  }
}

console.log('--- unlisted native layouts: found by sweeping the margin ---')
// Gemini has moved the mark four times in a year. These three sit at native
// sizes (so no resize factor can produce them) with margins and logo sizes the
// catalog has never seen — the case a user hits the week Google ships a change.
const sweepCases = [
  { label: '1024x1024, 56px @ 93', w: 1024, h: 1024, size: 56, margin: 93 },
  { label: '1024x1024, 48px @ 120', w: 1024, h: 1024, size: 48, margin: 120 },
  { label: '2048x2048, 44px @ 83', w: 2048, h: 2048, size: 44, margin: 83 },
]
for (const { label, w, h, size, margin } of sweepCases) {
  const fromCatalog = candidateConfigs(w, h).some(
    (c) => c.logoSize === size && c.marginRight === margin && c.marginBottom === margin,
  )
  check(!fromCatalog, `${label}: genuinely absent from the catalog`)

  const alphaMap = interpolateAlphaMap(maps.alpha48, 48, size)
  const x = w - margin - size
  const y = h - margin - size
  for (const bg of ['dark', 'mid', 'photo']) {
    const original = makeImage(w, h, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, x, y, size, 0.6)

    // The sweep is a fallback: a catalogued layout that scores well enough gets
    // the answer first, right or wrong. What is under test here is that the
    // sweep recovers the geometry when it is asked; that a wrong catalog match
    // does not survive is the erase pipeline's job, checked below.
    const det = detectWatermark(marked, maps, { forceSweep: true })
    check(det?.accepted, `${label} on ${bg}: detected (conf=${det?.confidence.toFixed(3)})`)
    if (!det?.accepted) continue
    check(
      Math.abs(det.config.logoSize - size) <= 1,
      `${label} on ${bg}: logo size ≈ ${size} (got ${det.config.logoSize})`,
    )
    check(
      Math.abs(det.x - x) <= 1 && Math.abs(det.y - y) <= 1,
      `${label} on ${bg}: position (off ${det.x - x},${det.y - y})`,
    )
  }
}

console.log('--- markResidual: reads the outline, not the picture ---')
// The measure that decides whether a removal worked: energy along the mask's
// outline over energy in the surrounding ring. ~1 on a picture with no mark.
{
  const size = 48
  const alphaMap = maps.alpha48
  // It is a ratio against the surroundings, so it sees a mark against a smooth
  // backdrop and goes blind against per-pixel noise louder than the mark's own
  // edges ('photo'). What must hold everywhere is the other direction: a patch
  // with no mark in it never reads raised.
  for (const bg of ['dark', 'mid', 'gradient', 'photo', 'busy']) {
    const original = makeImage(1024, 1024, bg)
    const clean = markResidual(original, alphaMap, 880, 880, size)
    check(clean <= 1.6, `${bg}: clean patch reads flat (${clean.toFixed(2)})`)
  }
  for (const bg of ['dark', 'mid', 'gradient']) {
    const original = makeImage(1024, 1024, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, 880, 880, size, 0.6)
    const dirty = markResidual(marked, alphaMap, 880, 880, size)
    check(dirty > 3, `${bg}: stamped patch reads raised (${dirty.toFixed(2)})`)
  }
  // markLeftover regresses luma on the mask's own shape, so unlike the outline
  // ratio it sees the mark on every background and ignores noise that is not
  // mask-shaped. It is the measure the erase gate trusts, at a bar of 0.04.
  //
  // A blend of p = sα + (1 − sα)·b reads back a slope of about s·(1 − b), so
  // what the gate has to work with shrinks as the backdrop gets brighter: a
  // 0.6-opacity mark gives ~0.56 on black and ~0.09 over a pale gradient. That
  // last one is the tight case — the mark is barely visible there to begin with.
  for (const bg of ['dark', 'mid', 'gradient', 'photo', 'busy']) {
    const original = makeImage(1024, 1024, bg)
    check(markLeftover(original, alphaMap, 880, 880, size) <= 0.04, `${bg}: clean patch has no sparkle signal`)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, 880, 880, size, 0.6)
    const dirty = markLeftover(marked, alphaMap, 880, 880, size)
    check(dirty > 0.08, `${bg}: stamped patch has sparkle signal (${dirty.toFixed(3)})`)
  }
}

console.log('--- eraseWatermark never returns a damaged image ---')
// A layout that lines up with only part of the mark can score well enough to be
// accepted, and removing at it scrubs picture detail while leaving the sparkle.
// Whatever the detector believes, an image that comes back edited must be clean.
for (const { label, w, h, size, margin } of sweepCases) {
  const alphaMap = interpolateAlphaMap(maps.alpha48, 48, size)
  const x = w - margin - size
  const y = h - margin - size
  for (const bg of ['dark', 'mid', 'photo']) {
    const original = makeImage(w, h, bg)
    const marked = clone(original)
    stampWatermark(marked, alphaMap, x, y, size, 0.6)

    const working = clone(marked)
    const res = eraseWatermark(working, maps)
    if (res.status === 'not-detected') {
      let identical = true
      for (let i = 0; i < working.data.length; i++) {
        if (working.data[i] !== marked.data[i]) { identical = false; break }
      }
      check(identical, `${label} on ${bg}: not-detected leaves the upload untouched`)
      continue
    }
    const left = markLeftover(working, alphaMap, x, y, size)
    check(left <= 0.04, `${label} on ${bg}: ${res.status} — mark actually gone (leftover=${left.toFixed(4)})`)
    const err = coreError(working, original, alphaMap, x, y, size)
    check(err.mean <= 3, `${label} on ${bg}: core restored (meanErr=${err.mean.toFixed(2)})`)
  }
}

console.log('--- clean images survive eraseWatermark byte-for-byte ---')
for (const [w, h] of [[1024, 1024], [1344, 768]]) {
  for (const bg of ['dark', 'mid', 'gradient', 'photo', 'busy']) {
    const original = makeImage(w, h, bg)
    const working = clone(original)
    const res = eraseWatermark(working, maps)
    let identical = true
    for (let i = 0; i < working.data.length; i++) {
      if (working.data[i] !== original.data[i]) { identical = false; break }
    }
    check(res.status === 'not-detected' && identical, `clean ${w}x${h} ${bg}: untouched (status=${res.status})`)
  }
}

console.log('--- JPEG ringing: the outline is inpainted away ---')
// Inverse alpha blending cannot undo what the encoder did to the mark's edges,
// so a re-encoded download keeps a faint outline exactly where the sparkle was.
// That is what a user sees as "it did not really work".
for (const bg of ['dark', 'mid', 'photo']) {
  const w = 1024, h = 1024
  const config = candidateConfigs(w, h).find((c) => c.logoSize === 48 && c.marginRight === 96)
  const alphaMap = alphaMapFor(config, maps)
  const { x, y } = anchorFor(w, h, config)
  const original = makeImage(w, h, bg)
  const marked = clone(original)
  stampWatermark(marked, alphaMap, x, y, config.logoSize, 0.6)
  const jpeg = await roundTripJpeg(marked, 72)

  // What the region should end up looking like: the same picture, encoded the
  // same way, that never carried a mark.
  const reference = await roundTripJpeg(original, 72)

  const working = clone(jpeg)
  const res = eraseWatermark(working, maps)
  check(res.status !== 'not-detected', `jpeg72 ${bg}: detected (status=${res.status})`)
  if (res.status === 'not-detected') continue
  check(res.status === 'inpainted', `jpeg72 ${bg}: ringing triggered a repair pass (status=${res.status})`)

  const left = markLeftover(working, alphaMap, x, y, config.logoSize)
  check(left <= 0.04, `jpeg72 ${bg}: sparkle gone (leftover=${left.toFixed(4)})`)

  const before = regionError(jpeg, reference, x - 6, y - 6, config.logoSize + 12)
  const after = regionError(working, reference, x - 6, y - 6, config.logoSize + 12)
  check(
    after.mean <= 3 && after.mean < before.mean / 3,
    `jpeg72 ${bg}: region matches an unmarked encode (mean ${before.mean.toFixed(2)} -> ${after.mean.toFixed(2)})`,
  )
}

if (failures > 0) {
  console.error(`\n${failures}/${checks} FAILED`)
  process.exit(1)
}
console.log(`\nall ${checks} checks passed`)
