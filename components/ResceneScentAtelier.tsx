// components/ResceneScentAtelier.tsx
'use client'

import { useState } from 'react'
import {
  TOP_NOTES,
  MIDDLE_NOTES,
  BASE_NOTES,
  CURATED_NEW_SCENTS,
  buildCustomScentFormula,
  type CuratedScentFormula,
  type ScentNoteItem,
} from '@/lib/rescene-scents'

type Props = {
  selectedScentId: string
  onSelectCuratedScent: (scent: CuratedScentFormula) => void
  onApplyCustomScent: (customData: {
    name: string
    nameEn?: string
    pyramid?: string
    topic: string
    bpm: string
    genre: string
    instruments: string[]
    sonicDescriptor?: string
  }) => void
}

export function ResceneScentAtelier({
  selectedScentId,
  onSelectCuratedScent,
  onApplyCustomScent,
}: Props) {
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated')

  // 커스텀 조향 상태 (기본값: 베르가못 + 금목서 + 캐시미어 우드)
  const [selectedTop, setSelectedTop] = useState<ScentNoteItem>(TOP_NOTES[0])
  const [selectedMiddle, setSelectedMiddle] = useState<ScentNoteItem>(MIDDLE_NOTES[0])
  const [selectedBase, setSelectedBase] = useState<ScentNoteItem>(BASE_NOTES[0])

  const customFormula = buildCustomScentFormula(selectedTop, selectedMiddle, selectedBase)

  function handleRandomBlend() {
    const randomTop = TOP_NOTES[Math.floor(Math.random() * TOP_NOTES.length)]
    const randomMiddle = MIDDLE_NOTES[Math.floor(Math.random() * MIDDLE_NOTES.length)]
    const randomBase = BASE_NOTES[Math.floor(Math.random() * BASE_NOTES.length)]
    setSelectedTop(randomTop)
    setSelectedMiddle(randomMiddle)
    setSelectedBase(randomBase)

    const blended = buildCustomScentFormula(randomTop, randomMiddle, randomBase)
    onApplyCustomScent({
      name: blended.nameKo,
      nameEn: blended.nameEn,
      pyramid: blended.pyramidSummary,
      topic: blended.topicSentence,
      bpm: blended.bpmRecommendation,
      genre: blended.genreRecommendation,
      instruments: ['신디사이저', '베이스', '808 비트'],
      sonicDescriptor: blended.sonicDescriptor,
    })
  }

  function handleApplyCurrentCustom() {
    onApplyCustomScent({
      name: customFormula.nameKo,
      nameEn: customFormula.nameEn,
      pyramid: customFormula.pyramidSummary,
      topic: customFormula.topicSentence,
      bpm: customFormula.bpmRecommendation,
      genre: customFormula.genreRecommendation,
      instruments: ['신디사이저', '베이스', '808 비트'],
      sonicDescriptor: customFormula.sonicDescriptor,
    })
  }

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
      {/* 헤더 & 탭 전환 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-400 to-amber-300 text-base shadow-xs">
            🌸
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                리센느 시그니처 향기 &amp; 조향 아틀리에 (Scent Atelier)
              </h3>
              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-700">
                Proust Effect
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              기존 앨범의 복제를 넘어, 조향 피라미드(탑-미들-베이스 노트)를 기반으로 새로운 향기를 창조합니다.
            </p>
          </div>
        </div>

        {/* 탭 토글 버튼 */}
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={[
              'rounded-lg px-3 py-1 text-xs font-bold transition',
              activeTab === 'curated'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800',
            ].join(' ')}
          >
            🌟 큐레이션 신규 향기 (6종)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('custom')
              handleApplyCurrentCustom()
            }}
            className={[
              'rounded-lg px-3 py-1 text-xs font-bold transition',
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800',
            ].join(' ')}
          >
            🧪 나만의 커스텀 조향 (직접 배합)
          </button>
        </div>
      </div>

      {/* 탭 1: 큐레이션 신규 시그니처 향기 (6종) */}
      {activeTab === 'curated' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURATED_NEW_SCENTS.map((scent) => {
            const active = selectedScentId === scent.id
            return (
              <div
                key={scent.id}
                onClick={() => onSelectCuratedScent(scent)}
                className={[
                  'cursor-pointer flex flex-col justify-between rounded-2xl border p-4 transition-all',
                  active
                    ? 'border-violet-500 bg-gradient-to-b from-violet-50/70 to-pink-50/30 shadow-xs ring-2 ring-violet-400/40'
                    : 'border-zinc-200/90 bg-zinc-50/40 hover:border-violet-200 hover:bg-white',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{scent.emoji}</span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{scent.nameKo}</h4>
                        <span className="text-[10px] text-zinc-400 font-medium">({scent.nameEn})</span>
                      </div>
                    </div>
                    {active && (
                      <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        적용 중
                      </span>
                    )}
                  </div>

                  <span className="mt-2 inline-block rounded-md bg-white border border-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
                    {scent.conceptBadge}
                  </span>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 line-clamp-2">
                    {scent.inspiration}
                  </p>

                  {/* 조향 피라미드 요약 */}
                  <div className="mt-3 space-y-1 rounded-xl bg-white/80 border border-zinc-100 p-2 text-[11px] leading-tight text-zinc-600">
                    <div>
                      <span className="font-bold text-amber-600">Top: </span>
                      <span>{scent.pyramid.top}</span>
                    </div>
                    <div>
                      <span className="font-bold text-pink-600">Mid: </span>
                      <span>{scent.pyramid.middle}</span>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-600">Base: </span>
                      <span>{scent.pyramid.base}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-violet-700">{scent.bpm}</span>
                  <span className="text-zinc-400">{scent.recommendedVocal.split('(')[0]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 탭 2: 나만의 커스텀 조향 아틀리에 (직접 배합) */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-violet-50/70 rounded-2xl px-4 py-3">
            <div className="text-xs text-zinc-700">
              <span className="font-bold text-violet-900">💡 조향 방법:</span> 탑 노트(첫인상) + 미들 노트(핵심 서사) + 베이스 노트(프루스트 잔향)를 각각 선택하면 세상에 단 하나뿐인 향기 음악 포뮬러가 완성됩니다.
            </div>
            <button
              type="button"
              onClick={handleRandomBlend}
              className="shrink-0 rounded-xl bg-white border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition shadow-2xs"
            >
              🎲 영감 랜덤 조향
            </button>
          </div>

          {/* 3단 조향 피라미드 선택기 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1) Top Note */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <span>🍋</span> 1. 탑 노트 (Top / 첫인상)
                </span>
                <span className="text-[10px] text-amber-700">인트로·첫 벌스</span>
              </div>
              <div className="space-y-1.5">
                {TOP_NOTES.map((n) => {
                  const sel = selectedTop.id === n.id
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedTop(n)
                        const blended = buildCustomScentFormula(n, selectedMiddle, selectedBase)
                        onApplyCustomScent({
                          name: blended.nameKo,
                          topic: blended.topicSentence,
                          bpm: blended.bpmRecommendation,
                          genre: blended.genreRecommendation,
                          instruments: ['신디사이저', '베이스', '808 비트'],
                        })
                      }}
                      className={[
                        'w-full flex items-center justify-between rounded-xl p-2 text-left text-xs transition',
                        sel
                          ? 'border border-amber-400 bg-white font-bold text-amber-900 shadow-2xs'
                          : 'border border-transparent bg-white/60 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{n.emoji}</span>
                        <span>{n.nameKo}</span>
                      </span>
                      {sel && <span className="text-[10px] text-amber-600">선택</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2) Middle Note */}
            <div className="rounded-2xl border border-pink-200/80 bg-pink-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-pink-900 flex items-center gap-1">
                  <span>🌸</span> 2. 미들 노트 (Heart / 감정선)
                </span>
                <span className="text-[10px] text-pink-700">코러스 후렴구</span>
              </div>
              <div className="space-y-1.5">
                {MIDDLE_NOTES.map((n) => {
                  const sel = selectedMiddle.id === n.id
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedMiddle(n)
                        const blended = buildCustomScentFormula(selectedTop, n, selectedBase)
                        onApplyCustomScent({
                          name: blended.nameKo,
                          topic: blended.topicSentence,
                          bpm: blended.bpmRecommendation,
                          genre: blended.genreRecommendation,
                          instruments: ['신디사이저', '베이스', '808 비트'],
                        })
                      }}
                      className={[
                        'w-full flex items-center justify-between rounded-xl p-2 text-left text-xs transition',
                        sel
                          ? 'border border-pink-400 bg-white font-bold text-pink-900 shadow-2xs'
                          : 'border border-transparent bg-white/60 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{n.emoji}</span>
                        <span>{n.nameKo}</span>
                      </span>
                      {sel && <span className="text-[10px] text-pink-600">선택</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3) Base Note */}
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  <span>🧣</span> 3. 베이스 노트 (Base / 잔향)
                </span>
                <span className="text-[10px] text-indigo-700">아웃트로·프루스트</span>
              </div>
              <div className="space-y-1.5">
                {BASE_NOTES.map((n) => {
                  const sel = selectedBase.id === n.id
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedBase(n)
                        const blended = buildCustomScentFormula(selectedTop, selectedMiddle, n)
                        onApplyCustomScent({
                          name: blended.nameKo,
                          topic: blended.topicSentence,
                          bpm: blended.bpmRecommendation,
                          genre: blended.genreRecommendation,
                          instruments: ['신디사이저', '베이스', '808 비트'],
                        })
                      }}
                      className={[
                        'w-full flex items-center justify-between rounded-xl p-2 text-left text-xs transition',
                        sel
                          ? 'border border-indigo-400 bg-white font-bold text-indigo-900 shadow-2xs'
                          : 'border border-transparent bg-white/60 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{n.emoji}</span>
                        <span>{n.nameKo}</span>
                      </span>
                      {sel && <span className="text-[10px] text-indigo-600">선택</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 실시간 조향 결과 카드 */}
          <div className="rounded-2xl border border-violet-300 bg-gradient-to-r from-violet-50 via-white to-pink-50 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    {customFormula.nameKo}{' '}
                    <span className="text-xs font-normal text-zinc-500">
                      ({customFormula.nameEn})
                    </span>
                  </h4>
                  <p className="mt-0.5 text-xs font-medium text-violet-700">
                    {customFormula.pyramidSummary}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyCurrentCustom}
                className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
              >
                이 조향으로 음악 설정 적용 ✓
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 border-t border-violet-100 pt-2">
              {customFormula.topicSentence}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
