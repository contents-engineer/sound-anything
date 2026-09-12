// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import type { ApiError, ApiRequest, GenerationExtras, GenerationResult } from '@/types'
import { TRACK_ROLES } from '@/types'
import { RateLimitError } from '@/lib/ai/errors'
import { getProvider } from '@/lib/ai/provider'
import { isEmptySelections } from '@/lib/promptBuilder'
import { makeBudget } from '@/lib/timeouts'

export const runtime = 'nodejs'

function err(code: ApiError['error']['code'], message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status })
}

function expectedCount(mode: GenerationResult['mode']): number {
  if (mode === 'full') return 10
  if (mode === 'single') return 1
  return 0
}

export async function POST(req: Request) {
  let body: ApiRequest
  try {
    body = (await req.json()) as ApiRequest
  } catch {
    return err('LLM_ERROR', 'Invalid JSON body', 400)
  }

  if (!body?.selections || !body?.mode) return err('LLM_ERROR', 'selections and mode are required', 400)
  if (isEmptySelections(body.selections)) return err('EMPTY_SELECTION', '최소 1개 옵션을 선택해주세요', 400)

  const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim().length > 0 ? body.apiKey.trim() : undefined

  let provider
  try {
    provider = getProvider(body.model, apiKey)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown provider error'
    return err('MISSING_API_KEY', message, 500)
  }

  const extras: GenerationExtras = {}
  if (body.excludeTitles && body.excludeTitles.length > 0) extras.excludeTitles = body.excludeTitles
  if (typeof body.retryHint === 'string' && body.retryHint.trim().length > 0) extras.retryHint = body.retryHint.trim().slice(0, 500)

  // 요청 1건의 시간 예산. 개수 불일치 재요청도 이 예산을 나눠 쓴다 —
  // 각 호출이 재시도 대기를 새로 시작하면 브라우저 타임아웃을 넘긴다.
  const budget = makeBudget(body.mode)
  const startedAt = Date.now()

  try {
    let partial = await provider.generate(body.selections, body.mode, extras, budget)

    const want = expectedCount(body.mode)
    if (body.mode !== 'prompt-only' && want > 0) {
      const got = partial.songs?.length ?? 0
      if (got !== want) {
        // 남은 예산으로 한 번 더 시도할 수 있을 때만 재요청한다. 무료 티어에서는
        // 이 재요청이 하루 한도를 두 배로 먹으면서 타임아웃까지 유발했다.
        if (Date.now() + budget.minAttemptMs > budget.hardDeadline) {
          console.warn(`[generate] mode=${body.mode} songs=${got}/${want} — 남은 예산 부족으로 재요청 생략`)
        } else {
          const countHint = `이전 응답의 songs 배열은 ${got}개였습니다. 반드시 정확히 ${want}개여야 합니다. 누락된 곡을 채워 다시 만들고, 모든 곡의 콘셉트·제목·stylePrompt·가사를 서로 다르게 작성하세요.`
          const retryHint = [extras.retryHint, countHint].filter(Boolean).join(' ')
          partial = await provider.generate(body.selections, body.mode, { ...extras, retryHint }, budget)
        }
      }
    }

    const result: GenerationResult = {
      ...partial,
      songs: partial.songs
        ? partial.songs.map((s) => ({
            ...s,
            ...(Array.isArray(s.excludeStyles) ? { excludeStyles: s.excludeStyles.slice(0, 5) } : {}),
            trackRole:
              s.trackRole && (TRACK_ROLES as readonly string[]).includes(s.trackRole) ? s.trackRole : null,
          }))
        : partial.songs,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const elapsed = Date.now() - startedAt
    if (e instanceof RateLimitError) {
      console.warn(`[generate] mode=${body.mode} RATE_LIMITED after ${elapsed}ms: ${e.message}`)
      return err('RATE_LIMITED', e.message, 429)
    }
    const message = e instanceof Error ? e.message : 'LLM error'
    console.error(`[generate] mode=${body.mode} LLM_ERROR after ${elapsed}ms: ${message}`)
    return err('LLM_ERROR', message, 502)
  }
}
