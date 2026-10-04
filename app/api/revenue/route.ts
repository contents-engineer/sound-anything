// app/api/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  fetchChannelRecentVideos,
  fetchSingleVideo,
  fetchYouTubeChannel,
  parseYouTubeInput,
} from '@/lib/youtube/api'
import { calculateRevenue } from '@/lib/youtube/revenue'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, period = '30d' } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: { message: '채널 또는 영상 URL을 입력해주세요.' } },
        { status: 400 }
      )
    }

    const youtubeApiKey =
      body.youtubeApiKey ||
      req.headers.get('x-youtube-api-key') ||
      process.env.YOUTUBE_API_KEY ||
      ''

    if (!youtubeApiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_YOUTUBE_KEY',
            message: 'YouTube API 키가 필요합니다. 상단 또는 좌측 메뉴 API 연결에서 키를 등록해주세요.',
          },
        },
        { status: 400 }
      )
    }

    const parsed = parseYouTubeInput(input)
    let channel
    let singleVideo = undefined

    if (parsed.type === 'videoId') {
      singleVideo = await fetchSingleVideo(parsed.value, youtubeApiKey)
      channel = await fetchYouTubeChannel({ type: 'channelId', value: singleVideo.channelId }, youtubeApiKey)
    } else {
      channel = await fetchYouTubeChannel(parsed, youtubeApiKey)
    }

    const videos = await fetchChannelRecentVideos(channel.uploadsPlaylistId, youtubeApiKey, 15)

    const revenue = calculateRevenue(channel, videos, period, singleVideo)

    return NextResponse.json({
      success: true,
      channel,
      singleVideo,
      revenue,
    })
  } catch (error: unknown) {
    console.error('[revenue error]:', error)
    const message = error instanceof Error ? error.message : '수익 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
