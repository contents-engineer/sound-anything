// app/api/lyrics-album/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateLyricsAlbumPackage } from '@/lib/lyrics-album/generator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { songs, targetMood, albumType, titleTrackIndex, subTitleTrackIndex } = body

    if (!Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json(
        { error: { message: '최소 1개 이상의 노래 가사를 입력해주세요.' } },
        { status: 400 }
      )
    }

    // 유효한 가사가 하나라도 있는지 확인
    const validSongs = songs.filter(
      (s: { lyrics?: string }) => typeof s?.lyrics === 'string' && s.lyrics.trim().length > 0
    )

    if (validSongs.length === 0) {
      return NextResponse.json(
        { error: { message: '가사 내용이 비어있습니다. 노래 가사를 입력해주세요.' } },
        { status: 400 }
      )
    }

    // API 키 확인: 요청 바디 > 헤더 > 환경변수
    const geminiApiKey =
      body.geminiApiKey ||
      req.headers.get('x-gemini-api-key') ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''

    const result = await generateLyricsAlbumPackage(
      validSongs,
      targetMood,
      albumType,
      typeof titleTrackIndex === 'number' ? titleTrackIndex : 0,
      typeof subTitleTrackIndex === 'number' ? subTitleTrackIndex : 1,
      geminiApiKey
    )

    return NextResponse.json({
      success: true,
      data: result,
      usedAi: Boolean(geminiApiKey),
    })
  } catch (error: unknown) {
    console.error('[lyrics-album API Error]:', error)
    const message = error instanceof Error ? error.message : '앨범 패키지 생성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: { message } }, { status: 500 })
  }
}
