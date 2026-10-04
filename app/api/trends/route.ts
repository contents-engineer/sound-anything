// app/api/trends/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchTrendingPlaylists } from '@/lib/youtube/trends'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country') || 'all'
    const genre = searchParams.get('genre') || 'all'
    const period = searchParams.get('period') || '7d'
    const sort = searchParams.get('sort') || 'viewCount'
    const query = searchParams.get('q') || ''

    const youtubeApiKey =
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

    const items = await fetchTrendingPlaylists({
      country,
      genre,
      period,
      sort,
      apiKey: youtubeApiKey,
      customQuery: query,
    })

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      filters: { country, genre, period, sort, query },
    })
  } catch (error: unknown) {
    console.error('[trends error]:', error)
    const message = error instanceof Error ? error.message : '트렌드 목록을 불러오는데 실패했습니다.'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
