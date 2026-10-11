// lib/lyrics-album/generator.ts
import { GoogleGenAI, Type } from '@google/genai'
import { AlbumType, FIXED_CREDITS, LyricsAlbumResult } from './types'
import { generateMockLyricsAlbum, getAlbumTypeLabels } from './mock'

const LYRICS_ALBUM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    albumTitle: {
      type: Type.OBJECT,
      properties: {
        korean: { type: Type.STRING },
        japanese: { type: Type.STRING },
        english: { type: Type.STRING },
        subtitle: { type: Type.STRING },
      },
      required: ['korean', 'japanese', 'english', 'subtitle'],
    },
    albumTheme: {
      type: Type.OBJECT,
      properties: {
        coreConcept: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        genreMood: { type: Type.STRING },
        narrativeArc: { type: Type.STRING },
      },
      required: ['coreConcept', 'keywords', 'genreMood', 'narrativeArc'],
    },
    albumDescription: {
      type: Type.OBJECT,
      properties: {
        japanese: { type: Type.STRING },
        korean: { type: Type.STRING },
      },
      required: ['japanese', 'korean'],
    },
    thumbnailIdea: {
      type: Type.OBJECT,
      properties: {
        visualSummary: { type: Type.STRING },
        atmosphere: { type: Type.STRING },
        colorPalette: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hex: { type: Type.STRING },
              name: { type: Type.STRING },
            },
            required: ['hex', 'name'],
          },
        },
        recommendedCopy: { type: Type.ARRAY, items: { type: Type.STRING } },
        aiImagePrompt: { type: Type.STRING },
      },
      required: ['visualSummary', 'atmosphere', 'colorPalette', 'recommendedCopy', 'aiImagePrompt'],
    },
    youtubeTitles: {
      type: Type.OBJECT,
      properties: {
        main: { type: Type.STRING },
        pattern1: { type: Type.STRING },
        pattern2: { type: Type.STRING },
        pattern3: { type: Type.STRING },
        alternatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              title: { type: Type.STRING },
            },
            required: ['style', 'title'],
          },
        },
      },
      required: ['main', 'pattern1', 'pattern2', 'pattern3', 'alternatives'],
    },
    youtubeDescription: {
      type: Type.OBJECT,
      properties: {
        introKo1: { type: Type.STRING },
        introKo2: { type: Type.STRING },
        introEn: { type: Type.STRING },
        introJa: { type: Type.STRING },
        tracklistFormatted: { type: Type.STRING },
        hashtags: { type: Type.STRING },
        fullFormattedText: { type: Type.STRING },
      },
      required: [
        'introKo1',
        'introKo2',
        'introEn',
        'introJa',
        'tracklistFormatted',
        'hashtags',
        'fullFormattedText',
      ],
    },
    pinnedComment: {
      type: Type.OBJECT,
      properties: {
        greeting: { type: Type.STRING },
        recommendIntro: { type: Type.STRING },
        recommendedTracks: { type: Type.STRING },
        closingQuestion: { type: Type.STRING },
        fullCommentText: { type: Type.STRING },
      },
      required: ['greeting', 'recommendIntro', 'recommendedTracks', 'closingQuestion', 'fullCommentText'],
    },
  },
  required: [
    'albumTitle',
    'albumTheme',
    'albumDescription',
    'thumbnailIdea',
    'youtubeTitles',
    'youtubeDescription',
    'pinnedComment',
  ],
}

export async function generateLyricsAlbumPackage(
  songs: { title?: string; lyrics: string; isTitle?: boolean; isSubTitle?: boolean }[],
  targetMood?: string,
  albumType: AlbumType = 'mini',
  titleTrackIndex: number = 0,
  subTitleTrackIndex: number = 1,
  apiKey?: string
): Promise<LyricsAlbumResult> {
  const effectiveKey = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const labels = getAlbumTypeLabels(albumType)

  const explicitTitleIdx = songs.findIndex((s) => s.isTitle)
  const explicitSubIdx = songs.findIndex((s) => s.isSubTitle)
  const effTitleIdx = explicitTitleIdx >= 0 ? explicitTitleIdx : Math.max(0, Math.min(songs.length - 1, titleTrackIndex))
  let effSubIdx = explicitSubIdx >= 0 ? explicitSubIdx : subTitleTrackIndex
  if (effSubIdx === effTitleIdx) effSubIdx = (effTitleIdx + 1) % Math.max(1, songs.length)

  const titleTrackSong = songs[effTitleIdx]?.title?.trim() || `트랙 0${effTitleIdx + 1}`
  const subTitleTrackSong = songs[effSubIdx]?.title?.trim() || `트랙 0${effSubIdx + 1}`

  if (!effectiveKey) {
    return generateMockLyricsAlbum(songs, targetMood, albumType, effTitleIdx, effSubIdx)
  }

  const ai = new GoogleGenAI({ apiKey: effectiveKey })

  const formattedSongs = songs
    .map((s, index) => {
      const title = s.title?.trim() || `곡 ${index + 1}`
      const roleTag = index === effTitleIdx ? ' [사용자 지정 메인 타이틀곡]' : index === effSubIdx ? ' [사용자 지정 서브 타이틀곡]' : ''
      return `[트랙 ${index + 1}: ${title}${roleTag}]\n${s.lyrics.trim()}\n`
    })
    .join('\n───────────────────────\n')

  const moodLower = (targetMood || '').toLowerCase()
  const isKpop =
    moodLower.includes('k-pop') ||
    moodLower.includes('kpop') ||
    moodLower.includes('리센느') ||
    moodLower.includes('rescene') ||
    moodLower.includes('아이돌') ||
    moodLower.includes('걸그룹')

  const prompt = `당신은 최고 수준의 글로벌 ${isKpop ? 'K-POP & 감성' : 'J-POP/인디'} 플레이리스트 채널 디렉터이자 음악 프로듀서(A&R)입니다.
아래에 제공된 ${songs.length}곡의 노래 가사들을 깊이 있게 분석하고, 사용자가 지정한 '규격 포맷 양식'에 맞춰 가사 맞춤형 앨범 및 유튜브 패키지를 완성해주세요.

선택된 앨범 구분: ${labels.ko} (${labels.ja} / ${albumType})
${targetMood ? `[사용자 지정 목표 분위기]: ${targetMood}\n` : ''}
[★ 사용자가 직접 지정한 타이틀곡 역할]:
- 메인 타이틀곡: 트랙 ${effTitleIdx + 1} (${titleTrackSong}) ➔ 앨범 설명글의 タイトル曲「...」에 반드시 이 곡을 넣으세요.
- 서브 타이틀곡: 트랙 ${effSubIdx + 1} (${subTitleTrackSong}) ➔ 앨범 설명글의 サブタイトル曲「...」에 반드시 이 곡을 넣으세요.

[제공된 노래 가사]:
${formattedSongs}

══════════════════════════════════════════════════
[사용자 지정 출력 포맷 규칙 — 반드시 준수할 것]
══════════════════════════════════════════════════

1. 앨범명 (albumTitle):
   - korean: 가사 전체의 서사를 담은 한국어 앨범명
   - japanese: 가사 감성에 최적화된 일본어 앨범명
   - english: 세련된 영문 앨범명
   - subtitle: 한 줄 부제/캐치프레이즈

2. 앨범 주제 (albumTheme):
   - coreConcept: 핵심 감정선 요약
   - keywords: 키워드 5개 (예: ${isKpop ? 'K-POP, 리센느, 딥하우스, 향기, 잔향' : 'JPOP, 짝사랑, 청춘, 퇴근길, 기적'} 등)
   - genreMood: 음악 장르 및 템포 (예: ${isKpop ? 'K-Pop Deep House & 2-Step Garage, BPM 125-130' : 'Emotional J-Rock & Melodic J-POP Band, BPM 90-120'})
   - narrativeArc: 가사들이 엮어내는 기승전결 서사

3. 앨범 설명글 (albumDescription):
   반드시 다음 5개 단락 구조를 지키고, ${labels.ja}(${labels.ko}) 구분을 반드시 반영하세요.
   [일본어(japanese) 포맷]:
   「[가사 관통 인용구]」

   ${labels.ja}『[일본어 앨범명] ([영문 앨범명])』は、他人の基準や周りの騒音の中で自分を見失いそうになった一人の人間が、自分だけのリズムと固有の光に出逢うまでの時間を繊細に紡ぎ出した作品です。(※가사 내용에 맞게 커스텀)

   [가사 속 상처/방황/눈물/아픔과 이를 감싸 안는 위로의 문단]

   タイトル曲「[타이틀곡 일본어명] ([영문 또는 한국어명])」が伝える[메시지]から、希望の足音を響かせるサブタイトル曲「[서브곡 일본어명] ([영문/한글])」、そして一日の終わりに聴く人の心へそっと寄り添う「[마지막곡]」まで。

   本作は、不安を抱えながら今日を生きるすべての人へ「焦らなくても大丈夫」という安らぎの休息を贈り、いつか眩しく輝く“あなただけの色”を照らす優しいエールとなるはずです。(※가사에 맞춰 커스텀)

   [한국어(korean) 포맷]:
   위 일본어 설명글과 동일한 완성도의 자연스럽고 유려한 한국어 번역문.

4. 유튜브 타이틀 (youtubeTitles):
   반드시 접두사 "🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 " (유니코드 Bold 서체)를 앞에 붙여야 합니다.
   - pattern1: ${isKpop ? '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 [가사 핵심 감각/향기 문구] | 리센느 느낌 몽환 딥하우스 & 2-Step K-POP 플레이리스트"' : '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 [가사 핵심 소망/위로 문구] | 감성 JPOP 밴드 노래 모음"'} 형태
   - pattern2: ${isKpop ? '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 [상황(예: 늦은 밤 드라이브할 때)], [감각 변화(예: 귓가에 번지는 은은한 잔향)] 리센느 감성 플리"' : '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 [상황(예: 퇴근길에 듣다 보면)], [감정 변화(예: 나에게도 기적이 일어날 것 같은)] JPOP 플레이리스트"'} 형태
   - pattern3: ${isKpop ? '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 몽환적인 밤, [벅차오르는 비트와 향기] | K-POP 딥하우스 믹스"' : '"🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 지친 하루 끝, [벅차오르는 감정] | JPOP 플레이리스트"'} 형태
   - main: 위 3개 중 가장 추천하는 대표 타이틀
   - alternatives: 추가 대체 타이틀 2~3개

5. 유튜브 설명글 (youtubeDescription):
   다음 문단 구성을 정확히 따를 것:
   단락1: ${isKpop ? '[가사 무드 및 향기/감각 소개]. 가만히 이어폰을 꽂고 향기처럼 퍼지는 비트에 빠져보세요. 🫧' : '[가사 무드 감성 소개]. 가만히 이어폰을 꽂고 그 시절의 나로 돌아가 보세요. 🎧'}
   단락2: ${isKpop ? '[가사 스토리 및 사운드(딥하우스, 2-Step) 묘사]. 리센느(RESCENE)에게 선물하고 싶은 음악이자, 은은한 잔향과 탄산 기포처럼 터지는 감각을 담았습니다. 드라이브할 때나 밤에 작업할 때 듣기 좋은 플레이리스트입니다.' : '[가사 스토리 상세 묘사]. [서투르고 애틋했던 감정]을 위로해 줄 곡들로 채웠습니다. 공부할 때나 조용한 밤에 감성에 젖어 가볍게 듣기 좋은 플레이리스트로 추천합니다.'}
   단락3: ${isKpop ? 'A dreamy K-Pop Deep House & 2-Step Garage playlist inspired by RESCENE vibes and scent memories. Enjoy ethereal vocals, bubbling basslines, and lingering afterglow.' : 'A sentimental J-POP playlist about [가사 테마/영문]. Enjoy emotional Japanese band music and nostalgic Japanese songs.'}
   단락4: ${isKpop ? '香りのように広がる幻想的なK-POPディープハウス＆2ステップ・ガレージ。心地よいビートと余韻に浸れるプレイリストです。ドライブや作業用BGMに。' : '切ない[테마]の記憶や、あの頃の感情に浸れるエモーショナルな日本のバンド・J-POPプレイリストです。作業用BGMや夜の散歩道に。'}
   [Tracklist]
   00:00 [트랙1 일본어명] / [트랙1 한국어명]
   03:50 [트랙2 일본어명] / [트랙2 한국어명]
   07:45 [트랙3 일본어명] / [트랙3 한국어명]
   (해시태그): ${isKpop ? '#kpop #kpopplaylist #리센느 #rescene #리센느낌 #케이팝플레이리스트 #deephouse #2stepgarage #케이팝플리 #몽환플리 #드라이브플리 #작업용bgm' : '#jpopplaylist #일본노래 #제이팝 #jpop #jrock #제이팝플리 #제이팝플레이리스트 #jpop플레이리스트 #일본노래모음 #邦楽 #playlist #プレイリスト #作業用bgm'}
   fullFormattedText에는 위 모든 요소가 개행과 함께 조합된 완성형 설명란 텍스트를 출력하세요.

6. 유튜브 고정 댓글 (pinnedComment):
   다음 양식을 반드시 준수할 것:
   오늘 하루도 정말 고생 많으셨습니다. 지친 발걸음에 조금이나마 위로가 되었으면 좋겠네요!

   이번 플레이리스트에서 개인적으로 꼽은 강추 트랙은 이렇습니다. 꼭 한번 귀 기울여 들어보세요!

   00:00 [트랙1 일본어명] / [트랙1 한국어명]
   03:50 [트랙2 일본어명] / [트랙2 한국어명]
   07:45 [트랙3 일본어명] / [트랙3 한국어명]

   여러분이 꼽은 이번 최애곡은 몇 번인가요? 댓글로 편하게 남겨주세요 :)

7. 유튜브 썸네일 아이디어 (thumbnailIdea):
   - visualSummary: 피사체와 구도 (예: 방과 후 노을빛 교실 창가)
   - atmosphere: 조명, 색감 무드
   - colorPalette: 어울리는 색상 4개 (hex, name)
   - recommendedCopy: 썸네일 추천 카피 문구 3개
   - aiImagePrompt: Midjourney / Imagen 16:9 영문 프롬프트`

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  try {
    const resp = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: LYRICS_ALBUM_SCHEMA,
      },
    })

    const text = resp.text || ''
    const parsed = JSON.parse(text)

    return {
      albumType,
      albumTypeLabel: labels,
      ...parsed,
      credits: FIXED_CREDITS,
      generatedAt: new Date().toISOString(),
    }
  } catch (error: unknown) {
    console.warn(`[lyrics-album] Gemini generation failed with model ${modelName}:`, error)
    return generateMockLyricsAlbum(songs, targetMood, albumType)
  }
}
