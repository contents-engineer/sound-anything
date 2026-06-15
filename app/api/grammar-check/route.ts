// app/api/grammar-check/route.ts
import { NextResponse } from 'next/server'
import type { ApiError, GrammarCheckRequest, GrammarCheckResult } from '@/types'
import { getProvider } from '@/lib/ai/provider'

export const runtime = 'nodejs'

function err(code: ApiError['error']['code'], message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status })
}

export async function POST(req: Request) {
  let body: GrammarCheckRequest
  try {
    body = (await req.json()) as GrammarCheckRequest
  } catch {
    return err('LLM_ERROR', 'Invalid JSON body', 400)
  }

  const lyrics = body?.lyrics?.trim()
  if (!lyrics) return err('EMPTY_SELECTION', '가사 본문이 필요합니다', 400)

  let provider
  try {
    provider = getProvider()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown provider error'
    return err('MISSING_API_KEY', message, 500)
  }

  try {
    const partial = await provider.checkGrammar(lyrics, body.language ?? null)
    const result: GrammarCheckResult = {
      ...partial,
      provider: provider.name,
      checkedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM error'
    return err('LLM_ERROR', message, 502)
  }
}
