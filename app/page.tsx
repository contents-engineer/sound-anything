// app/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GenerationMode, GenerationResult, Selections, SectionKey } from '@/types'
import { INSTRUMENTAL_VOCAL_LABEL, SECTIONS } from '@/lib/options'
import { OptionSection } from '@/components/OptionSection'
import { LengthSlider } from '@/components/LengthSlider'
import { ResultPanel } from '@/components/ResultPanel'
import { ResultSkeleton } from '@/components/ResultSkeleton'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { ApiKeySettings } from '@/components/ApiKeySettings'
import { loadHistory, pushHistory, clearHistory } from '@/lib/history'
import { loadApiKey, saveApiKey, clearApiKey } from '@/lib/apiKey'
import { isEmptySelections } from '@/lib/promptBuilder'
import { DEFAULT_MODEL_ID, MODELS, formatPricing, formatPromo } from '@/lib/models'
import { CLIENT_TIMEOUT_MS as TIMEOUT_MS } from '@/lib/timeouts'
import { QUICK_PRESETS, mapTrendToSelections } from '@/lib/presets'

const EMPTY: Selections = {
  genre: null, era: null, mood: [], vocal: [], usage: null, instrument: [],
  production: null, bpm: null, age: null, form: null, language: null,
  topic: [], lengthMin: 3, customInputs: {},
}

const MULTI_KEYS: SectionKey[] = ['mood', 'vocal', 'instrument', 'topic']

export default function Page() {
  const [selections, setSelections] = useState<Selections>(EMPTY)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [sourceNotice, setSourceNotice] = useState<string | null>(null)
  const [songCount, setSongCount] = useState<number>(10)
  const [loadingCount, setLoadingCount] = useState<number>(10)
  const [loading, setLoading] = useState<GenerationMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const selectedModel = MODELS.find((m) => m.id === modelId)
  const [apiKey, setApiKey] = useState('')
  const [regenIndex, setRegenIndex] = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isEmpty = useMemo(() => isEmptySelections(selections), [selections])

  // Hydration-safe: load history after mount (localStorage unavailable on server).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setHistory(loadHistory())
    setApiKey(loadApiKey())

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const presetParam = params.get('preset')
      const trendTitle = params.get('trendTitle')
      const trendTags = params.get('tags')?.split(',') || []
      const fromChannel = params.get('fromChannel')

      if (presetParam) {
        const found = QUICK_PRESETS.find((p) => p.id === presetParam)
        if (found) {
          setSelections(found.selections)
          setActivePresetId(found.id)
          setSourceNotice(`⚡ "${found.name}" 테마 프리셋이 세팅되었습니다.`)
        }
      } else if (trendTitle) {
        const mapped = mapTrendToSelections(trendTitle, trendTags)
        setSelections(mapped)
        setSourceNotice(`🎵 핫플리 트렌드 "${trendTitle}" 감성이 자동 세팅되었습니다!`)
      } else if (fromChannel) {
        const mapped = mapTrendToSelections(fromChannel)
        setSelections(mapped)
        setSourceNotice(`🎧 "${fromChannel}" 채널 분위기를 바탕으로 자동 세팅되었습니다!`)
      }
    }
  }, [])

  useEffect(() => {
    if (!result) return
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [result])

  function handleSelectPreset(presetId: string) {
    const preset = QUICK_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSelections(preset.selections)
    setActivePresetId(presetId)
    setSourceNotice(null)
  }

  function handleReset() {
    setSelections(EMPTY)
    setActivePresetId(null)
    setSourceNotice(null)
  }

  function toggle(key: SectionKey, label: string) {
    setActivePresetId(null)
    setSelections((s) => {
      if (MULTI_KEYS.includes(key)) {
        const arr = s[key] as string[]
        let next = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label]
        // 보컬: "연주곡 (보컬 없음)"은 다른 보컬과 공존 불가 — 상호 배타
        if (key === 'vocal' && next.includes(label)) {
          next = label === INSTRUMENTAL_VOCAL_LABEL
            ? [INSTRUMENTAL_VOCAL_LABEL]
            : next.filter((x) => x !== INSTRUMENTAL_VOCAL_LABEL)
        }
        return { ...s, [key]: next }
      }
      const cur = s[key] as string | null
      return { ...s, [key]: cur === label ? null : label }
    })
  }

  function setCustom(key: SectionKey, value: string) {
    setActivePresetId(null)
    setSelections((s) => ({ ...s, customInputs: { ...s.customInputs, [key]: value } }))
  }

  function cancelInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  async function generate(count: number = songCount) {
    cancelInFlight()
    const controller = new AbortController()
    abortRef.current = controller
    const mode: GenerationMode = count === 1 ? 'single' : 'full'
    const timeoutMs = TIMEOUT_MS[mode]
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)

    setError(null)
    setLoading(mode)
    setLoadingCount(count)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selections, mode, songCount: count, model: modelId, apiKey }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? '알 수 없는 오류')
        return
      }
      const enriched: GenerationResult = { ...(data as GenerationResult), selections, songCount: count }
      setResult(enriched)
      setHistory(pushHistory(enriched))
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError(`요청이 취소되었거나 시간 초과(${timeoutMs / 1000}초)되었습니다`)
      } else {
        setError(e instanceof Error ? e.message : '네트워크 오류')
      }
    } finally {
      window.clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
      setLoading(null)
    }
  }

  const regenerateSong = useCallback(async (index: number, retryHint?: string) => {
    if (!result?.songs) return
    if (!apiKey) {
      setError('먼저 우측 상단에서 Gemini API 키를 등록해주세요')
      return
    }
    cancelInFlight()
    const controller = new AbortController()
    abortRef.current = controller
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS.single)

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
          apiKey,
          excludeTitles,
          ...(retryHint ? { retryHint } : {}),
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
        songs: result.songs.map((s, i) => (i === index ? { ...newSong, trackRole: s.trackRole ?? null } : s)),
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
  }, [result, selections, modelId, apiKey])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">수노 제너레이터</h2>
          <p className="text-sm text-zinc-500">Suno v6 최적화 · 곡별 스타일 프롬프트 + 1~10곡 콘셉트를 생성합니다</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ApiKeySettings
            apiKey={apiKey}
            onSave={(k) => { saveApiKey(k); setApiKey(k) }}
            onClear={() => { clearApiKey(); setApiKey('') }}
          />
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            히스토리 {history.length}
          </button>
        </div>
      </header>

      {/* 핫플리 / 채널 연동 감지 알림 배너 */}
      {sourceNotice && (
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="text-base">✨</span>
            <span>{sourceNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSourceNotice(null)}
            className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/30"
          >
            확인
          </button>
        </div>
      )}

      {/* 원클릭 추천 테마 프리셋 카드 */}
      <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">⚡</span>
            <h3 className="text-sm font-bold text-zinc-900">원클릭 추천 테마 프리셋</h3>
            <span className="hidden sm:inline-block text-xs text-zinc-400">클릭 한 번으로 1~13번 최적 조합 세팅</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isEmpty}
            className="rounded-xl border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            초기화
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUICK_PRESETS.map((preset) => {
            const active = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={[
                  'flex flex-col items-start rounded-2xl border p-3 text-left transition',
                  active
                    ? 'border-violet-500 bg-violet-50/70 shadow-xs ring-1 ring-violet-400'
                    : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-white',
                ].join(' ')}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-base">{preset.emoji}</span>
                  <span className="text-xs font-bold text-zinc-900 truncate">{preset.name}</span>
                </div>
                <span className="mt-1 line-clamp-1 text-[11px] text-zinc-500 leading-tight">
                  {preset.tagline}
                </span>
              </button>
            )
          })}
        </div>
      </div>

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">모델</span>
          {MODELS.length > 1 ? (
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
          ) : (
            <span className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
              {selectedModel?.label}
            </span>
          )}
          {selectedModel && (
            <div className="basis-full text-[11px] leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-600">{formatPricing(selectedModel)}</span>
              {selectedModel.freeTier && (
                <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                  무료 티어 사용 가능
                </span>
              )}
              {selectedModel.freeTierLimit && (
                <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600">
                  {selectedModel.freeTierLimit}
                </span>
              )}
              {formatPromo(selectedModel) && (
                <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                  {formatPromo(selectedModel)}
                </span>
              )}
              <span className="ml-1.5">{selectedModel.note}</span>
            </div>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          {(loading !== null || regenIndex !== null) && (
            <button
              type="button"
              onClick={cancelInFlight}
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              취소
            </button>
          )}

          {/* 곡 수 선택 (1~10곡) */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 p-1">
            <span className="pl-1.5 pr-0.5 text-xs font-semibold text-zinc-600">곡 수</span>

            {/* 데스크톱/태블릿: 1~10 숫자 버튼 세그먼트 */}
            <div className="hidden sm:inline-flex rounded-lg bg-zinc-200/60 p-0.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const active = songCount === n
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={loading !== null || regenIndex !== null}
                    onClick={() => setSongCount(n)}
                    className={[
                      'h-7 w-7 rounded-md text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                      active
                        ? 'bg-violet-600 text-white shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60',
                    ].join(' ')}
                    title={`${n}곡`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            {/* 모바일: - / 셀렉트 / + 스텝퍼 */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => setSongCount((c) => Math.max(1, c - 1))}
                disabled={songCount <= 1 || loading !== null || regenIndex !== null}
                className="h-7 w-7 rounded text-zinc-600 hover:bg-white disabled:opacity-30 font-bold text-xs"
                aria-label="곡 수 감소"
              >
                −
              </button>
              <select
                value={songCount}
                onChange={(e) => setSongCount(Number(e.target.value))}
                disabled={loading !== null || regenIndex !== null}
                className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-xs font-bold text-zinc-800 focus:outline-none"
                aria-label="곡 수 선택"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}곡</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSongCount((c) => Math.min(10, c + 1))}
                disabled={songCount >= 10 || loading !== null || regenIndex !== null}
                className="h-7 w-7 rounded text-zinc-600 hover:bg-white disabled:opacity-30 font-bold text-xs"
                aria-label="곡 수 증가"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={loading !== null || regenIndex !== null || isEmpty || !apiKey}
            title={!apiKey ? '먼저 우측 상단에서 Gemini API 키를 등록하세요' : isEmpty ? '먼저 옵션을 하나 이상 선택하세요' : undefined}
            onClick={() => generate(songCount)}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {loading !== null ? '생성 중…' : `${songCount}곡 생성`}
          </button>
        </div>
        {!apiKey && !error && (
          <span className="w-full text-xs text-amber-700">우측 상단에서 Gemini API 키를 등록해야 생성할 수 있습니다 (키는 브라우저에만 저장됩니다)</span>
        )}
        {apiKey && isEmpty && !error && (
          <span className="w-full text-xs text-zinc-500">옵션을 1개 이상 선택해 주세요</span>
        )}
        {error && <span className="w-full text-sm text-red-600">⚠ {error}</span>}
      </div>

      {!result && loading !== null && (
        <ResultSkeleton count={loadingCount} />
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
