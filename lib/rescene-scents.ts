// lib/rescene-scents.ts
/**
 * 조향학(Olfactory Science) 및 프루스트 효과(Proust Effect) 기반
 * 리센느(RESCENE) 차기 콘셉트 제안을 위한 신규 시그니처 향기 및 조향 아틀리에 데이터
 */

export interface ScentNoteItem {
  id: string
  nameKo: string
  nameEn: string
  category: 'top' | 'middle' | 'base'
  family: 'citrus' | 'floral' | 'fruity' | 'woody' | 'tea' | 'green' | 'marine' | 'musk' | 'gourmand'
  emoji: string
  character: string // 감각적 묘사
  musicalMapping: string // 음악적 대응 (비트/질감)
}

// 1. 조향 피라미드 개별 원료 라이브러리
export const TOP_NOTES: ScentNoteItem[] = [
  {
    id: 'top-bergamot',
    nameKo: '스파클링 베르가못',
    nameEn: 'Sparkling Bergamot',
    category: 'top',
    family: 'citrus',
    emoji: '🍋',
    character: '햇살 아래 톡 터지는 싱그러운 시트러스 껍질의 청량함',
    musicalMapping: '반짝이는 아르페지오 신스 플럭, 128 BPM 인트로의 설렘',
  },
  {
    id: 'top-apricot',
    nameKo: '살구 과즙 & 피치 벨벳',
    nameEn: 'Velvet Apricot Nectar',
    category: 'top',
    family: 'fruity',
    emoji: '🍑',
    character: '달콤하고 부드럽게 감기는 잘 익은 살구와 복숭아 과즙의 온기',
    musicalMapping: '산뜻하고 달콤한 멜로딕 벌스, 당당하고 경쾌한 에너지',
  },
  {
    id: 'top-fig-leaf',
    nameKo: '풋풋한 무화과 잎',
    nameEn: 'Fresh Fig Leaf',
    category: 'top',
    family: 'green',
    emoji: '🍃',
    character: '초여름 새벽이슬을 머금은 싱그럽고 쌉싸름한 야생 무화과 잎사귀',
    musicalMapping: '도회적이고 쿨한 2-Step 셔플 드럼의 어택감',
  },
  {
    id: 'top-sea-salt',
    nameKo: '솔티 마린 & 파도 윤슬',
    nameEn: 'Salty Marine Breeze',
    category: 'top',
    family: 'marine',
    emoji: '🌊',
    character: '부서지는 하얀 파도와 짭조름한 바닷바람, 푸른 유리알 같은 청명함',
    musicalMapping: '시원하게 쏟아지는 스파클링 하우스 드롭, 공간감 넘치는 패드',
  },
  {
    id: 'top-pink-pepper',
    nameKo: '스파이시 핑크 페퍼',
    nameEn: 'Spicy Pink Pepper',
    category: 'top',
    family: 'citrus',
    emoji: '✨',
    character: '코끝을 톡 쏘는 짜릿한 긴장감과 매혹적인 스파이시 뉘앙스',
    musicalMapping: '스네어 롤과 텐션 높은 빌드업, 도발적인 킬링 포인트',
  },
  {
    id: 'top-aldehydes',
    nameKo: '샴페인 알데하이드 & 비누 거품',
    nameEn: 'Champagne Aldehydes',
    category: 'top',
    family: 'gourmand',
    emoji: '🫧',
    character: '탄산수처럼 팡 터지는 기포와 보송보송 깨끗한 린넨 비누 향',
    musicalMapping: '통통 튀는 2-Step Garage 셔플, 맑은 에테리얼 보컬 딜리버리',
  },
]

export const MIDDLE_NOTES: ScentNoteItem[] = [
  {
    id: 'mid-osmanthus',
    nameKo: '금목서 꽃잎 (오스만투스)',
    nameEn: 'Golden Osmanthus Petals',
    category: 'middle',
    family: 'floral',
    emoji: '🍂',
    character: '가을바람에 실려오는 살구빛 아련함, 첫사랑의 기억을 소환하는 동양적 꽃향',
    musicalMapping: '아련하게 벅차오르는 감성 딥하우스 후렴구, 서정적인 멜로디',
  },
  {
    id: 'mid-black-tea',
    nameKo: '스모키 얼그레이 홍차',
    nameEn: 'Smoky Earl Grey Black Tea',
    category: 'middle',
    family: 'tea',
    emoji: '☕',
    character: '따뜻한 찻잔에서 피어오르는 쌉싸름하고 지적인 찻잎의 깊은 여운',
    musicalMapping: '깊은 감정선을 채우는 따뜻한 피아노와 둥글게 울리는 서브 베이스',
  },
  {
    id: 'mid-neroli',
    nameKo: '만개한 네롤리 (오렌지꽃)',
    nameEn: 'Sunlit Neroli Blossom',
    category: 'middle',
    family: 'floral',
    emoji: '🍊',
    character: '햇살 가득한 지중해의 비터 오렌지 꽃잎, 우아하고 청량한 플로럴',
    musicalMapping: '화려하고 당당한 댄스 팝 신스 리드, 폭발적인 고음 하모니',
  },
  {
    id: 'mid-wild-fig',
    nameKo: '달콤쌉싸름한 야생 무화과 과육',
    nameEn: 'Sweet Fig Flesh & Coconut Milk',
    category: 'middle',
    family: 'fruity',
    emoji: '🍈',
    character: '붉은 무화과 과육과 부드러운 코코넛 밀크가 어우러진 크리미한 중독성',
    musicalMapping: '벨벳처럼 쫀득한 딥하우스 그루브, 트렌디한 저중음 훅',
  },
  {
    id: 'mid-muguet',
    nameKo: '은방울꽃 & 촉촉한 풀잎 (페트리코)',
    nameEn: 'Dewy Lily of the Valley & Petrichor',
    category: 'middle',
    family: 'green',
    emoji: '🌧️',
    character: '비 갠 뒤 촉촉하게 젖은 숲길, 맑고 순수한 은방울꽃의 이슬 맺힌 향',
    musicalMapping: '나른하고 몽환적인 베드룸 팝, 감싸 안아주는 위로의 멜로디',
  },
  {
    id: 'mid-orchid',
    nameKo: '미드나잇 블랙 오키드',
    nameEn: 'Midnight Black Orchid',
    category: 'middle',
    family: 'floral',
    emoji: '🖤',
    character: '어두운 밤거리의 네온사인처럼 치명적이고 신비로운 밤의 난초 향',
    musicalMapping: '다크하고 시크한 클럽 딥하우스, 묵직하고 단단한 808 킥 드롭',
  },
]

export const BASE_NOTES: ScentNoteItem[] = [
  {
    id: 'base-cashmere',
    nameKo: '캐시미어 우드 & 따스한 체온',
    nameEn: 'Cashmere Wood & Skin Scent',
    category: 'base',
    family: 'woody',
    emoji: '🧣',
    character: '부드러운 니트에서 느껴지는 체온, 귓가에 남은 속삭임 같은 살냄새',
    musicalMapping: '은은하게 사라지지 않는 앰비언트 패드 아웃트로, 프루스트 잔향',
  },
  {
    id: 'base-musk',
    nameKo: '화이트 머스크 & 린넨',
    nameEn: 'White Musk & Clean Linen',
    category: 'base',
    family: 'musk',
    emoji: '🤍',
    character: '깨끗하고 투명한 살결 위에 얹어진 편안한 순백의 안식',
    musicalMapping: '크리스탈처럼 맑은 에테리얼 백보컬 레이어링, 깨끗한 모던 믹스',
  },
  {
    id: 'base-sandalwood',
    nameKo: '밀키 샌달우드 & 인센스',
    nameEn: 'Milky Sandalwood & Soft Incense',
    category: 'base',
    family: 'woody',
    emoji: '🕯️',
    character: '새벽 사원의 고요함을 담은 부드러운 백단향과 나직한 연기의 정적',
    musicalMapping: '공간을 넓게 감싸는 깊은 리버브 테일, 칠하고 몽환적인 텍스처',
  },
  {
    id: 'base-ambergris',
    nameKo: '골든 앰버그리스 (용연향)',
    nameEn: 'Golden Ambergris Accord',
    category: 'base',
    family: 'marine',
    emoji: '✨',
    character: '바다 깊은 곳의 시간을 품은 신비로운 앰버그리스, 깊고 매혹적인 잔향',
    musicalMapping: '묵직하고 둥글게 울리는 Donk/Moog 베이스, 심장을 울리는 저음',
  },
  {
    id: 'base-vanilla',
    nameKo: '스모크드 버번 바닐라',
    nameEn: 'Smoked Bourbon Vanilla Bean',
    category: 'base',
    family: 'gourmand',
    emoji: '🍨',
    character: '달콤하지만 가볍지 않은 스모키한 바닐라 빈의 우아한 여운',
    musicalMapping: '로맨틱하고 끈적한 그루브, 밤의 무드를 극대화하는 신스 코드',
  },
  {
    id: 'base-driftwood',
    nameKo: '유목 (드리프트우드) & 젖은 흙',
    nameEn: 'Coastal Driftwood & Wet Earth',
    category: 'base',
    family: 'woody',
    emoji: '🪵',
    character: '파도에 마모된 유목과 비에 젖은 대지, 단단하고 변함없는 기억의 닻',
    musicalMapping: '단단하고 그루비한 리듬 세션, 흔들림 없는 베이스라인',
  },
]

// 2. 조향학 기반 큐레이션된 신규 시그니처 향기 포뮬러 (리센느에게 제안하는 6대 뉴 센트)
export interface CuratedScentFormula {
  id: string
  emoji: string
  nameKo: string
  nameEn: string
  conceptBadge: string
  inspiration: string
  pyramid: {
    top: string
    middle: string
    base: string
  }
  bpm: string
  recommendedVocal: string
  genre: string
  topic: string
  instruments: string[]
}

export const CURATED_NEW_SCENTS: CuratedScentFormula[] = [
  {
    id: 'osmanthus-tea',
    emoji: '🍂',
    nameKo: '오스만투스 티 & 노을빛 잔향',
    nameEn: 'Osmanthus Noir & Earl Grey',
    conceptBadge: '프루스트 효과의 정점 · 가을바람',
    inspiration: '마르셀 프루스트의 홍차 모티브에서 영감 — 가을 골목길을 채우는 살구빛 금목서 꽃잎과 쌉싸름한 얼그레이 홍차의 애틋한 재회',
    pyramid: {
      top: '스파클링 베르가못 & 살구 과즙',
      middle: '금목서 꽃잎 (오스만투스) & 스모키 얼그레이',
      base: '캐시미어 우드 & 따스한 체온',
    },
    bpm: '126 BPM (감성 딥하우스)',
    recommendedVocal: '리센느 리브 & 미나미 (보컬라인)',
    genre: 'K-Pop 감성 딥하우스 & 노이 neu 스타일',
    topic: '골목길을 채우는 살구빛 금목서 향기, 찻잔에 번지는 얼그레이 잔향, 잊혀지지 않는 그 계절의 노을',
    instruments: ['신디사이저', '그랜드 피아노', '베이스'],
  },
  {
    id: 'fig-green',
    emoji: '🌿',
    nameKo: '야생 무화과 숲 & 그린 밀키',
    nameEn: 'Figue Blanche & Milky Cedar',
    conceptBadge: '트렌디 니치 향수 · 도회적 쿨함',
    inspiration: '풋풋한 무화과 잎의 쌉싸름한 생명력과 크리미한 과육, 부드러운 코코넛 밀크가 어우러진 현대적인 니치 프래그런스',
    pyramid: {
      top: '풋풋한 무화과 잎 & 스파이시 핑크 페퍼',
      middle: '달콤쌉싸름한 야생 무화과 과육 & 아이리스',
      base: '밀키 샌달우드 & 캐시미어',
    },
    bpm: '124 BPM (그루비 2-Step)',
    recommendedVocal: '리센느 제나 & 원이 (비트유닛)',
    genre: 'K-Pop 2-Step Garage & 어반 하우스',
    topic: '새벽이슬 맺힌 무화과 숲의 싱그러움, 시크하게 감기는 중저음의 엣지, 톡 터지는 비트의 쾌감',
    instruments: ['베이스', '808 비트', '신디사이저'],
  },
  {
    id: 'salty-marine',
    emoji: '🌊',
    nameKo: '솔티 마린 & 시 글래스',
    nameEn: 'Salty Breeze & Sea Glass',
    conceptBadge: '파도와 윤슬 · 청명한 청춘',
    inspiration: '파도에 마모되어 둥글어진 투명한 바다 유리알(Sea Glass), 짭조름한 바닷바람과 푸른 파도의 역동적인 질주감',
    pyramid: {
      top: '솔티 마린 & 파도 윤슬',
      middle: '은방울꽃 & 촉촉한 마린 노트',
      base: '유목 (드리프트우드) & 골든 앰버그리스',
    },
    bpm: '128 BPM (질주감 넘치는 2-Step)',
    recommendedVocal: '리센느 완전체 (5인 에테리얼 하모니)',
    genre: 'K-Pop 에테리얼 2-Step 셔플',
    topic: '파도에 반짝이는 시 글래스, 귓가를 스치는 짭조름한 바닷바람, 한여름 밤의 푸른 기억',
    instruments: ['808 비트', '신디사이저', '베이스'],
  },
  {
    id: 'london-vanilla',
    emoji: '☕',
    nameKo: '비안개 런던 & 스모키 바닐라',
    nameEn: 'London Mist & Smoked Vanilla',
    conceptBadge: '깊은 밤의 정적 · 나른한 온기',
    inspiration: '비안개가 짙게 깔린 런던의 조용한 밤, 벽난로의 훈기와 스모키한 블랙 바닐라의 달콤 쌉싸름한 위로',
    pyramid: {
      top: '스파이시 카다멈 & 베르가못',
      middle: '미드나잇 블랙 오키드 & 파피루스',
      base: '스모크드 버번 바닐라 & 앰버',
    },
    bpm: '118 BPM (나른한 딥 팝)',
    recommendedVocal: '리센느 메이 & 리브 (몽환유닛)',
    genre: 'K-Pop 슬로우 딥하우스 & 칠웨이브',
    topic: '안개 낀 밤거리의 고요한 불빛, 스모키하게 피어오르는 바닐라의 온기, 나직한 귓가 속삭임',
    instruments: ['일렉 피아노', '신디사이저', '베이스'],
  },
  {
    id: 'cashmere-skin',
    emoji: '🤍',
    nameKo: '캐시미어 살결 & 화이트 머스크',
    nameEn: 'Cashmere Skin & Clean Linen',
    conceptBadge: '순백의 친밀감 · 스킨 센트',
    inspiration: '샤워 후 하얀 캐시미어 니트를 입었을 때 전해지는 가장 순수하고 포근한 체온의 기억',
    pyramid: {
      top: '샴페인 알데하이드 & 비누 거품',
      middle: '은방울꽃 & 코튼 플라워',
      base: '화이트 머스크 & 캐시미어 우드',
    },
    bpm: '115 BPM (포근한 베드룸 팝)',
    recommendedVocal: '리센느 메이 (서브보컬·몽환적 브레시)',
    genre: 'K-Pop 베드룸 신스팝 & 앰비언트 하우스',
    topic: '하얀 린넨 시트에 스며든 체온, 거짓 없는 순수한 마음, 은은하게 번지는 살결의 잔향',
    instruments: ['신디사이저', '그랜드 피아노', '어쿠스틱 기타'],
  },
  {
    id: 'neroli-sunset',
    emoji: '🍊',
    nameKo: '네롤리 선셋 & 골든 블룸',
    nameEn: 'Neroli Sunset & Ambered Blossom',
    conceptBadge: '황금빛 축제 · 화려한 활력',
    inspiration: '노을이 붉게 물드는 지중해 언덕, 만개한 비터 오렌지 꽃잎에서 뿜어져 나오는 화려하고 생기 넘치는 플로럴 축제',
    pyramid: {
      top: '스파클링 베르가못 & 살구 과즙',
      middle: '만개한 네롤리 (오렌지꽃)',
      base: '골든 앰버그리스 & 밀키 샌달우드',
    },
    bpm: '130 BPM (에너제틱 딥 댄스)',
    recommendedVocal: '리센느 원이 & 미나미 (에너지·파워)',
    genre: 'K-Pop 에너제틱 딥하우스 & 댄스 팝',
    topic: '황금빛 노을 속에 흩날리는 네롤리 꽃잎, 심장을 두드리는 비트, 끝나지 않을 우리만의 축제',
    instruments: ['신디사이저', '808 비트', '베이스'],
  },
]

// 3. 커스텀 조향 결과 생성 헬퍼 함수
export function buildCustomScentFormula(
  top: ScentNoteItem,
  middle: ScentNoteItem,
  base: ScentNoteItem
): {
  nameKo: string
  nameEn: string
  pyramidSummary: string
  topicSentence: string
  genreRecommendation: string
  bpmRecommendation: string
} {
  const nameKo = `${top.nameKo.split(' ')[0]} × ${middle.nameKo.split(' ')[0]} 잔향`
  const nameEn = `${top.nameEn.split(' ')[0]} & ${middle.nameEn.split(' ')[0]} Scent`
  const pyramidSummary = `탑: ${top.nameKo} → 미들: ${middle.nameKo} → 베이스: ${base.nameKo}`
  const topicSentence = `[탑 노트]: ${top.character}. [미들 노트]: ${middle.character}. [베이스 잔향]: ${base.character}. 세 가지 노트가 시간에 따라 유려하게 변화하며 프루스트 효과처럼 잊혀지지 않는 잔향을 남김.`

  // 비트 및 BPM 지향점 자동 산출
  let bpmRecommendation = '125-130 BPM (리센느 시그니처 2-Step & 딥하우스)'
  if (top.family === 'marine' || top.family === 'citrus') {
    bpmRecommendation = '128-132 BPM (청량감 넘치는 질주감 2-Step)'
  } else if (middle.family === 'tea' || base.family === 'woody') {
    bpmRecommendation = '118-124 BPM (나른하고 그루비한 감성 딥하우스)'
  }

  return {
    nameKo,
    nameEn,
    pyramidSummary,
    topicSentence,
    genreRecommendation: 'K-Pop 딥하우스 & 2-Step Garage (커스텀 조향)',
    bpmRecommendation,
  }
}
