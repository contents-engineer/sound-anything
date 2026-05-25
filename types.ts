// types.ts
export type GenerationMode = 'prompt-only' | 'full'

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
  genre: string[]
  mood: string[]
  vocal: string[]
  usage: string[]
  instrument: string[]
  bpm: string | null
  age: string | null
  language: string | null
  topic: string[]
  lengthMin: number
  customInputs: Partial<Record<SectionKey, string>>
}

export type SongConcept = {
  title: string
  concept: string
  lyrics: string
}

export type GenerationResult = {
  mode: GenerationMode
  prompt: string
  songs: SongConcept[] | null
  generatedAt: string
  provider: string
}

export type ApiError = {
  error: { code: 'EMPTY_SELECTION' | 'MISSING_API_KEY' | 'LLM_ERROR' | 'INVALID_RESPONSE'; message: string }
}

export type ApiRequest = {
  selections: Selections
  mode: GenerationMode
}
