// components/ResceneVocalSelector.tsx
'use client'

import { useState } from 'react'
import { RESCENE_MEMBERS, type ResceneMemberVocal } from '@/lib/rescene-vocal'

type Props = {
  selectedVocals: string[]
  onToggleVocal: (vocalLabel: string) => void
  onSelectExclusiveMember: (vocalLabel: string) => void
}

export function ResceneVocalSelector({
  selectedVocals,
  onToggleVocal,
  onSelectExclusiveMember,
}: Props) {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)

  const isSelected = (label: string) => selectedVocals.includes(label)

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/40 p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-violet-100/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-pink-400 text-base shadow-xs">
            🫧
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                리센느(RESCENE) 멤버별 보컬 분석 & 선택
              </h3>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                리센느낌 전용
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              멤버별 음색과 창법 분석 데이터를 기반으로 Suno v6 보컬 디스크립터를 맞춤 반영합니다.
            </p>
          </div>
        </div>

        {/* 퀵 유닛 버튼 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-zinc-400">추천 유닛:</span>
          <button
            type="button"
            onClick={() => onSelectExclusiveMember(RESCENE_MEMBERS[0].label)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            5인 완전체
          </button>
          <button
            type="button"
            onClick={() => {
              // 미나미 & 리브 보컬 라인
              const m = RESCENE_MEMBERS.find((x) => x.id === 'minami')!
              const l = RESCENE_MEMBERS.find((x) => x.id === 'liv')!
              onSelectExclusiveMember(m.label)
              onToggleVocal(l.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            미나미 & 리브 (보컬라인)
          </button>
          <button
            type="button"
            onClick={() => {
              // 원이 & 제나 에너지/비트 유닛
              const w = RESCENE_MEMBERS.find((x) => x.id === 'woni')!
              const z = RESCENE_MEMBERS.find((x) => x.id === 'zena')!
              onSelectExclusiveMember(w.label)
              onToggleVocal(z.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            원이 & 제나 (비트유닛)
          </button>
          <button
            type="button"
            onClick={() => {
              // 메이 & 리브 몽환 유닛
              const my = RESCENE_MEMBERS.find((x) => x.id === 'may')!
              const l = RESCENE_MEMBERS.find((x) => x.id === 'liv')!
              onSelectExclusiveMember(my.label)
              onToggleVocal(l.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            메이 & 리브 (몽환유닛)
          </button>
        </div>
      </div>

      {/* 6명 멤버 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {RESCENE_MEMBERS.map((member) => {
          const active = isSelected(member.label)
          const isExpanded = expandedMemberId === member.id

          return (
            <div
              key={member.id}
              className={[
                'relative flex flex-col rounded-2xl border p-3.5 transition-all',
                active
                  ? 'border-violet-500 bg-white shadow-sm ring-2 ring-violet-400/40'
                  : 'border-zinc-200/90 bg-white/70 hover:border-violet-200 hover:bg-white',
              ].join(' ')}
            >
              {/* 상단: 이름 + 배지 + 선택 체크박스 */}
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleVocal(member.label)}
                  className="flex flex-1 items-start gap-2 text-left"
                >
                  <span className="text-xl leading-none">{member.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-900">{member.nameKo}</span>
                      <span className="text-[11px] text-zinc-400 font-medium">({member.nameEn})</span>
                    </div>
                    <span className="mt-0.5 inline-block rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                      {member.badge}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleVocal(member.label)}
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition',
                    active
                      ? 'border-violet-600 bg-violet-600 text-white shadow-xs'
                      : 'border-zinc-300 bg-zinc-50 text-transparent hover:border-zinc-400',
                  ].join(' ')}
                  title={active ? '선택 해제' : '선택'}
                >
                  ✓
                </button>
              </div>

              {/* 음색 요약 문구 */}
              <p
                onClick={() => onToggleVocal(member.label)}
                className="mt-2.5 cursor-pointer text-xs leading-relaxed text-zinc-600"
              >
                {member.vocalAnalysis.tone}
              </p>

              {/* 향기 키워드 */}
              <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400">
                <span>🌸 향기:</span>
                <span className="font-medium text-zinc-600">{member.scentKeyword}</span>
              </div>

              {/* 하단 상세 분석 펼침 토글 버튼 */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                  className="inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-800"
                >
                  <span>{isExpanded ? '▲ 분석 접기' : '▼ 상세 분석 보기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectExclusiveMember(member.label)}
                  className="rounded px-1.5 py-0.5 font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  title="이 멤버만 단독 선택"
                >
                  단독 선택
                </button>
              </div>

              {/* 상세 분석 내용 (아코디언) */}
              {isExpanded && (
                <div className="mt-2.5 space-y-1.5 rounded-xl bg-violet-50/60 p-2.5 text-[11px] leading-relaxed text-zinc-700">
                  <div>
                    <span className="font-bold text-violet-900">발성/기교: </span>
                    <span>{member.vocalAnalysis.technique}</span>
                  </div>
                  <div>
                    <span className="font-bold text-violet-900">핵심 강점: </span>
                    <span>{member.vocalAnalysis.strengths}</span>
                  </div>
                  <div>
                    <span className="font-bold text-violet-900">추천 비트: </span>
                    <span>{member.vocalAnalysis.recommendedGenre}</span>
                  </div>
                  <div className="border-t border-violet-100 pt-1 text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-600">Suno 태그: </span>
                    <span className="font-mono text-violet-700">{member.stylePromptDescriptor}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
