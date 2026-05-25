// components/LengthSlider.tsx
'use client'

type Props = {
  value: number
  onChange: (v: number) => void
}

export function LengthSlider({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold text-zinc-900">
          <span>⏳</span>
          <span>10. 노래 길이</span>
          <span className="text-sm font-normal text-zinc-500">(1분~10분)</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">가사 분량과 생성 프롬프트에 반영됩니다</p>
      </header>
      <div className="flex items-center gap-3">
        <span className="w-8 text-xs text-zinc-500">1분</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-violet-500"
        />
        <span className="w-12 text-xs text-zinc-500">10분</span>
        <span className="ml-2 inline-flex min-w-12 justify-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
          {value}분
        </span>
      </div>
    </section>
  )
}
