// lib/apiKey.ts
// The Gemini API key lives only in the browser (localStorage) and is sent
// per-request to /api/generate — the server never stores it.
const KEY = 'suno-lyrics:gemini-api-key'
const YT_KEY = 'playlist:youtube-api-key'

export function loadApiKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveApiKey(value: string): void {
  try {
    window.localStorage.setItem(KEY, value)
    window.dispatchEvent(new CustomEvent('api-keys-updated'))
  } catch { /* ignore */ }
}

export function clearApiKey(): void {
  try {
    window.localStorage.removeItem(KEY)
    window.dispatchEvent(new CustomEvent('api-keys-updated'))
  } catch { /* ignore */ }
}

export function loadYoutubeApiKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(YT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveYoutubeApiKey(value: string): void {
  try {
    window.localStorage.setItem(YT_KEY, value)
    window.dispatchEvent(new CustomEvent('api-keys-updated'))
  } catch { /* ignore */ }
}

export function clearYoutubeApiKey(): void {
  try {
    window.localStorage.removeItem(YT_KEY)
    window.dispatchEvent(new CustomEvent('api-keys-updated'))
  } catch { /* ignore */ }
}
