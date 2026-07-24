// types.ts
export type GenerationMode = 'prompt-only' | 'single' | 'full'

export type SectionKey =
  | 'genre'
  | 'mood'
  | 'vocal'
  | 'usage'
  | 'instrument'
  | 'bpm'
  | 'age'
  | 'language'
  | 'topic'

export type Selections = {
  genre: string | null
  mood: string[]
  vocal: string[]
  usage: string | null
  instrument: string[]
  bpm: string | null
  age: string | null
  language: string | null
  topic: string[]
  lengthMin: number
  customInputs: Partial<Record<SectionKey, string>>
}

export const WEIRDNESS_LEVELS = ['0-20%', '20-40%', '40-60%', '60-80%'] as const
export const STYLE_INFLUENCE_LEVELS = ['30-50%', '50-70%', '70-100%'] as const

export type SliderHint = {
  weirdness: (typeof WEIRDNESS_LEVELS)[number]
  styleInfluence: (typeof STYLE_INFLUENCE_LEVELS)[number]
  note: string
}

export type SongConcept = {
  title: string
  titles: { ko: string; en: string; ja: string }
  concept: string
  stylePrompt: string
  excludeStyles?: string[]
  sliderHint?: SliderHint
  lyrics: string
}

export type GenerationResult = {
  mode: GenerationMode
  prompt: string
  songs: SongConcept[] | null
  generatedAt: string
  provider: string
  selections?: Selections
}

export type ApiError = {
  error: { code: 'EMPTY_SELECTION' | 'MISSING_API_KEY' | 'LLM_ERROR' | 'INVALID_RESPONSE'; message: string }
}

export type ApiRequest = {
  selections: Selections
  mode: GenerationMode
  model?: string
  excludeTitles?: string[]
}

export type GenerationExtras = {
  excludeTitles?: string[]
  retryHint?: string
}
