// components/GrammarCheckModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { GrammarCheckResult } from '@/types'

type Props = {
  open: boolean
  loading: boolean
  result: GrammarCheckResult | null
  error: string | null
  onClose: () => void
}

export function GrammarCheckModal({ open, loading, result, error, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function copyCorrected() {
    if (!result) return
    await navigator.clipboard.writeText(result.corrected)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="맞춤법 확인 결과"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-xl">✏️</span>
            <h3 className="text-base font-semibold text-zinc-900">맞춤법 확인 결과</h3>
            {result && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {result.provider}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <span>가사를 검토 중입니다…</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              ⚠ {error}
            </div>
          )}

          {result && !loading && (
            <div className="flex flex-col gap-5">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-700">
                    수정 사항 {result.corrections.length}건
                  </h4>
                </div>
                {result.corrections.length === 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    ✅ 명백한 문법 오류가 발견되지 않았습니다.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {result.corrections.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-700 line-through">
                            {c.from}
                          </span>
                          <span aria-hidden className="text-zinc-400">→</span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700">
                            {c.to}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-zinc-600">{c.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-700">교정된 가사</h4>
                  <button
                    type="button"
                    onClick={copyCorrected}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-800">
                  {result.corrected}
                </pre>
              </section>
            </div>
          )}
        </div>

        <footer className="border-t border-zinc-200 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            닫기
          </button>
        </footer>
      </div>
    </div>
  )
}
