// components/ResultPanel.tsx
'use client'

import { useState } from 'react'
import type { GenerationResult, SectionKey, Selections } from '@/types'
import { SECTIONS } from '@/lib/options'

const HAS_KOREAN = /[가-힣]/

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
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

type ChipItem = { label: string; emoji?: string; sectionKey?: SectionKey }

function collectSelectionChips(selections: Selections): ChipItem[] {
  const items: ChipItem[] = []
  for (const sec of SECTIONS) {
    const picks = selections[sec.key]
    const arr = Array.isArray(picks) ? picks : picks ? [picks] : []
    for (const label of arr) {
      const preset = sec.presets.find((p) => p.label === label)
      items.push({ label, emoji: preset?.emoji, sectionKey: sec.key })
    }
    const custom = selections.customInputs[sec.key]?.trim()
    if (custom) items.push({ label: custom, sectionKey: sec.key })
  }
  items.push({ label: `${selections.lengthMin}분`, emoji: '⏳' })
  return items
}

function SelectionMirror({ selections }: { selections: Selections }) {
  const chips = collectSelectionChips(selections)
  if (chips.length === 0) return null
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40 p-5 shadow-sm ring-1 ring-violet-200/70">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-300/20 blur-2xl" aria-hidden />
      <div className="relative mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-sm text-white shadow-sm shadow-violet-300"
        >
          🎯
        </span>
        <span className="text-sm font-semibold tracking-tight text-violet-900">이 플레이리스트의 옵션</span>
        <span className="ml-auto rounded-full bg-violet-600/10 px-2 py-0.5 text-xs font-medium text-violet-700">
          {chips.length}개
        </span>
      </div>
      <div className="relative flex flex-wrap gap-1.5">
        {chips.map((it, i) => (
          <span
            key={`${it.sectionKey ?? 'len'}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm ring-1 ring-violet-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-violet-400"
          >
            {it.emoji && <span aria-hidden className="text-sm leading-none">{it.emoji}</span>}
            <span>{it.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function SongSummaryChips({ selections }: { selections: Selections }) {
  const chips: ChipItem[] = []
  const genre = selections.genre
  if (genre) {
    const preset = SECTIONS.find((s) => s.key === 'genre')?.presets.find((p) => p.label === genre)
    chips.push({ label: genre, emoji: preset?.emoji })
  }
  if (selections.bpm) {
    const preset = SECTIONS.find((s) => s.key === 'bpm')?.presets.find((p) => p.label === selections.bpm)
    chips.push({ label: selections.bpm, emoji: preset?.emoji })
  }
  chips.push({ label: `${selections.lengthMin}분`, emoji: '⏳' })
  if (chips.length === 0) return null
  return (
    <div className="hidden flex-wrap gap-1 sm:flex">
      {chips.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
        >
          {it.emoji && <span aria-hidden>{it.emoji}</span>}
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  )
}

type ResultPanelProps = {
  result: GenerationResult
  onRegenerate?: (index: number) => void
  regenerating?: number | null
}

export function ResultPanel({ result, onRegenerate, regenerating }: ResultPanelProps) {
  const expected =
    result.mode === 'full' ? 10 : result.mode === 'single' ? 1 : 0
  const got = result.songs?.length ?? 0
  const countMismatch = expected > 0 && got !== expected

  return (
    <div className="mt-6 flex flex-col gap-4">
      {result.selections && <SelectionMirror selections={result.selections} />}

      {countMismatch && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ 요청은 {expected}곡이었지만 {got}곡만 반환됐습니다. 모델이 지시를 일부 무시한 케이스 — 다시 시도해 주세요.
        </div>
      )}

      {result.songs && (
        <div className="flex flex-col gap-3">
          {result.songs.map((s, i) => {
            const hasKoreanInLyrics = HAS_KOREAN.test(s.lyrics)
            const isDuplicate = s.lyricsKr.trim() === s.lyrics.trim()
            const showTranslation = !!s.lyricsKr && !hasKoreanInLyrics && !isDuplicate
            const isRegenerating = regenerating === i
            const stylePrompt = (s.stylePrompt ?? '').trim()
            return (
              <details
                key={i}
                open={i === 0}
                className={[
                  'group overflow-hidden rounded-2xl border bg-white shadow-sm transition',
                  isRegenerating ? 'border-violet-300 ring-2 ring-violet-200' : 'border-zinc-200',
                ].join(' ')}
              >
                <summary className="flex cursor-pointer select-none items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-zinc-900">
                        {i + 1}. {s.title}
                      </h4>
                      {result.selections && <SongSummaryChips selections={result.selections} />}
                      {isRegenerating && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-violet-300 border-t-violet-600" aria-hidden />
                          재생성 중
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {onRegenerate && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRegenerate(i) }}
                        disabled={regenerating !== null && regenerating !== undefined}
                        title="이 곡만 다시 생성 (다른 곡과 겹치지 않도록)"
                        className="rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRegenerating ? '…' : '🔄 이 곡 다시'}
                      </button>
                    )}
                    <CopyButton
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}\n\n${s.lyrics}${showTranslation ? `\n\n--- 한국어 번역 ---\n\n${s.lyricsKr}` : ''}`}
                    />
                    <span className="text-zinc-400 transition group-open:rotate-180">▾</span>
                  </div>
                </summary>

                <div className="border-t border-zinc-200 px-5 py-4">
                  {s.concept && (
                    <section className="mb-3 rounded-lg border-l-2 border-violet-300 bg-violet-50/40 px-3 py-2">
                      <div className="mb-0.5 text-xs font-medium text-zinc-500">💡 곡 콘셉트</div>
                      <p className="text-sm leading-relaxed text-zinc-800">{s.concept}</p>
                    </section>
                  )}

                  {stylePrompt && (
                    <section className="mb-3 rounded-lg border-l-2 border-sky-300 bg-sky-50/50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">🎛️ Style Prompt (Suno style 입력란용)</span>
                        <CopyButton text={stylePrompt} />
                      </div>
                      <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800" lang="en">
                        {stylePrompt}
                      </p>
                    </section>
                  )}

                  <section>
                    <div className="mb-1 text-xs font-medium text-zinc-500">🌐 언어별 타이틀</div>
                    <dl className="grid gap-1 rounded-lg bg-zinc-50 p-3 text-sm">
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 text-zinc-500">한국어</dt>
                        <dd className="font-medium text-zinc-900">{s.titles.ko}</dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 text-zinc-500">English</dt>
                        <dd className="font-medium text-zinc-900" lang="en">{s.titles.en}</dd>
                      </div>
                      <div className="flex gap-3">
                        <dt className="w-16 shrink-0 text-zinc-500">日本語</dt>
                        <dd className="font-medium text-zinc-900" lang="ja">{s.titles.ja}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">🎤 가사 (Suno 입력란용)</span>
                      <CopyButton text={s.lyrics} />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-800">{s.lyrics}</pre>
                  </section>

                  {showTranslation && (
                    <section className="mt-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500">🇰🇷 한국어 번역</span>
                        <CopyButton text={s.lyricsKr} />
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-800">{s.lyricsKr}</pre>
                    </section>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
