// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import type { ApiError, ApiRequest, GenerationExtras, GenerationResult } from '@/types'
import { getProvider } from '@/lib/ai/provider'
import { isEmptySelections } from '@/lib/promptBuilder'

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

  let provider
  try {
    provider = getProvider(body.model)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown provider error'
    return err('MISSING_API_KEY', message, 500)
  }

  const extras: GenerationExtras = {}
  if (body.excludeTitles && body.excludeTitles.length > 0) extras.excludeTitles = body.excludeTitles

  try {
    let partial = await provider.generate(body.selections, body.mode, extras)

    const want = expectedCount(body.mode)
    if (body.mode !== 'prompt-only' && want > 0) {
      const got = partial.songs?.length ?? 0
      if (got !== want) {
        const retryHint = `이전 응답의 songs 배열은 ${got}개였습니다. 반드시 정확히 ${want}개여야 합니다. 누락된 곡을 채워 다시 만들고, 모든 곡의 콘셉트·제목·stylePrompt·가사를 서로 다르게 작성하세요.`
        partial = await provider.generate(body.selections, body.mode, { ...extras, retryHint })
      }
    }

    const result: GenerationResult = {
      ...partial,
      songs: partial.songs
        ? partial.songs.map((s) =>
            Array.isArray(s.excludeStyles) ? { ...s, excludeStyles: s.excludeStyles.slice(0, 5) } : s,
          )
        : partial.songs,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM error'
    return err('LLM_ERROR', message, 502)
  }
}
