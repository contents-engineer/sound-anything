// components/ResceneVocalSelector.tsx
'use client'

import { useState } from 'react'
import { RESCENE_MEMBERS, RESCENE_PART_CUES } from '@/lib/rescene-vocal'

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
  const isFullGroup = selectedVocals.includes(RESCENE_MEMBERS[0].label)

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/40 p-5 shadow-xs">
      {/* 헤더 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-violet-100/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-pink-400 text-base shadow-xs">
            🫧
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                리센느 멤버 파트 분배 &amp; 보컬 연출 (가사 섹션별 배치)
              </h3>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                파트 브래킷 태그 탑재
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                🎙️ AI 에코 차단
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              가사를 뽑을 때 각 멤버의 태그([Minami], [Liv], [Zena] 등)가 소절(Line) 단위로 티키타카 교차 배치되어 K-Pop 걸그룹의 다이내믹한 보컬 전환을 이끕니다.
            </p>
          </div>
        </div>

        {/* 퀵 라인업 버튼 */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-medium text-zinc-400">파트 구성:</span>
          <button
            type="button"
            onClick={() => onSelectExclusiveMember(RESCENE_MEMBERS[0].label)}
            className={[
              'rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
              isFullGroup
                ? 'bg-violet-600 text-white shadow-2xs'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-violet-300 hover:text-violet-700',
            ].join(' ')}
          >
            🫧 5인 완전체 (소절 교차 분배)
          </button>
          <button
            type="button"
            onClick={() => {
              const m = RESCENE_MEMBERS.find((x) => x.id === 'minami')!
              const l = RESCENE_MEMBERS.find((x) => x.id === 'liv')!
              onSelectExclusiveMember(m.label)
              onToggleVocal(l.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            🎤 미나미 &amp; 리브 (보컬라인)
          </button>
          <button
            type="button"
            onClick={() => {
              const w = RESCENE_MEMBERS.find((x) => x.id === 'woni')!
              const z = RESCENE_MEMBERS.find((x) => x.id === 'zena')!
              onSelectExclusiveMember(w.label)
              onToggleVocal(z.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            ⚡ 원이 &amp; 제나 (비트유닛)
          </button>
          <button
            type="button"
            onClick={() => {
              const my = RESCENE_MEMBERS.find((x) => x.id === 'may')!
              const l = RESCENE_MEMBERS.find((x) => x.id === 'liv')!
              onSelectExclusiveMember(my.label)
              onToggleVocal(l.label)
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:text-violet-700"
          >
            ☁️ 메이 &amp; 리브 (몽환유닛)
          </button>
        </div>
      </div>

      {/* 가사 파트 전개 시뮬레이션 타임라인 */}
      <div className="mb-4 rounded-2xl border border-violet-100 bg-white/90 p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
            <span>🎼</span> K-Pop 소절(Line)별 교차 분배 구조 (미나미·리브 중심 보컬 밸런스)
          </span>
          <span className="text-[10px] text-zinc-400">1~2줄씩 티키타카 교대</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
          <div className="rounded-xl bg-purple-50/80 border border-purple-200/60 p-2">
            <span className="text-[10px] font-bold text-purple-700 block">1. 벌스 1 (도입)</span>
            <span className="text-xs font-bold text-zinc-800 mt-0.5 block">제나 ➔ 미나미</span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">포문 열기 &amp; 텐션</span>
          </div>
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-2">
            <span className="text-[10px] font-bold text-amber-700 block">2. 벌스 연결</span>
            <span className="text-xs font-bold text-zinc-800 mt-0.5 block">메이 ➔ 원이</span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">귓속말 &amp; 그루브</span>
          </div>
          <div className="rounded-xl bg-pink-50/80 border border-pink-200/60 p-2">
            <span className="text-[10px] font-bold text-pink-700 block">3. 프리코러스 빌드업</span>
            <span className="text-xs font-bold text-zinc-800 mt-0.5 block">리브 ➔ 미나미</span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">크리스탈 &amp; 고음 상승</span>
          </div>
          <div className="rounded-xl bg-violet-100/90 border border-violet-300 p-2 shadow-2xs">
            <span className="text-[10px] font-bold text-violet-800 block">4. 후렴 (Chorus)</span>
            <span className="text-xs font-bold text-violet-950 mt-0.5 block">미나미 &amp; 리브 리드</span>
            <span className="text-[10px] text-violet-700 block leading-tight mt-0.5">센터 멜로디 + 5인 화음</span>
          </div>
          <div className="rounded-xl bg-rose-50/80 border border-rose-200/60 p-2">
            <span className="text-[10px] font-bold text-rose-700 block">5. 브릿지 클라이맥스</span>
            <span className="text-xs font-bold text-zinc-800 mt-0.5 block">리브 ➔ 미나미</span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">감성 고조 &amp; 초고음 벨팅</span>
          </div>
          <div className="rounded-xl bg-indigo-50/80 border border-indigo-200/60 p-2">
            <span className="text-[10px] font-bold text-indigo-700 block">6. 아웃트로</span>
            <span className="text-xs font-bold text-zinc-800 mt-0.5 block">메이 &amp; ALL</span>
            <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">은은한 잔향 페이드아웃</span>
          </div>
        </div>
      </div>

      {/* 6명 멤버별 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {RESCENE_MEMBERS.map((member) => {
          const active = isSelected(member.label)
          const isExpanded = expandedMemberId === member.id
          const partCue = RESCENE_PART_CUES.find((p) => p.memberId === member.id)

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
              {/* 상단: 이름 + 배지 + 체크박스 */}
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

              {/* 가사 브래킷 태그 미리보기 */}
              {partCue && (
                <div className="mt-2.5 rounded-xl bg-violet-50/70 border border-violet-100 p-2 text-[11px]">
                  <div className="text-[10px] font-bold text-violet-800">
                    가사 적용 브래킷:
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] font-semibold text-violet-900 truncate">
                    {partCue.lyricBracketTag}
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-500 leading-tight">
                    {partCue.sectionRole}
                  </div>
                </div>
              )}

              {/* 음색 요약 문구 */}
              <p
                onClick={() => onToggleVocal(member.label)}
                className="mt-2 cursor-pointer text-xs leading-relaxed text-zinc-600"
              >
                {member.vocalAnalysis.tone}
              </p>

              {/* 하단 상세 분석 펼침 토글 버튼 */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                  className="inline-flex items-center gap-1 font-medium text-violet-600 hover:text-violet-800"
                >
                  <span>{isExpanded ? '▲ 연출 접기' : '▼ 보컬 연출 분석'}</span>
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
                    <span className="font-bold text-violet-900">보컬 연출: </span>
                    <span>{partCue?.vocalDirecting || member.vocalAnalysis.strengths}</span>
                  </div>
                  <div>
                    <span className="font-bold text-violet-900">추천 비트: </span>
                    <span>{member.vocalAnalysis.recommendedGenre}</span>
                  </div>
                  <div className="border-t border-violet-100 pt-1 text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-600">Suno Style 태그: </span>
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
