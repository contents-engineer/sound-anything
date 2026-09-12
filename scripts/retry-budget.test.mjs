// scripts/retry-budget.test.mjs
//
// lib/timeouts.ts 회귀 테스트. 무료 티어 429가 "시간 초과"로 위장되던 버그를 막는다:
// 서버의 재시도 대기가 브라우저 abort보다 먼저 끝나야 한다.
// 실행: node scripts/retry-budget.test.mjs
import assert from 'node:assert/strict'
import { CLIENT_TIMEOUT_MS, canWaitFor, makeBudget } from '../lib/timeouts.ts'

const MODES = ['prompt-only', 'single', 'full']
const T0 = 1_000_000

let pass = 0
function check(name, fn) {
  fn()
  pass++
  console.log(`  ok  ${name}`)
}

// 대기 마감은 브라우저 abort보다 반드시 앞에 있어야 한다.
for (const mode of MODES) {
  check(`${mode}: 대기 마감 < 상류 마감 < 브라우저 abort`, () => {
    const b = makeBudget(mode, T0)
    const abortAt = T0 + CLIENT_TIMEOUT_MS[mode]
    assert.ok(b.retryDeadline < b.hardDeadline, 'retryDeadline이 hardDeadline보다 앞')
    assert.ok(b.hardDeadline < abortAt, 'hardDeadline이 브라우저 abort보다 앞')
  })
}

// 대기 후에도 한 번의 실제 생성 시간이 남아야만 잠든다.
check('single: 첫 429는 10초 대기 후 재시도 가능', () => {
  const b = makeBudget('single', T0)
  assert.equal(canWaitFor(b, 10_000, T0 + 1_000), true)
})

check('single: 두 번째 429는 대기하지 않고 즉시 알린다', () => {
  const b = makeBudget('single', T0)
  // 1초에 첫 429 → 10초 대기 → 12초에 두 번째 429.
  // 12 + 10 + 20(최소 생성) = 42s > 35s(대기 마감) → 기다리면 안 된다.
  assert.equal(canWaitFor(b, 10_000, T0 + 12_000), false)
})

check('full: 첫 429는 대기 가능, 늦게 온 429는 즉시 알린다', () => {
  const b = makeBudget('full', T0)
  assert.equal(canWaitFor(b, 10_000, T0 + 1_000), true)
  assert.equal(canWaitFor(b, 10_000, T0 + 20_000), false)
})

// 상류가 아무리 긴 retryDelay를 줘도 대기 마감을 넘기지 않는다.
for (const mode of MODES) {
  check(`${mode}: 과도한 retryDelay(60초)는 절대 대기하지 않는다`, () => {
    const b = makeBudget(mode, T0)
    assert.equal(canWaitFor(b, 60_000, T0), false)
  })
}

// 개수 불일치 재요청은 같은 예산을 공유한다 → 두 번째 호출은 대기 예산이 없다.
check('공유 예산: 첫 호출이 대기를 다 쓰면 두 번째 호출은 대기 못 함', () => {
  const b = makeBudget('single', T0)
  const afterFirstCall = T0 + 25_000 // 첫 generate가 25초를 썼다
  assert.equal(canWaitFor(b, 5_000, afterFirstCall), false)
  // 남은 예산이 한 번의 시도에도 못 미치면 재요청 자체를 건너뛴다 (route.ts 조건)
  assert.ok(afterFirstCall + b.minAttemptMs < b.hardDeadline, '25초 시점엔 아직 재요청 여지가 있다')
  assert.ok(T0 + 45_000 + b.minAttemptMs > b.hardDeadline, '45초 시점엔 재요청을 건너뛴다')
})

console.log(`\n${pass} passed`)
