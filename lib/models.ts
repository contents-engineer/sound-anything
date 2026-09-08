// lib/models.ts
export type ModelOption = {
  id: string
  label: string
  /** 유료 티어 표준 요금 (1M 토큰 기준, USD) */
  pricing: {
    input: number
    output: number
    /** 프로모션가일 경우 종료일과 종료 후 정가 */
    promo?: {
      until: string
      afterInput: number
      afterOutput: number
    }
  }
  /** 무료 티어(요금 없이 사용, 비율 제한 있음) 지원 여부 */
  freeTier: boolean
  note: string
}

export const MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    pricing: {
      input: 0.75,
      output: 3.75,
      promo: { until: '2026-12-31', afterInput: 1.5, afterOutput: 7.5 },
    },
    freeTier: true,
    note: '최신 Flash. 프로모션가 적용 중',
  },
]

export const DEFAULT_MODEL_ID: string = MODELS[0].id

/** "$0.75 / $3.75 (1M 토큰, 입력/출력)" 형태의 표시 문자열 */
export function formatPricing(m: ModelOption): string {
  return `$${m.pricing.input} / $${m.pricing.output} · 1M 토큰(입력/출력)`
}

/** 프로모션 종료 안내 문구. 프로모션이 없으면 null */
export function formatPromo(m: ModelOption): string | null {
  const p = m.pricing.promo
  if (!p) return null
  return `${p.until}까지 프로모션가 · 이후 $${p.afterInput} / $${p.afterOutput}로 인상`
}
