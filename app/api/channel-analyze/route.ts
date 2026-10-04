// app/api/channel-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  fetchChannelRecentVideos,
  fetchSingleVideo,
  fetchYouTubeChannel,
  parseYouTubeInput,
} from '@/lib/youtube/api'
import { auditChannelWithGemini, SelfAuditInput } from '@/lib/youtube/audit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, selfAudit } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: { message: '채널 또는 영상 URL을 입력해주세요.' } }, { status: 400 })
    }

    // API 키 확인: 요청 바디/헤더 우선, 없으면 .env.local
    const youtubeApiKey =
      body.youtubeApiKey ||
      req.headers.get('x-youtube-api-key') ||
      process.env.YOUTUBE_API_KEY ||
      ''

    const geminiApiKey =
      body.geminiApiKey ||
      req.headers.get('x-gemini-api-key') ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
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

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_GEMINI_KEY',
            message: 'Gemini API 키가 필요합니다. 상단 또는 좌측 메뉴 API 연결에서 키를 등록해주세요.',
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

    // 채널의 최근 업로드 영상들 가져오기
    const videos = await fetchChannelRecentVideos(channel.uploadsPlaylistId, youtubeApiKey, 15)

    // 만약 단일 영상으로 조회했는데 영상 리스트에 없으면 맨 앞에 추가
    if (singleVideo && !videos.some((v) => v.id === singleVideo.id)) {
      videos.unshift(singleVideo)
    }

    const defaultSelfAudit: SelfAuditInput = {
      contentIdDispute: selfAudit?.contentIdDispute || 'none',
      sunoLicense: selfAudit?.sunoLicense || 'commercial_paid',
      licenseNotice: selfAudit?.licenseNotice || 'explicit',
    }

    // Gemini로 5대 정책 영역 정밀 채점
    const auditResult = await auditChannelWithGemini(
      channel,
      videos,
      defaultSelfAudit,
      geminiApiKey
    )

    return NextResponse.json({
      success: true,
      channel,
      singleVideo,
      videos,
      auditResult,
    })
  } catch (error: unknown) {
    console.error('[channel-analyze error]:', error)
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
