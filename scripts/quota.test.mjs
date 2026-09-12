// scripts/quota.test.mjs
//
// lib/ai/quota.ts 회귀 테스트. 실제 Gemini 429 응답 본문 모양(ApiError.message는
// 응답 본문 전체의 JSON.stringify 결과)에 대해 일일/분당 구분·대기시간·로그 요약을 검증한다.
// 실행: node scripts/quota.test.mjs
import assert from 'node:assert/strict'
import { isDailyQuota, quotaSummary, retryDelayMs } from '../lib/ai/quota.ts'

const MAX = 10_000

// 무료 티어 분당 한도 초과
const PER_MINUTE = JSON.stringify({
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [{
          quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests',
          quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier',
          quotaDimensions: { model: 'gemini-3.8-flash', location: 'global' },
          quotaValue: '10',
        }],
      },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '31s' },
    ],
  },
})

// 무료 티어 일일 한도 초과
const PER_DAY = JSON.stringify({
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [{
          quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests',
          quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
          quotaDimensions: { model: 'gemini-3.8-flash', location: 'global' },
          quotaValue: '20',
        }],
      },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '25s' },
    ],
  },
})

// 쿼터 상세 없이 오는 429도 있다
const BARE = JSON.stringify({
  error: { code: 429, message: 'Resource has been exhausted (e.g. check quota).', status: 'RESOURCE_EXHAUSTED' },
})

let pass = 0
function check(name, fn) { fn(); pass++; console.log(`  ok  ${name}`) }

check('분당 한도는 일일 한도로 오인하지 않는다', () => {
  assert.equal(isDailyQuota(PER_MINUTE), false)
})

check('일일 한도를 인식한다', () => {
  assert.equal(isDailyQuota(PER_DAY), true)
})

check('상세 없는 429는 일일 한도로 보지 않는다', () => {
  assert.equal(isDailyQuota(BARE), false)
})

check('상류가 제안한 retryDelay를 읽고 상한을 적용한다', () => {
  // 31s를 제안했지만 상한 10s를 넘길 수 없다
  assert.equal(retryDelayMs(PER_MINUTE, 0, MAX), 10_000)
  assert.equal(retryDelayMs(PER_MINUTE, 0, 60_000), 31_000)
})

check('retryDelay가 없으면 시도 횟수 기반 기본값', () => {
  assert.equal(retryDelayMs(BARE, 0, 60_000), 5_000)
  assert.equal(retryDelayMs(BARE, 1, 60_000), 10_000)
  assert.equal(retryDelayMs(BARE, 1, MAX), 10_000)
})

check('로그 요약에 쿼터 종류·한도·대기시간이 들어간다', () => {
  const s = quotaSummary(PER_DAY)
  assert.match(s, /quotaId=GenerateRequestsPerDayPerProjectPerModel-FreeTier/)
  assert.match(s, /limit=20/)
  assert.match(s, /retryDelay=25s/)
  assert.match(s, /free_tier_requests/)
})

check('상세 없는 429도 본문을 남긴다', () => {
  assert.match(quotaSummary(BARE), /Resource has been exhausted/)
})

console.log(`\n${pass} passed`)
