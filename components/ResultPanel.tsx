// components/ResultPanel.tsx
'use client'

import { useState } from 'react'
import type { GenerationResult } from '@/types'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
    >
      {copied ? '복사됨' : '복사'}
    </button>
  )
}

export function ResultPanel({ result }: { result: GenerationResult }) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">통합 프롬프트</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{result.provider}</span>
            <CopyButton text={result.prompt} />
          </div>
        </header>
        <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm text-zinc-800">{result.prompt}</p>
      </article>

      {result.songs && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.songs.map((s, i) => (
            <article key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <header className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900">{i + 1}. {s.title}</h4>
                <CopyButton text={`${s.title}\n\n${s.concept}`} />
              </header>
              <p className="text-sm leading-relaxed text-zinc-700">{s.concept}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
