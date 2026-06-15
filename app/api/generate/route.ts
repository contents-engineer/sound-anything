// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import type { ApiError, ApiRequest, GenerationResult } from '@/types'
import { getProvider } from '@/lib/ai/provider'
import { isEmptySelections } from '@/lib/promptBuilder'

export const runtime = 'nodejs'

function err(code: ApiError['error']['code'], message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status })
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

  try {
    const partial = await provider.generate(body.selections, body.mode)
    const result: GenerationResult = {
      ...partial,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM error'
    return err('LLM_ERROR', message, 502)
  }
}
