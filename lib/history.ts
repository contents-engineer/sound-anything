// lib/history.ts
import type { GenerationResult } from '@/types'

const KEY = 'suno-lyrics:history'
const LEGACY_KEY = 'tubemaster-clone:history'
const MAX = 20

function migrateLegacy(): void {
  try {
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy && !window.localStorage.getItem(KEY)) {
      window.localStorage.setItem(KEY, legacy)
    }
    if (legacy) window.localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore migration failure
  }
}

export function loadHistory(): GenerationResult[] {
  if (typeof window === 'undefined') return []
  try {
    migrateLegacy()
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GenerationResult[]) : []
  } catch {
    return []
  }
}

function trySet(items: GenerationResult[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

export function pushHistory(entry: GenerationResult): GenerationResult[] {
  let next = [entry, ...loadHistory()].slice(0, MAX)
  while (next.length > 0) {
    if (trySet(next)) return next
    next = next.slice(0, Math.max(1, Math.floor(next.length / 2)))
    if (next.length === 1 && trySet(next)) return next
    if (next.length === 1) {
      try { window.localStorage.removeItem(KEY) } catch { /* ignore */ }
      return []
    }
  }
  return next
}

export function clearHistory(): void {
  try { window.localStorage.removeItem(KEY) } catch { /* ignore */ }
}
