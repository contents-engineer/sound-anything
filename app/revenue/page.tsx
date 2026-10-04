// app/revenue/page.tsx
'use client'

import { useState } from 'react'
import { loadYoutubeApiKey } from '@/lib/apiKey'
import type { YouTubeChannelInfo, YouTubeVideoItem } from '@/lib/youtube/api'
import type { RevenueEstimation } from '@/lib/youtube/revenue'
import { CharacterAvatar } from '@/components/CharacterAvatar'

export default function RevenuePage() {
  const [inputUrl, setInputUrl] = useState('')
  const [period, setPeriod] = useState<'30d' | '1y' | 'all'>('30d')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(null)
  const [singleVideo, setSingleVideo] = useState<YouTubeVideoItem | null>(null)
  const [revenue, setRevenue] = useState<RevenueEstimation | null>(null)

  async function handleAnalyze(e?: React.FormEvent, customPeriod?: '30d' | '1y' | 'all') {
    if (e) e.preventDefault()
    const targetPeriod = customPeriod || period
    const url = inputUrl.trim()
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const apiKey = loadYoutubeApiKey()
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-youtube-api-key': apiKey } : {}),
        },
        body: JSON.stringify({ input: url, period: targetPeriod, youtubeApiKey: apiKey }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || '수익 분석 중 문제가 발생했습니다.')
      }

      setChannel(data.channel)
      setSingleVideo(data.singleVideo || null)
      setRevenue(data.revenue)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function changePeriod(newPeriod: '30d' | '1y' | 'all') {
    setPeriod(newPeriod)
    if (revenue && inputUrl) {
      handleAnalyze(undefined, newPeriod)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span>채널</span> <span className="text-violet-600">수익 분석</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            유튜브 영상 또는 채널 링크를 넣으면, 조회수와 영상 길이를 바탕으로 <strong>채널 예상 수익</strong>과 <strong>음원 유통 예상 수익</strong>을 함께 계산해 줘요. 영상 한 편의 수익과 채널 전체의 최근 30일·1년 수익을 한눈에 볼 수 있어요.
          </p>
        </div>
        {/* 오른쪽 스티치 뱃지 */}
        <div className="self-start sm:self-auto rounded-full border border-dashed border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs flex items-center gap-1.5">
          <span>💰</span>
          <span>수익 예측 ✦</span>
        </div>
      </div>

      {/* 입력 카드 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-5">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="유튜브 영상 또는 채널 URL · 예) https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>계산 중...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>수익 분석하기</span>
              </>
            )}
          </button>
        </form>

        {/* 집계 기간 탭 */}
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="text-zinc-500 font-medium">집계 기간</span>
          <div className="flex gap-2">
            {(
              [
                { id: '30d', label: '최근 30일' },
                { id: '1y', label: '최근 1년' },
                { id: 'all', label: '전체 누적' },
              ] as const
            ).map((item) => {
              const active = period === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changePeriod(item.id)}
                  className={`rounded-xl px-4 py-1.5 font-medium transition ${
                    active
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 하단 주석 */}
        <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-400">
          * 모든 수치는 한국 YouTube 일반 수익률 기준 <strong>예상치</strong>예요. 카테고리·시청자 국적·광고 단가에 따라 실제와 다를 수 있어요.
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

      {/* 결과 영역 or Empty State */}
      {!revenue ? (
        <div className="rounded-3xl bg-white border border-zinc-200 p-12 text-center shadow-xs space-y-4">
          <CharacterAvatar size="lg" />
          <h3 className="text-lg font-bold text-zinc-800">예상 수익을 계산해 드릴게요</h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
            음악 플레이리스트 영상이나 채널 URL을 입력하면 예상되는 광고 수익과 음원 유통 스트리밍 수익을 분리 계산합니다.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 채널/영상 프로필 헤더 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
            {channel?.thumbnails?.medium && (
              <img
                src={channel.thumbnails.medium}
                alt={channel.title}
                className="w-16 h-16 rounded-full border-2 border-zinc-200 object-cover"
              />
            )}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-zinc-900">{revenue.title}</h2>
                <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-full font-medium">
                  {revenue.type === 'video' ? '개별 영상' : '채널 전체'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {singleVideo ? (
                  <span>영상 재생시간: {singleVideo.durationFormatted} · 조회수: {singleVideo.viewCount.toLocaleString()}회</span>
                ) : (
                  <span>
                    구독자 {channel?.statistics.subscriberCount.toLocaleString()}명 · 누적 조회수 {channel?.statistics.viewCount.toLocaleString()}회
                  </span>
                )}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs text-zinc-400 block">적용 RPM (1,000회당)</span>
              <span className="text-base font-bold text-zinc-800 font-mono">
                ₩{revenue.rpmKrw.toLocaleString()} (${revenue.rpmUsd})
              </span>
              {revenue.hasMidrollBonus && (
                <span className="block text-[11px] text-emerald-600 font-medium">
                  ✓ 8분 이상 미드롤 가중치 적용됨
                </span>
              )}
            </div>
          </div>

          {/* 총 수익 요약 카드 (메인) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 합산 총 예상 수익 */}
            <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-md shadow-violet-200 space-y-2">
              <span className="text-xs font-medium text-violet-100">
                총 합산 예상 수익 ({period === '30d' ? '30일' : period === '1y' ? '1년' : '누적'})
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ₩{revenue.totalRevenueKrw.toLocaleString()}
              </div>
              <p className="text-xs text-violet-200 font-mono">
                약 ${revenue.totalRevenueUsd.toLocaleString()} USD
              </p>
            </div>

            {/* 유튜브 광고 수익 */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-2">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <span>📺</span> YouTube 광고 예상 수익
              </span>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900">
                ₩{revenue.youtubeAdRevenueKrw.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500">
                대상 조회수: {revenue.targetViews.toLocaleString()}회
              </p>
            </div>

            {/* 음원 유통 스트리밍 수익 */}
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-2">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <span>🎧</span> 음원 유통 예상 수익
              </span>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900">
                ₩{revenue.streamingRoyaltyKrw.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-500">
                스포티파이/멜론 등 음원 플랫폼 전환 시
              </p>
            </div>
          </div>

          {/* 주요 영상별 예상 수익 TOP */}
          {revenue.topVideos && revenue.topVideos.length > 0 && (
            <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>🎬</span> 최근 주요 영상별 예상 수익
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {revenue.topVideos.map((v) => (
                  <div
                    key={v.id}
                    className="flex gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 items-center"
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-20 h-12 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-zinc-800 line-clamp-1">
                        {v.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {v.viewCount.toLocaleString()}회 {v.isLongForm ? '· 8분+' : ''}
                      </p>
                      <span className="text-xs font-bold text-violet-700 mt-1 block">
                        ₩{v.estimatedRevenueKrw.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 수익 극대화 팁 */}
          <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-6 text-xs sm:text-sm text-amber-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5">
              <span>💡</span> 음악 플레이리스트 채널 수익 극대화 팁
            </h4>
            <ul className="list-disc list-inside space-y-1 text-amber-950/80 pl-1">
              <li><strong>8분 이상 길이 유지:</strong> 8분 이상 영상은 중간 광고(미드롤)를 수동 배치할 수 있어 일반 영상 대비 약 1.5배 높은 RPM을 창출합니다.</li>
              <li><strong>음원 분산 유통:</strong> Suno나 자체 음악으로 만든 곡을 스포티파이, 유튜브 뮤직에 공식 음원으로 등록하면 유튜브 시청자가 외부 음원 사이트에서 청취할 때마다 추가 음원 스트리밍 인세가 발생합니다.</li>
              <li><strong>정체성 유지:</strong> 일관된 썸네일과 브랜딩으로 구독자의 재방문율을 높이면 YouTube 알고리즘 추천 점수가 급상승합니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
