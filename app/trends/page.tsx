// app/trends/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { loadYoutubeApiKey, saveYoutubeApiKey } from '@/lib/apiKey'
import type { TrendItem } from '@/lib/youtube/trends'
import { CharacterAvatar } from '@/components/CharacterAvatar'

const COUNTRIES = [
  { id: 'all', label: '전체' },
  { id: 'KR', label: '한국' },
  { id: 'JP', label: '일본' },
  { id: 'US', label: '미국/영미권' },
  { id: 'EU', label: '유럽' },
  { id: 'SEA', label: '동남아' },
  { id: 'LATAM', label: '라틴' },
] as const

const BASE_GENRES = [
  { id: 'all', label: '전체 (믹스)' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'jazz', label: '재즈' },
  { id: 'cafe', label: '카페' },
  { id: 'study', label: '공부' },
  { id: 'sleep', label: '수면' },
  { id: 'newage', label: '뉴에이지' },
] as const

const COUNTRY_EXTRA_GENRES: Record<string, Array<{ id: string; label: string }>> = {
  KR: [
    { id: 'indie', label: 'K-인디' },
    { id: 'citypop', label: '시티팝' },
  ],
  JP: [
    { id: 'citypop', label: '시티팝' },
    { id: 'acoustic', label: '어쿠스틱' },
  ],
  US: [
    { id: 'rnb', label: 'R&B Chill' },
    { id: 'acoustic', label: '어쿠스틱' },
  ],
  EU: [
    { id: 'acoustic', label: 'Acoustic' },
  ],
  SEA: [
    { id: 'acoustic', label: 'Santai' },
  ],
  LATAM: [
    { id: 'acoustic', label: 'Bossa Nova' },
  ],
}

const PERIODS = [
  { id: '7d', label: '7일' },
  { id: '24h', label: '24시간' },
  { id: '30d', label: '30일' },
  { id: '90d', label: '90일' },
] as const

const SORTS = [
  { id: 'viewCount', label: '조회수 기준' },
  { id: 'rising', label: '급상승' },
  { id: 'channelRatio', label: '채널 규모 대비' },
] as const

export default function TrendsPage() {
  const [country, setCountry] = useState<string>('all')
  const [genre, setGenre] = useState<string>('all')
  const [period, setPeriod] = useState<string>('7d')
  const [sort, setSort] = useState<string>('viewCount')

  const [hasApiKey, setHasApiKey] = useState(false)
  const [quickKeyInput, setQuickKeyInput] = useState('')
  const [quickKeyModal, setQuickKeyModal] = useState(false)

  const [items, setItems] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeVideoModal, setActiveVideoModal] = useState<TrendItem | null>(null)

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiKey = loadYoutubeApiKey()
      const queryParams = new URLSearchParams({
        country,
        genre,
        period,
        sort,
      })

      const res = await fetch(`/api/trends?${queryParams.toString()}`, {
        headers: {
          ...(apiKey ? { 'x-youtube-api-key': apiKey } : {}),
        },
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.error?.code === 'NO_YOUTUBE_KEY') {
          setHasApiKey(false)
          return
        }
        throw new Error(data.error?.message || '트렌드를 불러오지 못했습니다.')
      }

      setHasApiKey(true)
      setItems(data.items || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [country, genre, period, sort])

  // Hydration-safe: check keys after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasApiKey(Boolean(loadYoutubeApiKey()))
    fetchTrends()
  }, [fetchTrends])

  function handleSaveQuickKey(e: React.FormEvent) {
    e.preventDefault()
    const k = quickKeyInput.trim()
    if (!k) return
    saveYoutubeApiKey(k)
    setHasApiKey(true)
    setQuickKeyInput('')
    setQuickKeyModal(false)
    fetchTrends()
  }

  // 동적 장르 목록 계산 (공통 + 선택 국가 특화 장르)
  const availableGenres = [
    ...BASE_GENRES,
    ...(country !== 'all' && COUNTRY_EXTRA_GENRES[country] ? COUNTRY_EXTRA_GENRES[country] : []),
  ]

  const activeSortLabel = SORTS.find((s) => s.id === sort)?.label || '조회수 기준'

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span>핫플리</span> <span className="text-violet-600">트렌드</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            국가별로 어떤 음악 플레이리스트가 뜨는지 비교해 봐요. 국가를 고르면 그 문화권에서 실제로 잘 쓰이는 장르만 노출되고, 공통 무드(Lo-fi·재즈·카페·공부·수면)는 어디서나 같이 보여요.
          </p>
        </div>
        {/* 우측 스티치 배지 */}
        <div className="self-start sm:self-auto rounded-full border border-dashed border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-xs flex items-center gap-1.5">
          <span>{activeSortLabel} ✦</span>
        </div>
      </div>

      {/* 필터 카드 영역 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-5">
        {/* 1. 국가 필터 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="w-12 text-xs font-semibold text-zinc-400 flex-shrink-0">국가</span>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const active = country === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCountry(c.id)
                    setGenre('all') // 국가 변경 시 장르 기본값으로
                  }}
                  className={`rounded-2xl px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <hr className="border-dashed border-zinc-100" />

        {/* 2. 장르 필터 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="w-12 text-xs font-semibold text-zinc-400 flex-shrink-0">장르</span>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((g) => {
              const active = genre === g.id
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenre(g.id)}
                  className={`rounded-2xl px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100'
                  }`}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </div>

        <hr className="border-dashed border-zinc-100" />

        {/* 3. 기간 필터 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="w-12 text-xs font-semibold text-zinc-400 flex-shrink-0">기간</span>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => {
              const active = period === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-2xl px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                    active
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        <hr className="border-dashed border-zinc-100" />

        {/* 4. 정렬 필터 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="w-12 text-xs font-semibold text-zinc-400 flex-shrink-0">정렬</span>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => {
              const active = sort === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-2xl px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200/80 hover:bg-zinc-100'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
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

      {/* 상태 분기: 1. API 키 미등록 상태 */}
      {!hasApiKey && (
        <div className="rounded-3xl bg-white border border-zinc-200 p-12 text-center shadow-xs space-y-4">
          <CharacterAvatar size="xl" />
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
            먼저 YouTube API 키를 등록해 주세요
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
            좌측 메뉴 <strong>API 연결</strong>에서 키를 저장하면 트렌드를 불러올 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/settings"
              className="rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition flex items-center gap-2"
            >
              <span>API 연결로 가기 →</span>
            </Link>
            <button
              type="button"
              onClick={() => setQuickKeyModal(true)}
              className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
            >
              여기서 바로 키 입력
            </button>
          </div>
        </div>
      )}

      {/* 바로 키 입력 모달 */}
      {quickKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900">YouTube Data API v3 키 등록</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Google Cloud Console에서 발급받은 YouTube Data API v3 키를 입력해 주세요. 브라우저 localStorage에만 안전하게 보관됩니다.
            </p>
            <form onSubmit={handleSaveQuickKey} className="space-y-3">
              <input
                type="password"
                value={quickKeyInput}
                onChange={(e) => setQuickKeyInput(e.target.value)}
                placeholder="AIzaSy로 시작하는 키 붙여넣기"
                autoFocus
                className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setQuickKeyModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!quickKeyInput.trim()}
                  className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  저장하고 불러오기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상태 분기: 2. 로딩 중 */}
      {hasApiKey && loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl bg-white border border-zinc-200 p-4 shadow-xs animate-pulse space-y-3"
            >
              <div className="w-full aspect-video rounded-2xl bg-zinc-200" />
              <div className="h-4 bg-zinc-200 rounded w-3/4" />
              <div className="h-3 bg-zinc-200 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-zinc-100 rounded-lg w-16" />
                <div className="h-5 bg-zinc-100 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상태 분기: 3. 결과 없음 */}
      {hasApiKey && !loading && items.length === 0 && (
        <div className="rounded-3xl bg-white border border-zinc-200 p-12 text-center shadow-xs space-y-3">
          <CharacterAvatar size="md" />
          <h3 className="text-base font-bold text-zinc-800">해당 조건의 플레이리스트가 없어요</h3>
          <p className="text-xs text-zinc-500">
            기간을 30일이나 90일로 늘리거나, 장르를 전체(믹스)로 변경해 보세요.
          </p>
        </div>
      )}

      {/* 상태 분기: 4. 트렌드 플레이리스트 카드 그리드 */}
      {hasApiKey && !loading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-white border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md hover:border-zinc-300 transition flex flex-col justify-between"
            >
              <div>
                {/* 썸네일 영역 */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {/* 영상 길이 */}
                  <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/80 text-white font-mono text-[11px] px-2 py-0.5 font-medium backdrop-blur-xs">
                    {item.durationFormatted}
                  </span>
                  {/* 급상승 뱃지 */}
                  {item.isTrending && (
                    <span className="absolute top-2.5 left-2.5 rounded-lg bg-amber-500 text-white text-[11px] px-2.5 py-0.5 font-bold shadow-xs flex items-center gap-1">
                      <span>🔥</span> 급상승
                    </span>
                  )}
                  {/* 플레이 버튼 오버레이 */}
                  <button
                    onClick={() => setActiveVideoModal(item)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition"
                    title="미리보기 재생"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                      ▶
                    </div>
                  </button>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="p-4 space-y-2">
                  <h3
                    className="text-xs sm:text-sm font-bold text-zinc-900 line-clamp-2 leading-snug group-hover:text-violet-600 transition cursor-pointer"
                    onClick={() => setActiveVideoModal(item)}
                    title={item.title}
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span className="font-medium text-zinc-700 truncate max-w-[150px]">
                      {item.channelTitle}
                    </span>
                    <span>
                      구독자 {item.channelSubscriberCount.toLocaleString()}명
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>
                      조회수 <strong>{item.viewCount.toLocaleString()}회</strong>
                    </span>
                    <span className="text-violet-600 font-medium">
                      일일 +{item.viewsPerDay.toLocaleString()}회
                    </span>
                  </div>

                  {/* 태그 */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-zinc-50 border border-zinc-200/60 px-1.5 py-0.5 text-[10px] text-zinc-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 링크 & 분석 & Suno 생성 버튼 */}
              <div className="p-4 pt-0 flex flex-wrap gap-1.5">
                <a
                  href={`https://www.youtube.com/watch?v=${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[70px] text-center rounded-xl border border-zinc-200 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition truncate"
                >
                  YouTube ↗
                </a>
                <Link
                  href={`/channel-analyze?url=${encodeURIComponent(
                    `https://www.youtube.com/watch?v=${item.id}`
                  )}`}
                  className="rounded-xl bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 transition"
                  title="이 채널/영상 5대 영역 정책 분석하기"
                >
                  분석
                </Link>
                <Link
                  href={`/?trendTitle=${encodeURIComponent(item.title)}&tags=${encodeURIComponent(item.tags.join(','))}`}
                  className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition flex items-center gap-1 shadow-2xs"
                  title="이 트렌드 감성으로 수노 프롬프트 생성하기"
                >
                  <span>🎵</span>
                  <span>Suno 생성</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 영상 재생 모달 */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white overflow-hidden shadow-2xl space-y-4">
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.id}?autoplay=1`}
                title={activeVideoModal.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6 pt-0 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                  {activeVideoModal.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {activeVideoModal.channelTitle} · 조회수 {activeVideoModal.viewCount.toLocaleString()}회
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/?trendTitle=${encodeURIComponent(activeVideoModal.title)}&tags=${encodeURIComponent(activeVideoModal.tags.join(','))}`}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 flex items-center gap-1 shadow-2xs"
                >
                  <span>🎵</span>
                  <span>Suno 곡 생성</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveVideoModal(null)}
                  className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
