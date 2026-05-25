// lib/history.ts
import type { GenerationResult } from '@/types'

const KEY = 'tubemaster-clone:history'
const MAX = 20

export function loadHistory(): GenerationResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GenerationResult[]) : []
  } catch {
    return []
  }
}

export function pushHistory(entry: GenerationResult): GenerationResult[] {
  const next = [entry, ...loadHistory()].slice(0, MAX)
  window.localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  window.localStorage.removeItem(KEY)
}
