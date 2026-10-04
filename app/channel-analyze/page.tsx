// app/channel-analyze/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadApiKey, loadYoutubeApiKey } from '@/lib/apiKey'
import type { YouTubeChannelInfo, YouTubeVideoItem } from '@/lib/youtube/api'
import type { AuditResult, SelfAuditInput } from '@/lib/youtube/audit'
import { CharacterAvatar } from '@/components/CharacterAvatar'

function ChannelAnalyzeContent() {
  const searchParams = useSearchParams()

  const initialUrl = searchParams.get('url') || ''
  const [inputUrl, setInputUrl] = useState(initialUrl)
  const [showSelfAudit, setShowSelfAudit] = useState(false)
  const [selfAudit, setSelfAudit] = useState<SelfAuditInput>({
    contentIdDispute: 'none',
    sunoLicense: 'commercial_paid',
    licenseNotice: 'explicit',
  })

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(null)
  const [singleVideo, setSingleVideo] = useState<YouTubeVideoItem | null>(null)
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([])
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

  async function handleAnalyze(targetInput?: string) {
    const query = (targetInput || inputUrl).trim()
    if (!query) return

    setLoading(true)
    setLoadingStep(1)
    setError(null)

    const timer1 = setTimeout(() => setLoadingStep(2), 1200)
    const timer2 = setTimeout(() => setLoadingStep(3), 2500)

    try {
      const ytKey = loadYoutubeApiKey()
      const geminiKey = loadApiKey()

      const res = await fetch('/api/channel-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ytKey ? { 'x-youtube-api-key': ytKey } : {}),
          ...(geminiKey ? { 'x-gemini-api-key': geminiKey } : {}),
        },
        body: JSON.stringify({
          input: query,
          selfAudit,
          youtubeApiKey: ytKey,
          geminiApiKey: geminiKey,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || '분석 중 문제가 발생했습니다.')
      }

      setChannel(data.channel)
      setSingleVideo(data.singleVideo || null)
      setVideos(data.videos || [])
      setAuditResult(data.auditResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setLoading(false)
    }
  }

  function handleExampleClick(ex: string) {
    setInputUrl(ex)
    handleAnalyze(ex)
  }

  // 등급별 스타일 맵
  const gradeBadgeStyles = {
    '매우 안전': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    안전: 'bg-lime-100 text-lime-800 border-lime-300',
    주의: 'bg-amber-100 text-amber-800 border-amber-300',
    위험: 'bg-orange-100 text-orange-800 border-orange-300',
    심각: 'bg-red-100 text-red-800 border-red-300',
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span>채널·영상</span> <span className="text-violet-600">분석</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            분석할 채널 주소나 개별 영상 주소를 붙여 넣어 주세요. 영상 메타데이터와 통계를 모아 Gemini로 5개 영역 점수를 산출합니다.
          </p>
        </div>
        {/* 오른쪽 스티치 배지 */}
        <div className="self-start sm:self-auto rounded-full border border-dashed border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs flex items-center gap-1.5">
          <span>100% 정답은 아니에요 ✦</span>
        </div>
      </div>

      {/* 검색 & 입력 카드 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAnalyze()
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
              🔗
            </span>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://www.youtube.com/@channel 또는 https://youtu.be/abc123..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/60 pl-11 pr-4 py-3.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>분석 중...</span>
              </>
            ) : (
              <>
                <span>→</span>
                <span>분석 시작</span>
              </>
            )}
          </button>
        </form>

        {/* 예시 버튼들 */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="text-zinc-400">예시 →</span>
          <button
            type="button"
            onClick={() => handleExampleClick('@AnimalsIsland-z5q')}
            className="rounded-xl bg-zinc-100 hover:bg-zinc-200 px-3 py-1 font-mono text-zinc-700 border border-zinc-200/60 transition"
          >
            @AnimalsIsland-z5q
          </button>
          <button
            type="button"
            onClick={() => handleExampleClick('@anihan_official')}
            className="rounded-xl bg-zinc-100 hover:bg-zinc-200 px-3 py-1 font-mono text-zinc-700 border border-zinc-200/60 transition"
          >
            @anihan_official
          </button>
        </div>

        <hr className="border-dashed border-zinc-200" />

        {/* 고급 자가진단 아코디언 토글 */}
        <div>
          <button
            type="button"
            onClick={() => setShowSelfAudit(!showSelfAudit)}
            className="flex items-center justify-between w-full text-left py-1 text-xs sm:text-sm text-zinc-700 hover:text-violet-600 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-violet-600">🛡️</span>
              <span className="font-semibold text-zinc-800">고급 자가진단</span>
              <span className="text-zinc-500 text-xs bg-zinc-100 px-2.5 py-0.5 rounded-full font-medium">
                선택 입력 · 점수 정확도 ↑
              </span>
            </div>
            <span className="text-zinc-400 text-xs">{showSelfAudit ? '▲ 접기' : '▼ 펼치기'}</span>
          </button>

          {showSelfAudit && (
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-4 text-xs sm:text-sm">
              {/* 항목 1: Content ID 분쟁 이력 */}
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-800 block">
                  1. Content ID 분쟁 이력
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: '분쟁 없음 (안전)' },
                    { id: 'few', label: '1~2회 단순 해결' },
                    { id: 'many', label: '다수 분쟁 발생 (보수 평가)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelfAudit({
                          ...selfAudit,
                          contentIdDispute: opt.id as SelfAuditInput['contentIdDispute'],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition text-xs ${
                        selfAudit.contentIdDispute === opt.id
                          ? 'border-violet-500 bg-violet-50/70 font-semibold text-violet-900'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 항목 2: Suno/Udio 상업 라이선스 */}
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-800 block">
                  2. Suno/Udio 상업 라이선스
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'commercial_paid', label: '유료 플랜 상업 라이선스 보유' },
                    { id: 'free_plan', label: '무료 플랜 사용 (수익화 시 위반)' },
                    { id: 'original_human', label: '직접 연주 또는 해당 없음' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelfAudit({
                          ...selfAudit,
                          sunoLicense: opt.id as SelfAuditInput['sunoLicense'],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition text-xs ${
                        selfAudit.sunoLicense === opt.id
                          ? 'border-violet-500 bg-violet-50/70 font-semibold text-violet-900'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 항목 3: 설명란 라이선스 명시 여부 */}
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-800 block">
                  3. 설명란 라이선스 명시 여부
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'explicit', label: '매 영상 설명란에 상업 라이선스 명시' },
                    { id: 'missing', label: '설명란에 라이선스 미명시' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelfAudit({
                          ...selfAudit,
                          licenseNotice: opt.id as SelfAuditInput['licenseNotice'],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition text-xs ${
                        selfAudit.licenseNotice === opt.id
                          ? 'border-violet-500 bg-violet-50/70 font-semibold text-violet-900'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-xs underline text-red-500">
            닫기
          </button>
        </div>
      )}

      {/* 상태 분기: 1. 분석 결과 없음 (Empty State) */}
      {!loading && !auditResult && (
        <div className="rounded-3xl bg-white border border-zinc-200 p-12 sm:p-16 text-center shadow-xs space-y-4">
          <CharacterAvatar size="xl" />
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
            분석 결과가 여기에 표시돼요
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
            채널 또는 영상 URL을 붙여 넣고 <strong>분석 시작</strong>을 눌러보세요.
          </p>
        </div>
      )}

      {/* 상태 분기: 2. 로딩 상태 */}
      {loading && (
        <div className="rounded-3xl bg-white border border-zinc-200 p-12 text-center shadow-xs space-y-6">
          <CharacterAvatar size="lg" className="animate-bounce" />
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">
              채널 정책 안전성을 정밀 채점하고 있어요
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500">
              {loadingStep === 1 && '1/3 YouTube 채널 메타데이터 수집 중...'}
              {loadingStep === 2 && '2/3 최근 15개 영상 통계 및 트랙 유사도 추출 중...'}
              {loadingStep === 3 && '3/3 Gemini AI 5개 영역 종합 채점 중...'}
            </p>
          </div>
          <div className="w-48 h-2 bg-zinc-100 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-500 rounded-full"
              style={{ width: `${(loadingStep / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 상태 분기: 3. 분석 결과 카드들 */}
      {!loading && auditResult && channel && (
        <div className="space-y-6">
          {/* 채널 프로필 요약 카드 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
            <img
              src={channel.thumbnails.medium || channel.thumbnails.default}
              alt={channel.title}
              className="w-20 h-20 rounded-full border-2 border-zinc-200 object-cover"
            />
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-zinc-900">{channel.title}</h2>
                {channel.customUrl && (
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                    {channel.customUrl}
                  </span>
                )}
                {singleVideo && (
                  <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-full font-medium">
                    영상 기반 채널 분석
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 max-w-xl">
                {channel.description || '채널 설명이 없습니다.'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-600 pt-1 font-medium">
                <span>구독자 <strong>{channel.statistics.subscriberCount.toLocaleString()}명</strong></span>
                <span>·</span>
                <span>총 조회수 <strong>{channel.statistics.viewCount.toLocaleString()}회</strong></span>
                <span>·</span>
                <span>영상 <strong>{channel.statistics.videoCount}개</strong></span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Link
                href={`/?fromChannel=${encodeURIComponent(channel.title)}`}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition text-center shadow-2xs flex items-center justify-center gap-1.5"
                title="이 채널의 음악 스타일로 Suno 프롬프트 세팅하기"
              >
                <span>🎵</span>
                <span>이 채널 스타일로 Suno 곡 생성 →</span>
              </Link>
              <Link
                href={`/revenue?input=${encodeURIComponent(channel.id)}`}
                className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition text-center"
              >
                💰 예상 수익 계산 →
              </Link>
              <a
                href={`https://www.youtube.com/channel/${channel.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition text-center"
              >
                YouTube 채널 방문 ↗
              </a>
            </div>
          </div>

          {/* 종합 점수 및 등급 카드 (100점 만점) */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  YouTube 2025 정책 안전성 평가
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
                  종합 안전 점수
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 font-mono">
                    {auditResult.totalScore}
                  </span>
                  <span className="text-base text-zinc-400 font-medium font-mono"> / 100</span>
                </div>
                <span
                  className={`rounded-2xl border px-4 py-2 text-sm font-bold shadow-xs ${
                    gradeBadgeStyles[auditResult.grade]
                  }`}
                >
                  {auditResult.grade}
                </span>
              </div>
            </div>

            {/* 프로그레스 바 */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    auditResult.totalScore >= 90
                      ? 'bg-emerald-500'
                      : auditResult.totalScore >= 70
                      ? 'bg-lime-500'
                      : auditResult.totalScore >= 40
                      ? 'bg-amber-500'
                      : auditResult.totalScore >= 20
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${auditResult.totalScore}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-right">
                {auditResult.gradeSummary}
              </p>
            </div>

            {/* AI 심사관 총평 리뷰 */}
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-5 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>🤖</span> Gemini AI 심사 총평
              </h4>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {auditResult.summaryReview}
              </p>
            </div>

            {/* 강점 & 주의사항 & 실천 과제 3단 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2">
                <h5 className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <span>✓</span> 잘하고 있는 강점
                </h5>
                <ul className="space-y-1 list-disc list-inside text-emerald-950/80">
                  {auditResult.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-2">
                <h5 className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span>⚠️</span> 주의해야 할 위험
                </h5>
                <ul className="space-y-1 list-disc list-inside text-amber-950/80">
                  {auditResult.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-violet-50/70 border border-violet-200 p-4 space-y-2">
                <h5 className="font-bold text-violet-800 flex items-center gap-1.5">
                  <span>🎯</span> 추천 조치 사항
                </h5>
                <ul className="space-y-1 list-disc list-inside text-violet-950/80">
                  {auditResult.actionItems.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 5대 평가 영역 세부 카드 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>📊</span> 5대 핵심 평가 영역별 상세 진단
              </h3>
              <Link
                href="/guidelines"
                className="text-xs text-violet-600 font-semibold hover:underline"
              >
                평가 가이드라인 전체 보기 →
              </Link>
            </div>

            {/* 1. Inauthentic Content */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-600 font-bold font-mono">1.</span>
                    <h4 className="font-bold text-zinc-900 text-sm sm:text-base">
                      {auditResult.categories.inauthentic.name}
                    </h4>
                    <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                      최우선 위험
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    음악(트랙) 반복 및 짧은 클립 무한 루프 검사
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-zinc-900">
                    {auditResult.categories.inauthentic.score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono"> / 35</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed">
                {auditResult.categories.inauthentic.comment}
              </p>
              {auditResult.categories.inauthentic.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-red-600">감점 내역:</span>
                  {auditResult.categories.inauthentic.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                      <div>
                        <strong className="text-red-900">{d.name}</strong>
                        <p className="text-zinc-600 mt-0.5">{d.reason}</p>
                      </div>
                      <span className="text-red-600 font-bold ml-2">{d.points}점</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Reused Content */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-600 font-bold font-mono">2.</span>
                    <h4 className="font-bold text-zinc-900 text-sm sm:text-base">
                      {auditResult.categories.reused.name}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    자기 채널 트랙 재업로드 및 타 채널 큐레이션 복제 검사
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-zinc-900">
                    {auditResult.categories.reused.score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono"> / 20</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed">
                {auditResult.categories.reused.comment}
              </p>
              {auditResult.categories.reused.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-red-600">감점 내역:</span>
                  {auditResult.categories.reused.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                      <div>
                        <strong className="text-red-900">{d.name}</strong>
                        <p className="text-zinc-600 mt-0.5">{d.reason}</p>
                      </div>
                      <span className="text-red-600 font-bold ml-2">{d.points}점</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Metadata */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-600 font-bold font-mono">3.</span>
                    <h4 className="font-bold text-zinc-900 text-sm sm:text-base">
                      {auditResult.categories.metadata.name}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    가짜 라이브(LIVE) 사칭 및 키워드 낚시·카테고리 우회 검사
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-zinc-900">
                    {auditResult.categories.metadata.score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono"> / 20</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed">
                {auditResult.categories.metadata.comment}
              </p>
              {auditResult.categories.metadata.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-red-600">감점 내역:</span>
                  {auditResult.categories.metadata.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                      <div>
                        <strong className="text-red-900">{d.name}</strong>
                        <p className="text-zinc-600 mt-0.5">{d.reason}</p>
                      </div>
                      <span className="text-red-600 font-bold ml-2">{d.points}점</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. AI License */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-600 font-bold font-mono">4.</span>
                    <h4 className="font-bold text-zinc-900 text-sm sm:text-base">
                      {auditResult.categories.aiLicense.name}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    실존 인물 보이스 클로닝 모방 및 상업 라이선스 증빙 검사
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-zinc-900">
                    {auditResult.categories.aiLicense.score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono"> / 15</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed">
                {auditResult.categories.aiLicense.comment}
              </p>
              {auditResult.categories.aiLicense.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-red-600">감점 내역:</span>
                  {auditResult.categories.aiLicense.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                      <div>
                        <strong className="text-red-900">{d.name}</strong>
                        <p className="text-zinc-600 mt-0.5">{d.reason}</p>
                      </div>
                      <span className="text-red-600 font-bold ml-2">{d.points}점</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Traffic */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-600 font-bold font-mono">5.</span>
                    <h4 className="font-bold text-zinc-900 text-sm sm:text-base">
                      {auditResult.categories.traffic.name}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    썸네일-음악 무드 부조화 및 비정상 인위적 트래픽 패턴 검사
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-zinc-900">
                    {auditResult.categories.traffic.score}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono"> / 10</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl leading-relaxed">
                {auditResult.categories.traffic.comment}
              </p>
              {auditResult.categories.traffic.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-red-600">감점 내역:</span>
                  {auditResult.categories.traffic.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                      <div>
                        <strong className="text-red-900">{d.name}</strong>
                        <p className="text-zinc-600 mt-0.5">{d.reason}</p>
                      </div>
                      <span className="text-red-600 font-bold ml-2">{d.points}점</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 업로드 영상 리스트 */}
          {videos.length > 0 && (
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>🎬</span> 분석 대상 최근 영상 메타데이터 ({videos.length}개)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 space-y-2 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-200">
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 text-white font-mono text-[10px] px-1.5 py-0.5">
                          {v.durationFormatted}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-zinc-800 line-clamp-2 mt-2 leading-snug">
                        {v.title}
                      </h5>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/50">
                      <span>조회수 {v.viewCount.toLocaleString()}</span>
                      <a
                        href={`https://www.youtube.com/watch?v=${v.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 font-medium hover:underline"
                      >
                        보기 ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ChannelAnalyzePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-400">페이지 로딩 중...</div>}>
      <ChannelAnalyzeContent />
    </Suspense>
  )
}
