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

if (failures > 0) {
  console.error(`\n${failures}/${checks} FAILED`)
  process.exit(1)
}
console.log(`\nall ${checks} checks passed`)
