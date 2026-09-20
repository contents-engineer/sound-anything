// lib/ai/gemini.ts
import { ApiError, GoogleGenAI, ThinkingLevel, Type } from '@google/genai'
import type { GenerationExtras, GenerationMode, GenerationResult, Selections } from '@/types'
import { MAX_MODE_OPTIONS, STYLE_INFLUENCE_LEVELS, SUNO_MODELS, TRACK_ROLES, VARIETY_LEVELS, WEIRDNESS_LEVELS } from '@/types'
import { RateLimitError } from '@/lib/ai/errors'
import { DEFAULT_MODEL_ID } from '@/lib/models'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'
import type { GenerateBudget } from '@/lib/timeouts'
import { canWaitFor, makeBudget } from '@/lib/timeouts'
import { isDailyQuota, quotaSummary, retryDelayMs } from '@/lib/ai/quota'

// Free-tier (AI Studio, no billing) keys hit very low quotas — roughly 20 requests
// per day per model on Gemini 3.x Flash. Retry a 429 only while the request's time
// budget still leaves room for a real attempt (see lib/timeouts.ts): sleeping past
// the browser's abort turns a quota error into a useless "timed out" message.
const MAX_RETRIES = 2
const MAX_RETRY_DELAY_MS = 10_000

function isRateLimit(e: unknown): e is ApiError {
  return e instanceof ApiError && e.status === 429
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
    variety: { type: Type.STRING, format: 'enum', enum: [...VARIETY_LEVELS] },
    maxMode: { type: Type.STRING, format: 'enum', enum: [...MAX_MODE_OPTIONS] },
    durationSliderNote: { type: Type.STRING, nullable: true },
    note: { type: Type.STRING },
  },
  required: ['weirdness', 'styleInfluence', 'variety', 'maxMode', 'note'],
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
    recommendedModel: { type: Type.STRING, format: 'enum', enum: [...SUNO_MODELS] },
    sliderHint: SLIDER_HINT_SCHEMA,
    trackRole: { type: Type.STRING, format: 'enum', enum: [...TRACK_ROLES], nullable: true },
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'recommendedModel', 'sliderHint', 'trackRole', 'lyrics'],
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

  async generate(
    opts: Selections,
    mode: GenerationMode,
    extras?: GenerationExtras,
    budget: GenerateBudget = makeBudget(mode),
  ): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
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

    const t0 = Date.now()
    let resp
    for (let attempt = 0; ; attempt++) {
      // 남은 시간이 한 번의 시도에도 못 미치면 상류를 부르지 않고 바로 알린다.
      const remaining = budget.hardDeadline - Date.now()
      if (remaining <= 0) {
        throw new RateLimitError('Gemini API 응답을 기다릴 시간이 남지 않았습니다. 잠시 후 다시 시도해주세요.')
      }
      const startedAt = Date.now()
      try {
        // 상류 fetch 자체에 마감을 걸어둔다 — 없으면 브라우저가 끊은 뒤에도 서버 요청이 계속 살아있다.
        resp = await this.client.models.generateContent({
          ...request,
          config: { ...request.config, httpOptions: { timeout: remaining } },
        })
        break
      } catch (e: unknown) {
        const elapsed = Date.now() - startedAt
        if (e instanceof ApiError && (e.status === 400 || e.status === 403) && /api[ _]?key/i.test(e.message)) {
          throw new Error('Gemini API 키가 유효하지 않습니다. 우측 상단에서 키를 다시 등록해주세요.')
        }
        if (!isRateLimit(e)) {
          console.error(`[gemini] model=${this.model} mode=${mode} attempt=${attempt} elapsed=${elapsed}ms status=${e instanceof ApiError ? e.status : 'n/a'} ${e instanceof Error ? e.message.slice(0, 300) : String(e)}`)
          throw e
        }
        console.warn(`[gemini] 429 model=${this.model} mode=${mode} attempt=${attempt} elapsed=${elapsed}ms ${quotaSummary(e.message)}`)
        if (isDailyQuota(e.message)) {
          throw new RateLimitError('Gemini API 일일 사용량을 모두 사용했습니다. 무료 티어는 모델별로 하루 약 20건뿐입니다. 한도는 미국 태평양시 자정(한국시간 오후 4~5시경)에 초기화됩니다.')
        }
        const delay = retryDelayMs(e.message, attempt, MAX_RETRY_DELAY_MS)
        if (attempt >= MAX_RETRIES || !canWaitFor(budget, delay)) {
          throw new RateLimitError('Gemini API 분당 요청 한도를 초과했습니다. 잠시(약 1분) 후 다시 시도해주세요. 무료 티어 키라면 하루 한도(모델별 약 20건)도 함께 확인해주세요.')
        }
        await new Promise((r) => setTimeout(r, delay))
      }
    }

    const usage = resp.usageMetadata
    // serviceTier는 응답 JSON에는 있지만 SDK 타입에는 아직 없다 — 무료/유료 판별에 쓰인다.
    const tier = (usage as { serviceTier?: string } | undefined)?.serviceTier
    const finish = resp.candidates?.[0]?.finishReason
    console.info(
      `[gemini] ok model=${this.model} mode=${mode} elapsed=${Date.now() - t0}ms finish=${finish ?? 'n/a'} ` +
      `tier=${tier ?? 'n/a'} in=${usage?.promptTokenCount ?? '?'} out=${usage?.candidatesTokenCount ?? '?'}`,
    )

    const text = resp.text ?? ''
    let parsed: { prompt: string; songs?: GenerationResult['songs'] }
    try {
      parsed = JSON.parse(text) as { prompt: string; songs?: GenerationResult['songs'] }
    } catch {
      // MAX_TOKENS로 잘린 응답은 JSON이 깨진다 — 원인을 그대로 알린다.
      if (finish === 'MAX_TOKENS') {
        throw new Error('응답이 출력 토큰 한도에서 잘렸습니다. 곡 수를 줄이거나 다시 시도해주세요.')
      }
      throw new Error(`Gemini 응답을 JSON으로 해석할 수 없습니다 (finishReason=${finish ?? 'n/a'})`)
    }
    return { mode, prompt: parsed.prompt, songs: mode !== 'prompt-only' ? parsed.songs ?? null : null }
  }
}
