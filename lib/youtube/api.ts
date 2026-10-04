// lib/youtube/api.ts

export interface YouTubeChannelInfo {
  id: string
  title: string
  description: string
  customUrl: string
  publishedAt: string
  thumbnails: {
    default: string
    medium: string
    high: string
  }
  statistics: {
    viewCount: number
    subscriberCount: number
    hiddenSubscriberCount: boolean
    videoCount: number
  }
  uploadsPlaylistId: string
}

export interface YouTubeVideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  durationSec: number
  durationFormatted: string
  viewCount: number
  likeCount: number
  commentCount: number
  tags: string[]
  channelId: string
  channelTitle: string
}

export function parseYouTubeInput(input: string): {
  type: 'handle' | 'channelId' | 'videoId' | 'query'
  value: string
} {
  const trimmed = input.trim()

  // 1. 영상 URL (watch?v=, youtu.be/, shorts/, embed/)
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i)
  if (watchMatch) {
    return { type: 'videoId', value: watchMatch[1] }
  }

  // 2. 단일 비디오 ID (11자리 영문/숫자/-/_ 이고 공백 없음)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: 'videoId', value: trimmed }
  }

  // 3. 채널 핸들 URL (youtube.com/@handle)
  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9._-]+)/i)
  if (handleUrlMatch) {
    return { type: 'handle', value: `@${handleUrlMatch[1]}` }
  }

  // 4. 채널 ID URL (youtube.com/channel/UCxxx)
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i)
  if (channelUrlMatch) {
    return { type: 'channelId', value: channelUrlMatch[1] }
  }

  // 5. 직접 핸들 입력 (@handle)
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed }
  }

  // 6. 채널 ID 직접 입력 (UC로 시작하는 24자)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: 'channelId', value: trimmed }
  }

  // 기타: 채널명 검색어로 처리
  return { type: 'query', value: trimmed }
}

export function parseIsoDuration(iso: string): { seconds: number; formatted: string } {
  if (!iso) return { seconds: 0, formatted: '0:00' }
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return { seconds: 0, formatted: '0:00' }

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  const totalSec = hours * 3600 + minutes * 60 + seconds

  let formatted = ''
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return { seconds: totalSec, formatted }
}

export async function fetchYouTubeChannel(
  identifier: { type: 'handle' | 'channelId' | 'query' | 'videoId'; value: string },
  apiKey: string
): Promise<YouTubeChannelInfo> {
  let channelId = ''

  if (identifier.type === 'videoId') {
    const vid = await fetchSingleVideo(identifier.value, apiKey)
    channelId = vid.channelId
  } else if (identifier.type === 'channelId') {
    channelId = identifier.value
  } else if (identifier.type === 'handle') {
    const handleWithoutAt = identifier.value.replace(/^@/, '')
    // 1차: forHandle 시도
    const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(
      handleWithoutAt
    )}&key=${apiKey}`
    const res = await fetch(handleUrl)
    const data = await res.json()

    if (data.items && data.items.length > 0) {
      return transformChannelItem(data.items[0])
    }

    // 2차: 검색으로 채널 찾기
    channelId = await searchChannelId(identifier.value, apiKey)
  } else {
    // query
    channelId = await searchChannelId(identifier.value, apiKey)
  }

  if (!channelId) {
    throw new Error(`채널을 찾을 수 없습니다: ${identifier.value}`)
  }

  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.error) {
    throw new Error(data.error.message || 'YouTube 채널 정보를 가져오는데 실패했습니다.')
  }
  if (!data.items || data.items.length === 0) {
    throw new Error('해당 채널을 찾을 수 없습니다.')
  }

  return transformChannelItem(data.items[0])
}

async function searchChannelId(query: string, apiKey: string): Promise<string> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
    query
  )}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    throw new Error(data.error.message || '채널 검색 중 오류가 발생했습니다.')
  }
  if (!data.items || data.items.length === 0) {
    throw new Error(`검색어에 일치하는 채널을 찾을 수 없습니다: ${query}`)
  }
  return data.items[0].snippet.channelId || data.items[0].id.channelId
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformChannelItem(item: any): YouTubeChannelInfo {
  const uploadsPlaylistId =
    item.contentDetails?.relatedPlaylists?.uploads ||
    (item.id.startsWith('UC') ? 'UU' + item.id.slice(2) : '')

  return {
    id: item.id,
    title: item.snippet?.title || '알 수 없는 채널',
    description: item.snippet?.description || '',
    customUrl: item.snippet?.customUrl || '',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnails: {
      default: item.snippet?.thumbnails?.default?.url || '',
      medium: item.snippet?.thumbnails?.medium?.url || '',
      high: item.snippet?.thumbnails?.high?.url || '',
    },
    statistics: {
      viewCount: Number(item.statistics?.viewCount || 0),
      subscriberCount: Number(item.statistics?.subscriberCount || 0),
      hiddenSubscriberCount: Boolean(item.statistics?.hiddenSubscriberCount),
      videoCount: Number(item.statistics?.videoCount || 0),
    },
    uploadsPlaylistId,
  }
}

export async function fetchChannelRecentVideos(
  uploadsPlaylistId: string,
  apiKey: string,
  maxResults = 12
): Promise<YouTubeVideoItem[]> {
  if (!uploadsPlaylistId) return []

  // 1. playlistItems 호출로 최근 비디오 ID 목록 획득 (1 quota unit)
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
  const playlistRes = await fetch(playlistUrl)
  const playlistData = await playlistRes.json()

  if (playlistData.error) {
    throw new Error(playlistData.error.message || '최근 영상 목록을 가져오지 못했습니다.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoIds = (playlistData.items || []).map((it: any) => it.contentDetails?.videoId).filter(Boolean)
  if (videoIds.length === 0) return []

  // 2. videos.list 호출로 상세 메타데이터 및 통계 일괄 조회 (1 quota unit)
  return fetchVideosByIds(videoIds, apiKey)
}

export async function fetchVideosByIds(videoIds: string[], apiKey: string): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return []

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(
    ','
  )}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.error) {
    throw new Error(data.error.message || '영상 상세 정보를 가져오는데 실패했습니다.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.items || []).map((item: any) => {
    const { seconds, formatted } = parseIsoDuration(item.contentDetails?.duration || '')
    const thumb =
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.standard?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url ||
      ''

    return {
      id: item.id,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || '',
      thumbnailUrl: thumb,
      durationSec: seconds,
      durationFormatted: formatted,
      viewCount: Number(item.statistics?.viewCount || 0),
      likeCount: Number(item.statistics?.likeCount || 0),
      commentCount: Number(item.statistics?.commentCount || 0),
      tags: Array.isArray(item.snippet?.tags) ? item.snippet.tags : [],
      channelId: item.snippet?.channelId || '',
      channelTitle: item.snippet?.channelTitle || '',
    }
  })
}

export async function fetchSingleVideo(videoId: string, apiKey: string): Promise<YouTubeVideoItem> {
  const videos = await fetchVideosByIds([videoId], apiKey)
  if (videos.length === 0) {
    throw new Error('영상을 찾을 수 없습니다.')
  }
  return videos[0]
}
