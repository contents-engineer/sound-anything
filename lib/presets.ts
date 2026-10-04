// lib/presets.ts
import type { Selections } from '@/types'
import { INSTRUMENTAL_VOCAL_LABEL } from '@/lib/options'

export type QuickPreset = {
  id: string
  name: string
  emoji: string
  tagline: string
  description: string
  selections: Selections
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: 'cafe',
    name: '성수동 비 오는 카페',
    emoji: '☕',
    tagline: '재즈 & 시티팝 감성의 칠한 카페 BGM',
    description: '따뜻한 로즈 피아노와 감미로운 여성 보컬, 비 오는 날 통창 카페에 어울리는 감성 트랙',
    selections: {
      genre: '시티팝(City Pop)',
      era: '1980s 시티팝/버블',
      mood: ['잔잔한 (고요한)', '로맨틱 감성'],
      vocal: ['맑고 깨끗한 여성 보컬'],
      usage: '카페 분위기',
      instrument: ['그랜드 피아노', '색소폰', '어쿠스틱 기타'],
      production: '아날로그 따뜻함',
      bpm: '느림 (70-90 BPM)',
      age: '20대 (청춘)',
      form: '표준 (벌스 → 후렴)',
      language: '한국어',
      topic: ['비 오는 날', '첫사랑'],
      lengthMin: 3,
      customInputs: {},
    },
  },
  {
    id: 'coding',
    name: '새벽 2시 코딩 & 스터디',
    emoji: '🌧️',
    tagline: '집중력을 높여주는 빈티지 로파이 비트',
    description: '보컬 없이 테이프 질감과 앰비언트 사운드로 밤샘 코딩과 독서에 몰입하게 만드는 연주곡',
    selections: {
      genre: '로파이(Lo-fi)',
      era: '2020s 현대',
      mood: ['우울한 새벽', '순수한 평화'],
      vocal: [INSTRUMENTAL_VOCAL_LABEL],
      usage: '공부/집중력 향상',
      instrument: ['그랜드 피아노', '808 비트', '신디사이저'],
      production: '로파이 테이프',
      bpm: '느림 (70-90 BPM)',
      age: '20대 (청춘)',
      form: '표준 (벌스 → 후렴)',
      language: '한국어',
      topic: ['밤과 도시'],
      lengthMin: 4,
      customInputs: {},
    },
  },
  {
    id: 'drive',
    name: '심야 올림픽대로 드라이브',
    emoji: '🚗',
    tagline: '시원한 바람과 레트로 신스웨이브 비트',
    description: '강렬한 80년대 신디사이저와 듀엣 보컬로 야간 드라이브의 속도감을 만끽하는 곡',
    selections: {
      genre: '신스팝',
      era: '1980s 시티팝/버블',
      mood: ['강력한 드라이브', '시원한 바람'],
      vocal: ['남녀 듀엣'],
      usage: '유튜브 브이로그 BGM',
      instrument: ['신디사이저', '808 비트', '일렉 기타'],
      production: '깨끗한 현대 믹스',
      bpm: '약간 빠름 (110-130 BPM)',
      age: '20대 (청춘)',
      form: '후렴 선행 (90년대식)',
      language: '한국어+영어 섞어서',
      topic: ['밤과 도시', '용기'],
      lengthMin: 3,
      customInputs: {},
    },
  },
  {
    id: 'viral',
    name: '숏폼 챌린지 댄스 팝',
    emoji: '📱',
    tagline: '1초 만에 귀를 사로잡는 틱톡·쇼츠 바이럴 훅',
    description: '후렴 선행의 폭발적 에너지와 중독성 강한 K-Pop 비트로 숏폼 챌린지에 최적화된 트랙',
    selections: {
      genre: 'K-pop',
      era: '2020s 현대',
      mood: ['에너지 폭발', '도전적인'],
      vocal: ['맑고 깨끗한 여성 보컬', '랩 (여성)'],
      usage: '감성 쇼츠/틱톡',
      instrument: ['808 비트', '신디사이저', '베이스'],
      production: '깨끗한 현대 믹스',
      bpm: '빠름 (130-150 BPM)',
      age: '10대 (청소년)',
      form: '후렴 선행 (90년대식)',
      language: '한국어+영어 섞어서',
      topic: ['갓생', '자신감 회복'],
      lengthMin: 2,
      customInputs: {},
    },
  },
  {
    id: 'chill',
    name: '나른한 주말 오후 칠아웃',
    emoji: '🛋️',
    tagline: '햇살 가득한 거실에서 즐기는 포근한 R&B',
    description: '어쿠스틱 기타와 부드러운 R&B 보컬로 편안하게 릴랙스하는 위로의 음악',
    selections: {
      genre: 'R&B',
      era: '2020s 현대',
      mood: ['포근한 구름', '따스한 위로'],
      vocal: ['맑고 깨끗한 여성 보컬'],
      usage: '카페 분위기',
      instrument: ['어쿠스틱 기타', '그랜드 피아노', '베이스'],
      production: '아날로그 따뜻함',
      bpm: '보통 (90-110 BPM)',
      age: '20대 (청춘)',
      form: '표준 (벌스 → 후렴)',
      language: '한국어',
      topic: ['자기 사랑', '향수'],
      lengthMin: 3,
      customInputs: {},
    },
  },
  {
    id: 'rock',
    name: '2000s 청춘 밴드 사운드',
    emoji: '🎸',
    tagline: '푸른 여름날의 질주감, 에너지 넘치는 J-Rock',
    description: '드라이브감 넘치는 일렉 기타와 열정적인 남성 보컬로 청춘의 벅차오름을 표현한 곡',
    selections: {
      genre: 'J-록 (밴드 사운드)',
      era: '2000s J-pop',
      mood: ['도전적인', '에너지 폭발'],
      vocal: ['열정적인 남성 보컬'],
      usage: '유튜브 브이로그 BGM',
      instrument: ['일렉 기타', '드럼/퍼커션', '베이스'],
      production: '라이브 밴드 (원테이크)',
      bpm: '빠름 (130-150 BPM)',
      age: '20대 (청춘)',
      form: '표준 (벌스 → 후렴)',
      language: '일본어',
      topic: ['청춘·졸업', '용기'],
      lengthMin: 4,
      customInputs: {},
    },
  },
  {
    id: 'sleep',
    name: '깊은 숙면 & 명상 싱잉볼',
    emoji: '🧘',
    tagline: '뇌파를 안정시키는 초저속 앰비언트 사운드',
    description: '싱잉볼의 영롱한 울림과 부드러운 앰비언트 패드로 불면증과 불안을 씻어내는 명상 연주곡',
    selections: {
      genre: '명상/치유',
      era: '2020s 현대',
      mood: ['순수한 평화', '잔잔한 (고요한)'],
      vocal: [INSTRUMENTAL_VOCAL_LABEL],
      usage: '숙면/명상',
      instrument: ['싱잉볼', '신디사이저'],
      production: '깨끗한 현대 믹스',
      bpm: '초저속 (40-50 BPM)',
      age: '전 연령대',
      form: '점층형 (후렴 아끼기)',
      language: '한국어',
      topic: ['새벽 묵상'],
      lengthMin: 5,
      customInputs: {},
    },
  },
  {
    id: 'worship',
    name: '따스한 어쿠스틱 CCM',
    emoji: '✝️',
    tagline: '마음을 울리는 은혜로운 어쿠스틱 찬양',
    description: '어쿠스틱 기타와 피아노, 맑은 여성 보컬로 진솔한 고백과 평안을 담은 현대 워십 찬양',
    selections: {
      genre: 'CCM/찬양',
      era: '2020s 현대',
      mood: ['경건하고 은혜로운', '따스한 위로'],
      vocal: ['맑고 깨끗한 여성 보컬'],
      usage: '교회 예배/묵상',
      instrument: ['어쿠스틱 기타', '그랜드 피아노', '첼로'],
      production: '아날로그 따뜻함',
      bpm: '느림 (70-90 BPM)',
      age: '전 연령대',
      form: '표준 (벌스 → 후렴)',
      language: '한국어',
      topic: ['감사와 기도'],
      lengthMin: 4,
      customInputs: {},
    },
  },
]

/**
 * Suno의 Style Prompt 글자 수 제한(~120자)에 맞춰 핵심 앵커만 골든 태그로 압축
 */
export function getCondensedStylePrompt(stylePrompt: string): string {
  if (!stylePrompt) return ''
  const parts = stylePrompt.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 4 && stylePrompt.length <= 120) return stylePrompt

  // 핵심 앵커 우선 추출 (장르, 템포, 핵심악기, 보컬, 믹스)
  // 최대 4~5개 토큰만 남겨 110자 이내로 정제
  const selected: string[] = []
  let currentLen = 0

  for (const part of parts) {
    const addedLen = selected.length === 0 ? part.length : currentLen + 2 + part.length
    if (addedLen > 115) break
    selected.push(part)
    currentLen = addedLen
    if (selected.length >= 5) break
  }

  return selected.length > 0 ? selected.join(', ') : parts.slice(0, 4).join(', ')
}

export type PromptVariants = {
  radio: {
    label: string
    badge: string
    prompt: string
    description: string
  }
  acoustic: {
    label: string
    badge: string
    prompt: string
    description: string
  }
  spedUp: {
    label: string
    badge: string
    prompt: string
    description: string
  }
}

/**
 * 하나의 기본 Style Prompt로부터 라디오 메인 / 어쿠스틱 언플러그드 / 스피드업 댄스 3단 변형 도출
 */
export function getPromptVariants(basePrompt: string): PromptVariants {
  const parts = (basePrompt || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const mainGenre = parts[0] || 'Pop'

  // 1. Radio (기본 메인)
  const radioPrompt = basePrompt

  // 2. Acoustic Session
  // 전자악기, 808, 신스 등을 배제하고 어쿠스틱 악기와 친밀한 보컬로 치환
  const acousticTokens = [
    `Acoustic ${mainGenre.replace(/synth|electronic|dance|edm/gi, '').trim() || 'Indie'}`,
    'acoustic guitar and gentle upright piano',
    'intimate breathy vocals',
    'minimal acoustic percussion',
    'warm organic room mix',
    'wistful',
  ]
  const acousticPrompt = acousticTokens.join(', ')

  // 3. Sped Up / Dance Club Remix
  // 템포 업, 808/댄스 킥, 에너지 폭발
  const spedUpTokens = [
    `Sped up ${mainGenre}`,
    'fast 135-145 BPM',
    'punchy 808 bass and dance kick',
    'catchy vocal chops',
    'explosive drop',
    'high energy viral mix',
  ]
  const spedUpPrompt = spedUpTokens.join(', ')

  return {
    radio: {
      label: '📻 Radio Main',
      badge: '정석 음원',
      prompt: radioPrompt,
      description: '보컬과 풀 세션이 어우러진 완성형 라디오 타이틀 트랙',
    },
    acoustic: {
      label: '🌙 Acoustic Session',
      badge: '새벽 언플러그드',
      prompt: acousticPrompt,
      description: '어쿠스틱 기타와 피아노로 여백의 미를 살린 감성 심야 세션',
    },
    spedUp: {
      label: '⚡ Sped Up Remix',
      badge: '쇼츠/바이럴',
      prompt: spedUpPrompt,
      description: 'BPM과 타격감을 높여 틱톡/릴스 숏폼 챌린지에 최적화된 댄스 비트',
    },
  }
}

/**
 * 트렌드 영상 제목/키워드 또는 채널명으로부터 어울리는 Selections 생성
 */
export function mapTrendToSelections(title: string, tags: string[] = []): Selections {
  const text = `${title} ${tags.join(' ')}`.toLowerCase()

  // 1. 로파이/공부/새벽/집중
  if (text.includes('lofi') || text.includes('lo-fi') || text.includes('로파이') || text.includes('공부') || text.includes('study') || text.includes('코딩')) {
    const base = QUICK_PRESETS.find((p) => p.id === 'coding')!.selections
    return {
      ...base,
      customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
    }
  }

  // 2. 카페/재즈/비
  if (text.includes('카페') || text.includes('cafe') || text.includes('재즈') || text.includes('jazz') || text.includes('비오는') || text.includes('rain')) {
    const base = QUICK_PRESETS.find((p) => p.id === 'cafe')!.selections
    return {
      ...base,
      customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
    }
  }

  // 3. 드라이브/신스/밤/시티팝
  if (text.includes('드라이브') || text.includes('drive') || text.includes('시티팝') || text.includes('city pop') || text.includes('밤')) {
    const base = QUICK_PRESETS.find((p) => p.id === 'drive')!.selections
    return {
      ...base,
      customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
    }
  }

  // 4. 수면/명상/힐링/자장가
  if (text.includes('수면') || text.includes('sleep') || text.includes('명상') || text.includes('힐링') || text.includes('치유') || text.includes('자장가')) {
    const base = QUICK_PRESETS.find((p) => p.id === 'sleep')!.selections
    return {
      ...base,
      customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
    }
  }

  // 5. 밴드/락/청춘
  if (text.includes('밴드') || text.includes('rock') || text.includes('록') || text.includes('band') || text.includes('청춘') || text.includes('여름')) {
    const base = QUICK_PRESETS.find((p) => p.id === 'rock')!.selections
    return {
      ...base,
      customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
    }
  }

  // 6. 기본 칠아웃 R&B
  const base = QUICK_PRESETS.find((p) => p.id === 'chill')!.selections
  return {
    ...base,
    customInputs: { ...base.customInputs, topic: title.slice(0, 30) },
  }
}
