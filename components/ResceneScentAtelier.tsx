// components/ResceneScentAtelier.tsx
'use client'

import { useState } from 'react'
import {
  CURATED_NEW_SCENTS,
  CUSTOM_KEYBOARD_MODULES,
  CUSTOM_BASS_MODULES,
  CUSTOM_SPACE_MODULES,
  buildCustomSoundFormula,
  type CuratedScentFormula,
  type SoundModuleItem,
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

  // 커스텀 사운드 조합 상태
  const [selectedKeyboard, setSelectedKeyboard] = useState<SoundModuleItem>(CUSTOM_KEYBOARD_MODULES[0])
  const [selectedBass, setSelectedBass] = useState<SoundModuleItem>(CUSTOM_BASS_MODULES[0])
  const [selectedSpace, setSelectedSpace] = useState<SoundModuleItem>(CUSTOM_SPACE_MODULES[0])

  const customSound = buildCustomSoundFormula(selectedKeyboard, selectedBass, selectedSpace)

  function handleApplyCustom(
    kb: SoundModuleItem = selectedKeyboard,
    bs: SoundModuleItem = selectedBass,
    sp: SoundModuleItem = selectedSpace
  ) {
    const formula = buildCustomSoundFormula(kb, bs, sp)
    onApplyCustomScent({
      name: formula.nameKo,
      nameEn: formula.nameEn,
      pyramid: formula.techniqueSummary,
      topic: `${formula.techniqueSummary} 기반의 감각적인 사운드 텍스처`,
      bpm: formula.bpmRecommendation,
      genre: formula.genreRecommendation,
      instruments: [kb.nameKo, bs.nameKo, sp.nameKo],
      sonicDescriptor: formula.sonicDescriptor,
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
                시그니처 사운드 텍스처 &amp; 악기 주법 (Sound &amp; Instrument Textures)
              </h3>
              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-700">
                악기 3요소 기법
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              어려운 향수 화학 용어 대신, 스타일 프롬프트에 직접 반영될 구체적 악기 기종, 음색(Timbre), 연주 주법(Articulation)을 직관적으로 선택합니다.
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
            🌟 사운드 프리셋 (6종)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('custom')
              handleApplyCustom()
            }}
            className={[
              'rounded-lg px-3 py-1 text-xs font-bold transition',
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800',
            ].join(' ')}
          >
            🎛️ 나만의 악기 주법 직접 조합
          </button>
        </div>
      </div>

      {/* 탭 1: 큐레이션 시그니처 사운드 (6종) */}
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

                  {/* 스타일 프롬프트 반영 악기 및 주법 목록 */}
                  <div className="mt-3 space-y-1 rounded-xl bg-white/90 border border-zinc-100 p-2 text-[11px] leading-tight text-zinc-700">
                    <div className="text-[10px] font-bold text-violet-800 mb-1">
                      구현되는 악기 기법 (Playing Techniques):
                    </div>
                    {scent.instrumentTechniques.map((tech, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-zinc-600">
                        <span className="text-violet-500">•</span>
                        <span>{tech}</span>
                      </div>
                    ))}
                  </div>

                  {/* Suno 영문 프롬프트 디스크립터 미리보기 */}
                  <div className="mt-2 rounded-lg bg-zinc-100/80 p-2 text-[10px] font-mono text-zinc-600">
                    <span className="font-bold text-zinc-700">Style Tag: </span>
                    <span className="line-clamp-2 text-violet-800">{scent.sonicDescriptor}</span>
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

      {/* 탭 2: 나만의 악기 주법 직접 조합 빌더 */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-violet-50/70 rounded-2xl px-4 py-3">
            <div className="text-xs text-zinc-700">
              <span className="font-bold text-violet-900">💡 구현 방식:</span> 건반 주법 + 베이스 리듬 + 믹스 질감을 선택하면 Suno 스타일 프롬프트에 정밀한 3요소 악기 디스크립터가 실시간 결합됩니다.
            </div>
            <div className="text-[11px] font-bold text-violet-700">
              현재 조합: {selectedKeyboard.nameKo.split(' ')[0]} + {selectedBass.nameKo.split(' ')[0]} + {selectedSpace.nameKo.split(' ')[0]}
            </div>
          </div>

          {/* 3단 선택 모듈 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1) 건반/신스 주법 */}
            <div className="rounded-2xl border border-violet-200/80 bg-violet-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 flex items-center gap-1">
                  <span>🎹</span> 1. 건반 &amp; 신스 주법 (Lead/Keys)
                </span>
                <span className="text-[10px] text-violet-600">음색·아르페지오</span>
              </div>
              <div className="space-y-1.5">
                {CUSTOM_KEYBOARD_MODULES.map((k) => {
                  const sel = selectedKeyboard.id === k.id
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => {
                        setSelectedKeyboard(k)
                        handleApplyCustom(k, selectedBass, selectedSpace)
                      }}
                      className={[
                        'w-full flex flex-col rounded-xl p-2.5 text-left text-xs transition',
                        sel
                          ? 'border border-violet-500 bg-white font-bold text-violet-950 shadow-2xs ring-1 ring-violet-400/40'
                          : 'border border-transparent bg-white/70 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 flex items-center gap-1">
                          <span>{k.emoji}</span> {k.nameKo}
                        </span>
                        {sel && <span className="text-violet-600 font-bold text-[10px]">✓ 선택</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 leading-tight">
                        {k.descriptionKo}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2) 베이스 & 리듬 주법 */}
            <div className="rounded-2xl border border-pink-200/80 bg-pink-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-pink-900 flex items-center gap-1">
                  <span>🎸</span> 2. 베이스 &amp; 리듬 주법 (Bass/Rhythm)
                </span>
                <span className="text-[10px] text-pink-600">사이드체인·그루브</span>
              </div>
              <div className="space-y-1.5">
                {CUSTOM_BASS_MODULES.map((b) => {
                  const sel = selectedBass.id === b.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBass(b)
                        handleApplyCustom(selectedKeyboard, b, selectedSpace)
                      }}
                      className={[
                        'w-full flex flex-col rounded-xl p-2.5 text-left text-xs transition',
                        sel
                          ? 'border border-pink-500 bg-white font-bold text-pink-950 shadow-2xs ring-1 ring-pink-400/40'
                          : 'border border-transparent bg-white/70 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 flex items-center gap-1">
                          <span>{b.emoji}</span> {b.nameKo}
                        </span>
                        {sel && <span className="text-pink-600 font-bold text-[10px]">✓ 선택</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 leading-tight">
                        {b.descriptionKo}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3) 믹스 & 공간 텍스처 */}
            <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  <span>💎</span> 3. 믹스 &amp; 공간 텍스처 (Mix/Space)
                </span>
                <span className="text-[10px] text-indigo-600">드라이·질감</span>
              </div>
              <div className="space-y-1.5">
                {CUSTOM_SPACE_MODULES.map((s) => {
                  const sel = selectedSpace.id === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpace(s)
                        handleApplyCustom(selectedKeyboard, selectedBass, s)
                      }}
                      className={[
                        'w-full flex flex-col rounded-xl p-2.5 text-left text-xs transition',
                        sel
                          ? 'border border-indigo-500 bg-white font-bold text-indigo-950 shadow-2xs ring-1 ring-indigo-400/40'
                          : 'border border-transparent bg-white/70 text-zinc-700 hover:bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 flex items-center gap-1">
                          <span>{s.emoji}</span> {s.nameKo}
                        </span>
                        {sel && <span className="text-indigo-600 font-bold text-[10px]">✓ 선택</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 leading-tight">
                        {s.descriptionKo}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 생성될 stylePrompt 영문 태그 실시간 미리보기 박스 */}
          <div className="rounded-2xl bg-zinc-900 text-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <span>⚡</span> Suno Style Prompt 반영 디스크립터 (실시간 미리보기):
              </span>
              <span className="text-emerald-400 font-medium">3요소 악기 주법 결합됨</span>
            </div>
            <div className="font-mono text-xs text-violet-300 bg-zinc-800/80 rounded-xl p-2.5 break-all">
              {customSound.sonicDescriptor}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
