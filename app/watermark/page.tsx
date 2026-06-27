// app/watermark/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '제미나이 워터마크 제거',
}

export default function WatermarkPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm">
        <div className="mb-4 text-4xl">🪄</div>
        <h2 className="text-xl font-bold text-zinc-900">제미나이 워터마크 제거</h2>
        <p className="mt-2 text-sm text-zinc-500">준비 중입니다</p>
      </div>
    </div>
  )
}
