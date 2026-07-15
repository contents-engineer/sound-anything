// lib/models.ts
export type ModelOption = {
  id: string
  label: string
}

export const MODELS: ModelOption[] = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (품질 우선)' },
]

export const DEFAULT_MODEL_ID: string = MODELS[0].id
