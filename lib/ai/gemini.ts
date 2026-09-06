// lib/ai/gemini.ts
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai'
import type { GenerationExtras, GenerationMode, GenerationResult, Selections } from '@/types'
import { STYLE_INFLUENCE_LEVELS, TRACK_ROLES, WEIRDNESS_LEVELS } from '@/types'
import { RateLimitError } from '@/lib/ai/errors'
import { DEFAULT_MODEL_ID } from '@/lib/models'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

// Free-tier (AI Studio, no billing) keys hit low per-minute quotas; retry 429s
// instead of failing outright. The client aborts at 60s (single) / 120s (full),
// so total retry wait must stay well under that.
const MAX_RETRIES = 2
const MAX_RETRY_DELAY_MS = 20_000

function isRateLimit(e: unknown): e is ApiError {
  return e instanceof ApiError && e.status === 429
}

function isDailyQuota(e: ApiError): boolean {
  // Quota violation details name the exceeded metric, e.g. "GenerateRequestsPerDayPerProjectPerModel".
  return /perday|per day|daily/i.test(e.message)
}

function retryDelayMs(e: ApiError, attempt: number): number {
  // The 429 body suggests a wait via RetryInfo, serialized as `"retryDelay":"7s"`.
  const m = e.message.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/)
  const suggested = m ? Math.ceil(parseFloat(m[1]) * 1000) : (attempt + 1) * 5_000
  return Math.min(suggested, MAX_RETRY_DELAY_MS)
}

const TITLES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ko: { type: Type.STRING },
    en: { type: Type.STRING },
    ja: { type: Type.STRING },
  },
  required: ['ko', 'en', 'ja'],
}

const SLIDER_HINT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    weirdness: { type: Type.STRING, format: 'enum', enum: [...WEIRDNESS_LEVELS] },
    styleInfluence: { type: Type.STRING, format: 'enum', enum: [...STYLE_INFLUENCE_LEVELS] },
    note: { type: Type.STRING },
  },
  required: ['weirdness', 'styleInfluence', 'note'],
}

const SONG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title:    { type: Type.STRING },
    titles:   TITLES_SCHEMA,
    concept:  { type: Type.STRING },
    stylePrompt: { type: Type.STRING },
    excludeStyles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: '2',
      maxItems: '5',
    },
    sliderHint: SLIDER_HINT_SCHEMA,
    trackRole: { type: Type.STRING, format: 'enum', enum: [...TRACK_ROLES], nullable: true },
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'trackRole', 'lyrics'],
}

export class GeminiProvider {
  name = 'gemini'
  private client: GoogleGenAI
  private model: string

  constructor(modelOverride?: string, apiKey?: string) {
    if (!apiKey) throw new Error('Gemini API 키가 없습니다. 화면 우측 상단에서 API 키를 등록해주세요.')
    this.model = modelOverride ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL_ID
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(opts: Selections, mode: GenerationMode, extras?: GenerationExtras): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const userPrompt = buildUserPrompt(opts, mode, extras)
    const songCount = mode === 'full' ? 10 : mode === 'single' ? 1 : 0

    const schema = mode !== 'prompt-only'
      ? {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            songs:  {
              type: Type.ARRAY,
              items: SONG_SCHEMA,
              minItems: String(songCount),
              maxItems: String(songCount),
            },
          },
          required: ['prompt', 'songs'],
        }
      : {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
          },
          required: ['prompt'],
        }

    const request = {
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: schema,
        // Gemini 3.x is tuned for default sampling — do not set temperature/topP/topK.
        thinkingConfig: {
          // Flash-Lite already defaults to MINIMAL; heavier models default up to HIGH,
          // which inflates time-to-first-token past this app's client timeout.
          thinkingLevel: this.model.includes('lite') ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW,
        },
        maxOutputTokens: mode === 'full' ? 32768 : 8192,
      },
    }

    let resp
    for (let attempt = 0; ; attempt++) {
      try {
        resp = await this.client.models.generateContent(request)
        break
      } catch (e: unknown) {
        if (e instanceof ApiError && (e.status === 400 || e.status === 403) && /api[ _]?key/i.test(e.message)) {
          throw new Error('Gemini API 키가 유효하지 않습니다. 우측 상단에서 키를 다시 등록해주세요.')
        }
        if (!isRateLimit(e)) throw e
        if (isDailyQuota(e)) {
          throw new RateLimitError('Gemini API 일일 무료 사용량을 모두 사용했습니다. 내일 다시 시도하거나 다른 모델을 선택해주세요.')
        }
        if (attempt >= MAX_RETRIES) {
          throw new RateLimitError('Gemini API 분당 요청 한도를 초과했습니다. 잠시(약 1분) 후 다시 시도해주세요.')
        }
        await new Promise((r) => setTimeout(r, retryDelayMs(e, attempt)))
      }
    }

    const text = resp.text ?? ''
    const parsed = JSON.parse(text) as { prompt: string; songs?: GenerationResult['songs'] }
    return { mode, prompt: parsed.prompt, songs: mode !== 'prompt-only' ? parsed.songs ?? null : null }
  }
}
