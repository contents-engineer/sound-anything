// lib/lyrics-album/types.ts

export type AlbumType = 'single' | 'mini' | 'regular'

export interface InputSong {
  id: string
  title?: string
  lyrics: string
  isTitle?: boolean
  isSubTitle?: boolean
}

export interface ThumbnailColor {
  hex: string
  name: string
}

export interface ThumbnailConcept {
  visualSummary: string // 시각적 구도 및 피사체
  atmosphere: string // 분위기 및 조명
  colorPalette: ThumbnailColor[] // 추천 컬러 팔레트 (3~4개)
  recommendedCopy: string[] // 썸네일 삽입용 카피 문구 추천 (2~3개)
  aiImagePrompt: string // Midjourney / Imagen / Flux 영문 프롬프트
}

export interface TrackItem {
  trackNumber: number
  titleJa: string // 일본어 곡명
  titleKo: string // 한국어 곡명
  timestamp: string // 예: 00:00
  durationEstimate?: string // 예: 03:59
}

export interface YoutubeTitles {
  main: string // 가장 추천하는 메인 타이틀 (🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 ...)
  pattern1: string // 감성 소망/문장형 (🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 나에게도 기적이 일어나기를 | ...)
  pattern2: string // 퇴근길/상황 몰입형 (🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 퇴근길에 듣다 보면, ...)
  pattern3: string // 지친 하루 끝/위로형 (🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 지친 하루 끝, ...)
  alternatives: {
    style: string
    title: string
  }[]
}

export interface YoutubeDescription {
  introKo1: string // 그 시절 풋풋했던 짝사랑의 기억과... 🎧
  introKo2: string // 짝사랑에 진심이었던 그 시절...
  introEn: string // A sentimental J-POP playlist about...
  introJa: string // 切ない片想いの記憶や...
  tracklistFormatted: string // 00:00 일본어 / 한국어 형식
  hashtags: string // #jpopplaylist ...
  fullFormattedText: string // 원클릭 복사용 완성 텍스트
}

export interface PinnedComment {
  greeting: string // 오늘 하루도 정말 고생 많으셨습니다...
  recommendIntro: string // 이번 플레이리스트에서 개인적으로 꼽은 강추 트랙은 이렇습니다...
  recommendedTracks: string // 00:00 곡명 / 한국어곡명 리스트
  closingQuestion: string // 여러분이 꼽은 이번 최애곡은 몇 번인가요? 댓글로 편하게 남겨주세요 :)
  fullCommentText: string // 완성형 고정 댓글
}

export const FIXED_CREDITS = `[Production]
Executive Producer : Jaden Studio
Produced & Directed by : Jaden Kim
Coordinator : Jaden Kim

[Personnel]
Vocals : Sachiko Sakai
Acoustic Guitar : Kenta Sato
Electric Guitar : Takumi Watanabe
Bass : Ren Nakamura
Drums : Yuta Takahashi`

export interface LyricsAlbumResult {
  albumType: AlbumType
  albumTypeLabel: {
    ko: string // 싱글, 미니앨범, 앨범
    ja: string // シングル, ミニアルバム, アルバム
  }
  // 1. 앨범명
  albumTitle: {
    korean: string
    japanese: string
    english: string
    subtitle: string
  }
  // 2. 앨범 주제
  albumTheme: {
    coreConcept: string
    keywords: string[]
    genreMood: string
    narrativeArc: string
  }
  // 3. 앨범 설명글 (사용자 포맷)
  albumDescription: {
    japanese: string // 사용자 요청 일문 포맷
    korean: string // 국문 번역 버전
  }
  // 앨범 설명글 하단 고정 크레딧
  credits: string
  
  // 4. 유튜브 썸네일 아이디어
  thumbnailIdea: ThumbnailConcept

  // 5. 유튜브 타이틀 (사용자 포맷: 🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 ...)
  youtubeTitles: YoutubeTitles

  // 6. 유튜브 설명글 (사용자 포맷: 4단락 + Tracklist + 태그)
  youtubeDescription: YoutubeDescription

  // 7. 유튜브 고정 댓글 (사용자 포맷: 지친 발걸음 위로 + 강추 트랙 + 최애곡 질문)
  pinnedComment: PinnedComment

  generatedAt: string
}

export interface LyricsAlbumRequest {
  songs: { title?: string; lyrics: string; isTitle?: boolean; isSubTitle?: boolean }[]
  targetMood?: string
  albumType?: AlbumType
  titleTrackIndex?: number
  subTitleTrackIndex?: number
  geminiApiKey?: string
}
