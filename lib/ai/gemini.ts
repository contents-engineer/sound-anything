// lib/ai/gemini.ts
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai'
import type { GenerationExtras, GenerationMode, GenerationResult, Selections } from '@/types'
import { DEFAULT_MODEL_ID } from '@/lib/models'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

const TITLES_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ko: { type: Type.STRING },
    en: { type: Type.STRING },
    ja: { type: Type.STRING },
  },
  required: ['ko', 'en', 'ja'],
}

const SONG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title:    { type: Type.STRING },
    titles:   TITLES_SCHEMA,
    concept:  { type: Type.STRING },
    stylePrompt: { type: Type.STRING },
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'lyrics'],
}

export class GeminiProvider {
  name = 'gemini'
  private client: GoogleGenAI
  private model: string

  constructor(modelOverride?: string) {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')
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

    const resp = await this.client.models.generateContent({
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
    })

    const text = resp.text ?? ''
    const parsed = JSON.parse(text) as { prompt: string; songs?: GenerationResult['songs'] }
    return { mode, prompt: parsed.prompt, songs: mode !== 'prompt-only' ? parsed.songs ?? null : null }
  }
}
