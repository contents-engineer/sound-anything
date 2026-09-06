// lib/apiKey.ts
// The Gemini API key lives only in the browser (localStorage) and is sent
// per-request to /api/generate — the server never stores it.
const KEY = 'suno-lyrics:gemini-api-key'

export function loadApiKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(value: string): void {
  try { window.localStorage.setItem(KEY, value) } catch { /* ignore */ }
}

export function clearApiKey(): void {
  try { window.localStorage.removeItem(KEY) } catch { /* ignore */ }
}
