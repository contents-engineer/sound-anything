// lib/ai/gemini.ts
import { GoogleGenAI, Type } from '@google/genai'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
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
    lyrics:   { type: Type.STRING },
    lyricsKr: { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'lyrics', 'lyricsKr'],
}

export class GeminiProvider {
  name = 'gemini'
  private client: GoogleGenAI
  private model: string

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const userPrompt = buildUserPrompt(opts, mode)

    const schema = mode === 'full'
      ? {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            songs:  { type: Type.ARRAY, items: SONG_SCHEMA },
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
        temperature: 0.9,
      },
    })

    const text = resp.text ?? ''
    const parsed = JSON.parse(text) as { prompt: string; songs?: GenerationResult['songs'] }
    return { mode, prompt: parsed.prompt, songs: mode === 'full' ? parsed.songs ?? null : null }
  }
}
