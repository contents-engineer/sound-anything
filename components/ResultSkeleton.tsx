// components/ResultSkeleton.tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
  count: number
}

export function ResultSkeleton({ count }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - start) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="mt-6 flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-800">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" aria-hidden />
        <span>
          {count === 1 ? '1곡' : `${count}곡`} 생성 중… <span className="text-violet-500">({elapsed}초)</span>
        </span>
        <span className="ml-auto text-xs text-violet-600/80">길게는 30~60초 걸릴 수 있어요</span>
      </div>

      <div className="h-16 animate-pulse rounded-2xl bg-zinc-100" />

      <div className="flex flex-col gap-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
