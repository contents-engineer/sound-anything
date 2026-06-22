// app/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GenerationMode, GenerationResult, Selections, SectionKey } from '@/types'
import { SECTIONS } from '@/lib/options'
import { OptionSection } from '@/components/OptionSection'
import { LengthSlider } from '@/components/LengthSlider'
import { ResultPanel } from '@/components/ResultPanel'
import { ResultSkeleton } from '@/components/ResultSkeleton'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { loadHistory, pushHistory, clearHistory } from '@/lib/history'
import { isEmptySelections } from '@/lib/promptBuilder'
import { DEFAULT_MODEL_ID, MODELS } from '@/lib/models'

const TIMEOUT_MS = 60_000

const EMPTY: Selections = {
  genre: null, mood: [], vocal: [], usage: null, instrument: [],
  bpm: null, age: null, language: null,
  topic: [], lengthMin: 3, customInputs: {},
}

const MULTI_KEYS: SectionKey[] = ['mood', 'vocal', 'instrument', 'topic']

export default function Page() {
  const [selections, setSelections] = useState<Selections>(EMPTY)
  const [loading, setLoading] = useState<GenerationMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const [regenIndex, setRegenIndex] = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isEmpty = useMemo(() => isEmptySelections(selections), [selections])

  // Hydration-safe: load history after mount (localStorage unavailable on server).
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function cancelInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function generate(mode: GenerationMode) {
    cancelInFlight()
    const controller = new AbortController()
    abortRef.current = controller
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    setError(null)
    setLoading(mode)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selections, mode, model: modelId }),
        signal: controller.signal,
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
      if (e instanceof Error && e.name === 'AbortError') {
        setError('요청이 취소되었거나 시간 초과(60초)되었습니다')
      } else {
        setError(e instanceof Error ? e.message : '네트워크 오류')
      }
    } finally {
      window.clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
      setLoading(null)
    }
  }

  const regenerateSong = useCallback(async (index: number) => {
    if (!result?.songs) return
    cancelInFlight()
    const controller = new AbortController()
    abortRef.current = controller
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

    setError(null)
    setRegenIndex(index)
    try {
      const excludeTitles = result.songs.map((s) => s.title)
      const baseSelections = result.selections ?? selections
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          selections: baseSelections,
          mode: 'single',
          model: modelId,
          excludeTitles,
        }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? '알 수 없는 오류')
        return
      }
      const partial = data as GenerationResult
      const newSong = partial.songs?.[0]
      if (!newSong) {
        setError('새 곡을 받지 못했습니다')
        return
      }
      const merged: GenerationResult = {
        ...result,
        songs: result.songs.map((s, i) => (i === index ? newSong : s)),
        generatedAt: partial.generatedAt,
        provider: partial.provider,
      }
      setResult(merged)
      setHistory(pushHistory(merged))
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('재생성이 취소되었거나 시간 초과되었습니다')
      } else {
        setError(e instanceof Error ? e.message : '네트워크 오류')
      }
    } finally {
      window.clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
      setRegenIndex(null)
    }
  }, [result, selections, modelId])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suno.ai Lyrics Generator</h1>
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">모델</span>
          <div role="radiogroup" aria-label="생성 모델 선택" className="inline-flex rounded-lg border border-zinc-300 bg-zinc-50 p-0.5">
            {MODELS.map((m) => {
              const active = modelId === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={loading !== null}
                  onClick={() => setModelId(m.id)}
                  className={[
                    'rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
                    active
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-zinc-700 hover:bg-white',
                  ].join(' ')}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {(loading !== null || regenIndex !== null) && (
            <button
              type="button"
              onClick={cancelInFlight}
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              취소
            </button>
          )}
          <button
            type="button"
            disabled={loading !== null || regenIndex !== null || isEmpty}
            title={isEmpty ? '먼저 옵션을 하나 이상 선택하세요' : undefined}
            onClick={() => generate('single')}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === 'single' ? '생성 중…' : '1곡 생성'}
          </button>
          <button
            type="button"
            disabled={loading !== null || regenIndex !== null || isEmpty}
            title={isEmpty ? '먼저 옵션을 하나 이상 선택하세요' : undefined}
            onClick={() => generate('full')}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === 'full' ? '생성 중…' : '10곡 생성'}
          </button>
        </div>
        {isEmpty && !error && (
          <span className="w-full text-xs text-zinc-500">옵션을 1개 이상 선택해 주세요</span>
        )}
        {error && <span className="w-full text-sm text-red-600">⚠ {error}</span>}
      </div>

      {!result && loading !== null && (
        <ResultSkeleton count={loading === 'full' ? 10 : 1} />
      )}

      {result && (
        <div ref={resultRef} className="scroll-mt-4">
          <ResultPanel
            result={result}
            onRegenerate={regenerateSong}
            regenerating={regenIndex}
          />
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
