// lib/youtube/trends.ts
import { fetchVideosByIds, YouTubeVideoItem } from './api'

export interface TrendItem extends YouTubeVideoItem {
  channelSubscriberCount: number
  viewsPerDay: number
  performanceScore: number // 채널 규모 대비 효율
  isTrending: boolean
}

export interface TrendSearchParams {
  country: string
  genre: string
  period: string
  sort: string
  apiKey: string
  customQuery?: string
}

const COUNTRY_MAP: Record<string, { regionCode?: string; defaultKeyword: string }> = {
  all: { defaultKeyword: 'playlist music' },
  KR: { regionCode: 'KR', defaultKeyword: '플레이리스트' },
  JP: { regionCode: 'JP', defaultKeyword: '作業用BGM プレイリスト' },
  US: { regionCode: 'US', defaultKeyword: 'playlist vibes' },
  EU: { regionCode: 'GB', defaultKeyword: 'playlist chill' },
  SEA: { regionCode: 'ID', defaultKeyword: 'playlist lagu' },
  LATAM: { regionCode: 'MX', defaultKeyword: 'musica playlist' },
}

const GENRE_MAP: Record<string, string> = {
  all: '',
  lofi: 'lo-fi lofi',
  jazz: 'jazz',
  cafe: 'cafe coffee 카페',
  study: 'study 공부집중',
  sleep: 'sleep 수면 ambient',
  newage: 'new age piano 피아노',
  indie: 'indie 인디',
  citypop: 'city pop 시티팝',
  rnb: 'R&B chill',
  acoustic: 'acoustic 어쿠스틱',
}

export async function fetchTrendingPlaylists(params: TrendSearchParams): Promise<TrendItem[]> {
  const { country, genre, period, sort, apiKey, customQuery } = params

  const countryConfig = COUNTRY_MAP[country] || COUNTRY_MAP.all
  const genreKeyword = GENRE_MAP[genre] || (genre !== 'all' ? genre : '')

  // 1. 키워드 조합
  const queryParts: string[] = []
  if (customQuery) {
    queryParts.push(customQuery)
  } else {
    queryParts.push(countryConfig.defaultKeyword)
    if (genreKeyword) {
      queryParts.push(genreKeyword)
    }
  }

  const q = queryParts.join(' ').trim()

  // 2. 기간 계산 (publishedAfter)
  const now = new Date()
  let daysAgo = 7
  if (period === '24h') daysAgo = 1
  else if (period === '7d') daysAgo = 7
  else if (period === '30d') daysAgo = 30
  else if (period === '90d') daysAgo = 90

  const publishedAfter = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

  // 3. YouTube search.list 호출 (API v3)
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('videoCategoryId', '10') // Music category
  searchUrl.searchParams.set('maxResults', '25')
  searchUrl.searchParams.set('q', q)
  searchUrl.searchParams.set('publishedAfter', publishedAfter)
  if (countryConfig.regionCode) {
    searchUrl.searchParams.set('regionCode', countryConfig.regionCode)
  }

  // YouTube search order 지원값: date, rating, relevance, title, videoCount, viewCount
  if (sort === 'rising') {
    searchUrl.searchParams.set('order', 'date')
  } else {
    searchUrl.searchParams.set('order', 'viewCount')
  }
  searchUrl.searchParams.set('key', apiKey)

  const res = await fetch(searchUrl.toString())
  const data = await res.json()

  if (data.error) {
    throw new Error(data.error.message || '인기 플레이리스트를 불러오지 못했습니다.')
  }

  const items = data.items || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean)

  if (videoIds.length === 0) {
    return []
  }

  // 4. videos.list 일괄 호출로 뷰수 및 상세 정보 가져오기
  const detailedVideos = await fetchVideosByIds(videoIds, apiKey)

  // 5. 고유 채널 ID 목록 추출 후 채널 구독자수 일괄 조회
  const channelIds = Array.from(new Set(detailedVideos.map((v) => v.channelId).filter(Boolean)))
  const channelSubMap = new Map<string, number>()

  if (channelIds.length > 0) {
    try {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(
        ','
      )}&key=${apiKey}`
      const chRes = await fetch(channelUrl)
      const chData = await chRes.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(chData.items || []).forEach((c: any) => {
        channelSubMap.set(c.id, Number(c.statistics?.subscriberCount || 0))
      })
    } catch {
      // ignore
    }
  }

  // 6. 일일 조회수 및 채널 규모 대비 지표 계산
  const trendItems: TrendItem[] = detailedVideos.map((video) => {
    const pubDate = new Date(video.publishedAt).getTime()
    const ageHours = Math.max(1, (now.getTime() - pubDate) / (1000 * 3600))
    const ageDays = Math.max(0.1, ageHours / 24)
    const viewsPerDay = Math.round(video.viewCount / ageDays)

    const subs = channelSubMap.get(video.channelId) || 1
    // 구독자 대비 조회수 배율
    const performanceScore = Number((video.viewCount / Math.max(100, subs)).toFixed(2))

    // 최근 72시간 이내이면서 일일 조회수 높은 경우 급상승 마크
    const isTrending = ageHours <= 72 && viewsPerDay > 5000

    return {
      ...video,
      channelSubscriberCount: subs,
      viewsPerDay,
      performanceScore,
      isTrending,
    }
  })

  // 7. 정렬 기준 적용
  if (sort === 'rising') {
    // 급상승 (시간당 조회수 높은 순)
    trendItems.sort((a, b) => b.viewsPerDay - a.viewsPerDay)
  } else if (sort === 'channelRatio') {
    // 채널 규모 대비 폭발적 성과 순
    trendItems.sort((a, b) => b.performanceScore - a.performanceScore)
  } else {
    // 조회수 순
    trendItems.sort((a, b) => b.viewCount - a.viewCount)
  }

  return trendItems
}
