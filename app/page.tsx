// app/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GenerationMode, GenerationResult, Selections, SectionKey } from '@/types'
import { SECTIONS } from '@/lib/options'
import { OptionSection } from '@/components/OptionSection'
import { LengthSlider } from '@/components/LengthSlider'
import { ResultPanel } from '@/components/ResultPanel'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { loadHistory, pushHistory, clearHistory } from '@/lib/history'
import { isEmptySelections } from '@/lib/promptBuilder'

const EMPTY: Selections = {
  genre: [], mood: [], vocal: [], usage: [], instrument: [],
  bpm: null, age: null, language: null,
  topic: [], lengthMin: 3, customInputs: {},
}

const MULTI_KEYS: SectionKey[] = ['genre', 'mood', 'vocal', 'usage', 'instrument', 'topic']

export default function Page() {
  const [selections, setSelections] = useState<Selections>(EMPTY)
  const [loading, setLoading] = useState<GenerationMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const isEmpty = useMemo(() => isEmptySelections(selections), [selections])

  useEffect(() => { setHistory(loadHistory()) }, [])

  useEffect(() => {
    if (!result) return
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [result])

  function toggle(key: SectionKey, label: string) {
    setSelections((s) => {
      if (MULTI_KEYS.includes(key)) {
        const arr = s[key] as string[]
        const next = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label]
        return { ...s, [key]: next }
      }
      const cur = s[key] as string | null
      return { ...s, [key]: cur === label ? null : label }
    })
  }

  function setCustom(key: SectionKey, value: string) {
    setSelections((s) => ({ ...s, customInputs: { ...s.customInputs, [key]: value } }))
  }

  async function generate(mode: GenerationMode) {
    setError(null)
    setLoading(mode)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selections, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? '알 수 없는 오류')
        return
      }
      const enriched: GenerationResult = { ...(data as GenerationResult), selections }
      setResult(enriched)
      setHistory(pushHistory(enriched))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '네트워크 오류')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 음악 콘셉트 스튜디오</h1>
          <p className="text-sm text-zinc-500">프롬프트 + 1곡 또는 10곡 콘셉트를 생성합니다</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          히스토리 {history.length}
        </button>
      </header>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((sec) => (
          <OptionSection
            key={sec.key}
            number={sec.number}
            emoji={sec.emoji}
            title={sec.title}
            subtitle={sec.subtitle}
            presets={sec.presets}
            selected={selections[sec.key] as string[] | string | null}
            onToggle={(label) => toggle(sec.key, label)}
            multi={sec.multi}
            customInput={selections.customInputs[sec.key]}
            onCustomChange={(v) => setCustom(sec.key, v)}
            placeholder={sec.placeholder}
          />
        ))}
        <LengthSlider
          value={selections.lengthMin}
          onChange={(v) => setSelections((s) => ({ ...s, lengthMin: v }))}
        />
      </div>

      <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-lg backdrop-blur">
        <button
          type="button"
          disabled={loading !== null || isEmpty}
          title={isEmpty ? '먼저 옵션을 하나 이상 선택하세요' : undefined}
          onClick={() => generate('single')}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === 'single' ? '생성 중…' : '1곡 생성'}
        </button>
        <button
          type="button"
          disabled={loading !== null || isEmpty}
          title={isEmpty ? '먼저 옵션을 하나 이상 선택하세요' : undefined}
          onClick={() => generate('full')}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === 'full' ? '생성 중…' : '10곡 생성'}
        </button>
        {isEmpty && !error && (
          <span className="text-xs text-zinc-500">옵션을 1개 이상 선택해 주세요</span>
        )}
        {error && <span className="text-sm text-red-600">⚠ {error}</span>}
      </div>

      {result && (
        <div ref={resultRef} className="scroll-mt-4">
          <ResultPanel result={result} />
        </div>
      )}

      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={() => setHistoryOpen(false)}
        onSelect={(e) => { setResult(e); setHistoryOpen(false) }}
        onClear={() => { clearHistory(); setHistory([]) }}
      />
    </div>
  )
}
