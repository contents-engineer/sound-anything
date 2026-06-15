// lib/models.ts
export type ModelOption = {
  id: string
  label: string
}

export const MODELS: ModelOption[] = [
  { id: 'gemini-3.5-flash',      label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
]

export const DEFAULT_MODEL_ID: string = MODELS[0].id
