// lib/ai/openai.ts
import OpenAI from 'openai'
import type { GenerationExtras, GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

export class OpenAIProvider {
  name = 'openai'
  private client: OpenAI
  private model: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    this.model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    this.client = new OpenAI({ apiKey })
  }

  async generate(opts: Selections, mode: GenerationMode, extras?: GenerationExtras): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const userPrompt = buildUserPrompt(opts, mode, extras)

    const call = async (extraInstruction = '') => {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + (extraInstruction ? `\n\n${extraInstruction}` : '') },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
      })
      const text = completion.choices[0]?.message?.content ?? ''
      return JSON.parse(text) as { prompt: string; songs: GenerationResult['songs'] }
    }

    let parsed
    try {
      parsed = await call()
    } catch {
      parsed = await call('이전 응답이 JSON 스키마를 어겼습니다. 반드시 {"prompt": string, "songs": null | Array<{title,titles,concept,stylePrompt,lyrics,lyricsKr}>} 형태로만 답하세요.')
    }
    return { mode, prompt: parsed.prompt, songs: mode !== 'prompt-only' ? parsed.songs : null }
  }
}
