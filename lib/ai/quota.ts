// lib/ai/quota.ts
// Gemini 429 본문(RESOURCE_EXHAUSTED) 해석. @google/genai의 ApiError.message는
// 에러 응답 본문 전체를 JSON.stringify한 문자열이므로 QuotaFailure·RetryInfo 상세가 그대로 들어있다.
// 외부 의존이 없는 순수 함수만 둔다 (scripts/quota.test.mjs에서 그대로 검증).

/** 일일 한도 초과인가. 분당 한도와 달리 잠깐 기다려서 풀리지 않는다. */
export function isDailyQuota(body: string): boolean {
  // 위반 상세가 초과된 지표를 이름으로 알려준다. 예: "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
  return /perday|per day|daily/i.test(body)
}

/** 상류가 제안한 대기 시간(ms). 없으면 시도 횟수에 따른 기본값. maxMs로 상한을 둔다. */
export function retryDelayMs(body: string, attempt: number, maxMs: number): number {
  // RetryInfo는 `"retryDelay":"7s"` 형태로 직렬화된다.
  const m = body.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/)
  const suggested = m ? Math.ceil(parseFloat(m[1]) * 1000) : (attempt + 1) * 5_000
  return Math.min(suggested, maxMs)
}

/** 로그용 요약 — 어떤 쿼터가 얼마에서 걸렸는지. 본문에 API 키는 들어있지 않다. */
export function quotaSummary(body: string): string {
  const pick = (re: RegExp) => [...new Set([...body.matchAll(re)].map((m) => m[1]))]
  const ids = pick(/"quotaId"\s*:\s*"([^"]+)"/g)
  const metrics = pick(/"quotaMetric"\s*:\s*"([^"]+)"/g)
  const values = pick(/"quotaValue"\s*:\s*"?(\d+)/g)
  const delay = body.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/)?.[1]
  const parts = [
    ids.length ? `quotaId=${ids.join(',')}` : null,
    metrics.length ? `metric=${metrics.join(',')}` : null,
    values.length ? `limit=${values.join(',')}` : null,
    delay ? `retryDelay=${delay}s` : null,
  ].filter(Boolean)
  // 쿼터 상세가 아예 없는 429도 있다 — 그 경우 본문 앞부분이라도 남긴다.
  return parts.length ? parts.join(' ') : body.slice(0, 300)
}
