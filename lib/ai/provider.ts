// lib/ai/provider.ts
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { MockProvider } from '@/lib/ai/mock'

export interface AIProvider {
  name: string
  generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>>
}

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? 'mock').toLowerCase()
  switch (name) {
    case 'mock':
      return new MockProvider()
    case 'openai':
    case 'anthropic':
    case 'gemini':
      throw new Error(`Provider "${name}" is not yet implemented. Run with AI_PROVIDER=mock for now.`)
    default:
      throw new Error(`Unknown AI_PROVIDER: ${name}`)
  }
}
