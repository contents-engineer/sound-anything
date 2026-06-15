// lib/ai/provider.ts
import type { GenerationMode, GenerationResult, GrammarCheckResult, Selections } from '@/types'
import { MockProvider } from '@/lib/ai/mock'
import { OpenAIProvider } from '@/lib/ai/openai'
import { AnthropicProvider } from '@/lib/ai/anthropic'
import { GeminiProvider } from '@/lib/ai/gemini'

export interface AIProvider {
  name: string
  generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>>
  checkGrammar(lyrics: string, language?: string | null): Promise<Omit<GrammarCheckResult, 'checkedAt' | 'provider'>>
}

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? 'mock').toLowerCase()
  switch (name) {
    case 'mock':
      return new MockProvider()
    case 'openai':
      return new OpenAIProvider()
    case 'anthropic':
      return new AnthropicProvider()
    case 'gemini':
      return new GeminiProvider()
    default:
      throw new Error(`Unknown AI_PROVIDER: ${name}`)
  }
}
