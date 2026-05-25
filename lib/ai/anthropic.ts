// lib/ai/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

const TOOL = {
  name: 'submit_playlist',
  description: 'Return the generated music-gen prompt and song concepts.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prompt: { type: 'string' },
      songs: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            titles: {
              type: 'object',
              properties: {
                ko: { type: 'string' },
                en: { type: 'string' },
                ja: { type: 'string' },
              },
              required: ['ko', 'en', 'ja'],
            },
            concept: { type: 'string' },
            lyrics: { type: 'string' },
            lyricsKr: { type: 'string' },
          },
          required: ['title', 'titles', 'concept', 'lyrics', 'lyricsKr'],
        },
      },
    },
    required: ['prompt', 'songs'],
  },
}

export class AnthropicProvider {
  name = 'anthropic'
  private client: Anthropic
  private model: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'
    this.client = new Anthropic({ apiKey })
  }

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const userPrompt = buildUserPrompt(opts, mode)

    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'submit_playlist' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    const toolUse = msg.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Anthropic did not return tool_use block')
    const input = toolUse.input as { prompt: string; songs: GenerationResult['songs'] }
    return { mode, prompt: input.prompt, songs: mode === 'full' ? input.songs : null }
  }
}
