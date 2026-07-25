// components/ResultPanel.tsx
'use client'

import { useState } from 'react'
import type { GenerationResult, SectionKey, Selections } from '@/types'
import { SECTIONS } from '@/lib/options'

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

const ROLE_LABELS: Record<string, string> = {
  opener: '🎬 오프너',
  depth: '🌊 깊이 트랙',
  'energy lift': '⚡ 에너지 리프트',
  interlude: '🌙 인터루드',
  climax: '🔥 클라이맥스',
  closer: '🌅 클로저',
}

// M5 증상→처방 매핑표 기반 재생성 힌트
const RETRY_PRESCRIPTIONS: { label: string; hint: string; vocalOnly?: boolean }[] = [
  {
    label: '🩺 보컬이 웅얼거림',
    hint: '이전 곡은 보컬이 웅얼거렸습니다. 가사를 1~3음절 단어 위주로 다시 쓰고, stylePrompt에 crisp enunciation을 추가하고 hazy·dreamy·distant 계열 디스크립터를 제거하세요.',
    vocalOnly: true,
  },
  {
    label: '🩺 장르가 튐',
    hint: '이전 곡은 의도한 장르에서 벗어났습니다. 주 장르를 맨 앞에 두고 더 좁은 마이크로장르로 뾰족하게 만들고, 충돌하는 무드·악기 신호를 제거하세요.',
  },
  {
    label: '🩺 믹스가 탁함',
    hint: '이전 곡은 믹스가 탁했습니다(muddy). 저중역 질감 디스크립터(dark, warm, lush, heavy, thick, reverb-heavy)를 최대 1개로 줄이고 clean mix, hi-fi production을 추가하세요.',
  },
  {
    label: '🩺 훅이 약함',
    hint: '이전 곡은 후렴 훅이 약했습니다. 더 반복적이고 따라 부르기 쉬운 훅 라인으로 후렴을 다시 쓰고, 후렴에 배킹보컬(소괄호) 콜앤리스폰스를 1~2회 넣으세요.',
    vocalOnly: true,
  },
]

// Suno 초기 생성 상한(약 4~8분) 대응: [Verse 3]부터를 Extend용으로 분리
function getExtendChunk(lyrics: string): string | null {
  const idx = lyrics.indexOf('[Verse 3')
  return idx > 0 ? lyrics.slice(idx).trim() : null
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
  onRegenerate?: (index: number, retryHint?: string) => void
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
            const isRegenerating = regenerating === i
            const stylePrompt = (s.stylePrompt ?? '').trim()
            const excludeStyles = s.excludeStyles ?? []
            const extendChunk = getExtendChunk(s.lyrics)
            const isInstrumental = s.lyrics.trim() === '[Instrumental]' || s.lyrics.trim() === '(Instrumental)'
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
                      {s.trackRole && ROLE_LABELS[s.trackRole] && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          {ROLE_LABELS[s.trackRole]}
                        </span>
                      )}
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
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}${excludeStyles.length > 0 ? `\n\n--- Exclude Styles ---\n${excludeStyles.join(', ')}` : ''}${s.sliderHint ? `\n\n--- Slider ---\nWeirdness ${s.sliderHint.weirdness} / Style Influence ${s.sliderHint.styleInfluence}\n${s.sliderHint.note}` : ''}\n\n${s.lyrics}`}
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

                  {excludeStyles.length > 0 && (
                    <section className="mb-3 rounded-lg border-l-2 border-rose-300 bg-rose-50/50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">🚫 Exclude Styles (Suno Exclude 입력란용)</span>
                        <CopyButton text={excludeStyles.join(', ')} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {excludeStyles.map((x, j) => (
                          <span
                            key={j}
                            lang="en"
                            className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 font-mono text-xs text-zinc-800 ring-1 ring-rose-200"
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {s.sliderHint && (
                    <section className="mb-3 rounded-lg border-l-2 border-amber-300 bg-amber-50/50 px-3 py-2">
                      <div className="mb-1 text-xs font-medium text-zinc-500">🎚️ 슬라이더 추천</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-amber-200">
                          Weirdness {s.sliderHint.weirdness}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-amber-200">
                          Style Influence {s.sliderHint.styleInfluence}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{s.sliderHint.note}</p>
                    </section>
                  )}

                  <section>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">🌐 언어별 타이틀</span>
                      <CopyButton text={`${s.titles.ko}\n${s.titles.en}\n${s.titles.ja}`} />
                    </div>
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

                  {extendChunk && (
                    <section className="mt-3 rounded-lg border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">➕ Extend용 후반부 ([Verse 3]부터)</span>
                        <CopyButton text={extendChunk} />
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-600">
                        Suno 초기 생성은 보통 4~8분에서 끊깁니다. 곡이 끝까지 나오지 않으면 마지막 안정 구간에서
                        Extend를 누르고 이 후반부만 붙여넣으세요.
                      </p>
                    </section>
                  )}

                  {onRegenerate && (
                    <section className="mt-3">
                      <div className="mb-1 text-xs font-medium text-zinc-500">🔄 문제가 있나요? 증상을 골라 이 곡만 다시 생성</div>
                      <div className="flex flex-wrap gap-1.5">
                        {RETRY_PRESCRIPTIONS.filter((p) => !(isInstrumental && p.vocalOnly)).map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            disabled={regenerating !== null && regenerating !== undefined}
                            onClick={() => onRegenerate(i, p.hint)}
                            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
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
