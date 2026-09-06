// lib/ai/errors.ts
// Thrown when the upstream LLM API rejects a request for quota reasons
// (e.g. Gemini free-tier per-minute/per-day limits) after retries.
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}
