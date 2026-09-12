// lib/timeouts.ts
// 생성 요청의 시간 예산을 브라우저와 서버가 같은 숫자로 공유한다.
// 이 값들이 어긋나면 서버가 429 재시도로 잠들어 있는 동안 브라우저가 먼저
// 요청을 끊어버려서, 사용자에게는 원인(쿼터 초과)이 아니라 "시간 초과"만 보인다.
import type { GenerationMode } from '@/types'

/** 브라우저가 요청을 포기하는 시점 */
export const CLIENT_TIMEOUT_MS: Record<GenerationMode, number> = {
  'prompt-only': 60_000,
  single: 60_000,
  full: 120_000,
}

/** 상류 API 호출 1건이 이 시각을 넘기면 끊는다 — 브라우저 abort보다 먼저 끝나야 한다. */
const UPSTREAM_MARGIN_MS = 5_000

/** 한 번의 생성 시도에 최소한 남겨둬야 하는 시간 (유료 기준 single 11초 / full 30초) */
const MIN_ATTEMPT_MS: Record<GenerationMode, number> = {
  'prompt-only': 20_000,
  single: 20_000,
  full: 45_000,
}

export type GenerateBudget = {
  /** 이 시각을 넘겨서는 상류 요청을 시작하지 않는다 (절대 시각, ms) */
  hardDeadline: number
  /** 이 시각 이후로는 429 재시도 대기를 하지 않고 즉시 사용자에게 알린다 */
  retryDeadline: number
  /** 한 번의 시도에 남겨둘 최소 시간 */
  minAttemptMs: number
}

/**
 * 지금 delayMs만큼 잠들었다가 한 번 더 시도할 시간이 남아 있는가.
 * 남지 않았다면 기다리지 말고 즉시 쿼터 초과를 알려야 한다 —
 * 브라우저가 먼저 끊으면 사용자는 원인을 볼 수 없다.
 */
export function canWaitFor(budget: GenerateBudget, delayMs: number, now = Date.now()): boolean {
  return now + delayMs + budget.minAttemptMs <= budget.retryDeadline
}

/**
 * 요청 1건(= 사용자의 버튼 1회)에 대한 예산을 만든다.
 * 개수 불일치 재요청처럼 같은 요청 안에서 상류를 두 번 부르는 경로는
 * 이 객체를 그대로 공유해서 예산을 나눠 쓴다 — 각자 새로 40초씩 잠들면 안 된다.
 */
export function makeBudget(mode: GenerationMode, now = Date.now()): GenerateBudget {
  const clientTimeout = CLIENT_TIMEOUT_MS[mode]
  const minAttemptMs = MIN_ATTEMPT_MS[mode]
  return {
    hardDeadline: now + clientTimeout - UPSTREAM_MARGIN_MS,
    // 대기 마감 = 브라우저 abort에서 "한 번의 온전한 생성 시간 + 여유"를 뺀 시각.
    // 이렇게 잡아야 첫 429는 재시도해보고, 늦게 온 429는 기다리지 않고 바로 알린다.
    retryDeadline: now + clientTimeout - minAttemptMs - UPSTREAM_MARGIN_MS,
    minAttemptMs,
  }
}
