// lib/ai/openai.ts
import OpenAI from 'openai'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

export class OpenAIProvider {
  name = 'openai'

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    const client = new OpenAI({ apiKey })

    const userPrompt = buildUserPrompt(opts, mode)

    const call = async (extraInstruction = '') => {
      const completion = await client.chat.completions.create({
        model,
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
      parsed = await call('이전 응답이 JSON 스키마를 어겼습니다. 반드시 {"prompt": string, "songs": null | Array<{title,concept}>} 형태로만 답하세요.')
    }
    return { mode, prompt: parsed.prompt, songs: mode === 'full' ? parsed.songs : null }
  }
}
