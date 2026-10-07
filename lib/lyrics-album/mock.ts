// lib/lyrics-album/mock.ts
import { AlbumType, FIXED_CREDITS, LyricsAlbumResult } from './types'

export function getAlbumTypeLabels(albumType: AlbumType = 'mini') {
  switch (albumType) {
    case 'single':
      return { ko: '싱글', ja: 'シングル' }
    case 'regular':
      return { ko: '정규 앨범', ja: 'アルバム' }
    case 'mini':
    default:
      return { ko: '미니앨범', ja: 'ミニアルバム' }
  }
}

export function generateMockLyricsAlbum(
  songs: { title?: string; lyrics: string; isTitle?: boolean; isSubTitle?: boolean }[],
  targetMood?: string,
  albumType: AlbumType = 'mini',
  titleTrackIndex: number = 0,
  subTitleTrackIndex: number = 1
): LyricsAlbumResult {
  const labels = getAlbumTypeLabels(albumType)

  const explicitTitleIdx = songs.findIndex((s) => s.isTitle)
  const explicitSubIdx = songs.findIndex((s) => s.isSubTitle)

  const effectiveTitleIdx = explicitTitleIdx >= 0 ? explicitTitleIdx : Math.max(0, Math.min(songs.length - 1, titleTrackIndex))
  let effectiveSubIdx = explicitSubIdx >= 0 ? explicitSubIdx : subTitleTrackIndex
  if (effectiveSubIdx === effectiveTitleIdx) {
    effectiveSubIdx = (effectiveTitleIdx + 1) % Math.max(1, songs.length)
  }

  const defaultTracks = [
    { ko: '너와 머물던 계절의 바람', ja: '君といた季節の風' },
    { ko: '소다수의 거짓말', ja: 'ソーダ水の嘘' },
    { ko: '차가운 불꽃놀이', ja: '冷たい花火' },
  ]

  const mappedSongs = songs.map((s, idx) => {
    const defaultItem = defaultTracks[idx % defaultTracks.length]
    const rawTitle = s.title?.trim() || defaultItem.ko
    const match = rawTitle.match(/^(.*?)\s*\((.*?)\)$/)
    const ko = match ? match[1].trim() : rawTitle
    const ja = match ? match[2].trim() : defaultItem.ja
    return { ko, ja }
  })

  while (mappedSongs.length < 3) {
    const idx = mappedSongs.length
    mappedSongs.push(defaultTracks[idx % defaultTracks.length])
  }

  const titleTrack = mappedSongs[effectiveTitleIdx] || mappedSongs[0]
  const subTitleTrack = mappedSongs[effectiveSubIdx] || mappedSongs[1]
  const otherTracks = mappedSongs.filter((_, idx) => idx !== effectiveTitleIdx && idx !== effectiveSubIdx)
  const lastTrack = otherTracks[0] || mappedSongs[2] || mappedSongs[0]

  const titleKo = '빛나기 위한 흐린 하늘'
  const titleJa = '輝くための曇り空'
  const titleEn = 'Cloudy Day to Shine'
  const subtitle = '서툰 걸음과 헤매던 시간조차 나를 완성해가는 소중한 여정이었음을'

  const albumDescJa = `「つまずき、迷い込んだ時間さえも、私を形づくるための旅路だった。」

${labels.ja}『${titleJa} (${titleEn})』は、他人の基準や周りの騒音の中で自分を見失いそうになった一人の人間が、自分だけのリズムと固有の光に出逢うまでの時間を繊細に紡ぎ出した作品です。

世間が求める「普通」に合わせようとして傷ついた心を自ら優しく抱きしめ、曇り空の下でこぼした涙や挫折の日々さえも、再び立ち上がるために欠かせない大切な歩みであったことを歌います。孤独に佇む暗い夜を越え、君の手をそっと握りしめて朝の光の中へと一歩を踏み出すまで、このアルバムは痛みを否定するのではなく、温かく包み込むような成熟した癒しを届けます。

タイトル曲「${titleTrack.ja} (${titleTrack.ko})」が伝えるありのままの自己肯定から、希望の足音を響かせるサブタイトル曲「${subTitleTrack.ja} (${subTitleTrack.ko})」、そして一日の終わりに聴く人の心へそっと寄り添う「${lastTrack.ja} (${lastTrack.ko})」まで。

本作は、不安を抱えながら今日を生きるすべての人へ「焦らなくても大丈夫」という安らぎの休息を贈り、いつか眩しく輝く“あなただけの色”を照らす優しいエールとなるはずです。`

  const albumDescKo = `「넘어지고 방황했던 시간조차, 나를 빚어내기 위한 여정이었다.」

${labels.ko} 『${titleKo} (${titleEn})』는 타인의 기준과 주변의 소음 속에서 자신을 잃어버릴 뻔했던 한 사람이, 자신만의 호흡과 고유한 빛을 만나기까지의 시간을 섬세하게 엮어낸 작품입니다.

세상이 요구하는 '보통'에 맞추려다 상처받은 마음을 스스로 다정하게 안아주고, 흐린 하늘 아래서 흘렸던 눈물과 좌절의 날들조차 다시 일어서기 위해 꼭 필요했던 소중한 발걸음이었음을 노래합니다. 외로이 머물던 어두운 밤을 지나, 너의 손을 가만히 쥐고 아침의 빛 속으로 한 걸음 내딛기까지— 이 앨범은 아픔을 부정하는 대신 온기로 감싸 안아주는 성숙한 위로를 전합니다.

타이틀곡 「${titleTrack.ko} (${titleTrack.ja})」가 전하는 있는 그대로의 긍정에서부터, 희망의 발소리를 울리는 서브 타이틀곡 「${subTitleTrack.ko} (${subTitleTrack.ja})」、그리고 하루의 끝자락에서 리스너의 마음에 조용히 깃드는 「${lastTrack.ko} (${lastTrack.ja})」까지.

본 작은 불안을 품은 채 오늘을 살아가는 모든 이들에게 "서두르지 않아도 괜찮아"라는 편안한 쉼을 선물하며, 언젠가 눈부시게 피어날 '당신만의 색'을 비추는 다정한 응원이 될 것입니다.`

  const tracklistText = mappedSongs
    .map((s, i) => {
      const time = i === 0 ? '00:00' : i === 1 ? '03:59' : i === 2 ? '08:03' : `1${i}:20`
      return `${time} ${s.ja} / ${s.ko}`
    })
    .join('\n')

  // 5. 유튜브 타이틀 (사용자 포맷)
  const pattern1 = '🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 나에게도 기적이 일어나기를 | 감성 JPOP 밴드 노래 모음'
  const pattern2 = '🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 퇴근길에 듣다 보면, 나에게도 기적이 일어날 것 같은 JPOP 플레이리스트'
  const pattern3 = '🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 지친 하루 끝, 기적처럼 마음이 벅차오르는 | JPOP 플레이리스트'

  // 6. 유튜브 설명글 (사용자 포맷)
  const introKo1 = '그 시절 풋풋했던 짝사랑의 기억과 아련한 감성을 떠올리게 하는 감성 J-POP 밴드 모음입니다. 가만히 이어폰을 꽂고 그 시절의 나로 돌아가 보세요. 🎧'
  const introKo2 = '짝사랑에 진심이었던 그 시절, 가슴 한구석을 아리게 만들었던 감성적인 일본 노래 플레이리스트입니다. 서투르고 애틋했던 감정을 위로해 줄 곡들로 채웠습니다. 공부할 때나 조용한 밤에 감성에 젖어 가볍게 듣기 좋은 플레이리스트로 추천합니다.'
  const introEn = 'A sentimental J-POP playlist about unrequited love and school days. Enjoy emotional Japanese band music and nostalgic Japanese songs.'
  const introJa = '切ない片想いの記憶や、あの頃の感情に浸れるエモーショナルな日本のバンド・J-POPプレイリストです。作業用BGMや夜の散歩道に。'
  const hashtags = '#jpopplaylist #일본노래 #제이팝 #jpop #jrock #제이팝플리 #제이팝플레이리스트 #jpop플레이리스트 #일본노래모음 #邦楽 #playlist #プレイリスト #作業用bgm'

  const fullDescriptionText = `${introKo1}

${introKo2}

${introEn}

${introJa}

[Tracklist]
${tracklistText}

${hashtags}`

  // 7. 유튜브 고정 댓글 (사용자 포맷)
  const pinnedGreeting = '오늘 하루도 정말 고생 많으셨습니다. 지친 발걸음에 조금이나마 위로가 되었으면 좋겠네요!'
  const pinnedIntro = '이번 플레이리스트에서 개인적으로 꼽은 강추 트랙은 이렇습니다. 꼭 한번 귀 기울여 들어보세요!'
  const pinnedClosing = '여러분이 꼽은 이번 최애곡은 몇 번인가요? 댓글로 편하게 남겨주세요 :)'

  const fullPinnedComment = `${pinnedGreeting}

${pinnedIntro}

${tracklistText}

${pinnedClosing}`

  return {
    albumType,
    albumTypeLabel: labels,
    albumTitle: {
      korean: titleKo,
      japanese: titleJa,
      english: titleEn,
      subtitle,
    },
    albumTheme: {
      coreConcept: '흐린 날의 방황과 서투른 상처를 감싸 안고, 나만의 빛을 향해 조용히 나아가는 성장과 회복의 서사',
      keywords: ['J-POP 밴드', '기적', '청춘과 짝사랑', '감성 위로', '퇴근길'],
      genreMood: 'Emotional J-Rock & Melodic J-POP Band (BPM 88-120의 청량한 일렉 기타와 서정적인 멜로디 라인)',
      narrativeArc: '마음속 짙은 혼란과 자기 의심에서 출발하여, 서투른 고백과 눈물의 과정을 지나, 끝내 스스로의 존재를 인정하고 빛을 마주하는 기승전결',
    },
    albumDescription: {
      japanese: albumDescJa,
      korean: albumDescKo,
    },
    credits: FIXED_CREDITS,
    thumbnailIdea: {
      visualSummary: '방과 후 노을빛이 길게 드리운 교실 창가에 홀로 서서 먼 하늘을 바라보는 학생의 옆모습, 바람에 가볍게 흩날리는 커튼과 머리칼',
      atmosphere: '황혼의 오렌지빛과 푸른 하늘이 겹쳐지는 감성적인 매직아워, 아련한 필름 그레인과 역광 실루엣',
      colorPalette: [
        { hex: '#E65100', name: '선셋 앰버' },
        { hex: '#1A237E', name: '트와일라잇 인디고' },
        { hex: '#FFF3E0', name: '소프트 크림' },
        { hex: '#5C6BC0', name: '라벤더 스카이' },
      ],
      recommendedCopy: [
        '나에게도 기적이 일어나기를',
        '퇴근길에 듣는 벅차오르는 J-POP',
        '그 시절 서툴렀던 우리에게',
      ],
      aiImagePrompt:
        'Anime aesthetic illustration, makoto shinkai style, high school student standing by the classroom window during sunset golden hour, breeze blowing through white sheer curtains, emotional nostalgic atmosphere, soft rim lighting, ultra detailed 8k --ar 16:9',
    },
    youtubeTitles: {
      main: pattern1,
      pattern1,
      pattern2,
      pattern3,
      alternatives: [
        { style: '청춘/회상형', title: '🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 서툴렀던 그 시절, 가만히 이어폰을 꽂고 걷던 길' },
        { style: '작업/몰입형', title: '🎧𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 공부할 때나 조용한 밤에 감성에 젖어 듣는 JPOP' },
      ],
    },
    youtubeDescription: {
      introKo1,
      introKo2,
      introEn,
      introJa,
      tracklistFormatted: tracklistText,
      hashtags,
      fullFormattedText: fullDescriptionText,
    },
    pinnedComment: {
      greeting: pinnedGreeting,
      recommendIntro: pinnedIntro,
      recommendedTracks: tracklistText,
      closingQuestion: pinnedClosing,
      fullCommentText: fullPinnedComment,
    },
    generatedAt: new Date().toISOString(),
  }
}
