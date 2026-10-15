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
  instrumentTechniques: string[] // 구체적인 악기 종류 및 연주 기법 설명
  sonicDescriptor: string // Suno v6 stylePrompt에 들어갈 악기 기법 결합형 영문 디스크립터
}

export const CURATED_NEW_SCENTS: CuratedScentFormula[] = [
  {
    id: 'salty-marine',
    emoji: '🌊',
    nameKo: '솔티 마린 & 시 글래스 셔플',
    nameEn: 'Salty Marine Breeze & Ambergris',
    conceptBadge: '미니 1집 《SCENEDROME》 · 앰버그리스(바다 & 파도)',
    inspiration: '미니 1집 더블 타이틀 〈LOVE ATTACK〉과 〈Pinball〉의 원천! 바다에 둥글어진 투명한 시 글래스와 짭조름한 바닷바람의 청량한 속도감',
    pyramid: {
      top: '솔티 마린 & 파도 윤슬 (Sea Salt & Waves)',
      middle: '은방울꽃 & 촉촉한 마린 노트 (Lily of Valley & Marine)',
      base: '유목 (드리프트우드) & 골든 앰버그리스 (Ambergris)',
    },
    bpm: '128 BPM (청량 질주 2-Step & 딥하우스)',
    recommendedVocal: '리센느 완전체 (5인 에테리얼 하모니)',
    genre: 'K-Pop 에테리얼 2-Step 셔플 & 딥하우스',
    topic: '파도에 반짝이는 시 글래스, 귓가를 스치는 짭조름한 바닷바람, 한여름 밤의 푸른 기억',
    instruments: ['아르페지오 신스 플럭', '에어리 패드 스윕', '롤링 하우스 베이스'],
    instrumentTechniques: [
      '크리스탈 딜레이가 걸린 탄산감 넘치는 아르페지오 플럭',
      '바람처럼 넓게 번지는 에어리 신스 패드 스윕',
      '통통 튀며 질주감을 주는 롤링 하우스 베이스 그루브',
    ],
    sonicDescriptor: 'effervescent arpeggiated synth plucks with crystal delay, airy atmospheric pad sweeps, bouncy rolling bass groove, sparkling crystalline texture, spacious modern mix',
  },
  {
    id: 'sparkling-soap',
    emoji: '🫧',
    nameKo: '스파클링 솝 & 클린 버블 댄스',
    nameEn: 'Sparkling Soap & Champagne Bubble',
    conceptBadge: '미니 2집 《Glow Up》 · 깨끗한 비누 향(Clean Soap)',
    inspiration: '미니 2집 타이틀 〈Glow Up〉의 청명함! 샤워 후 팡 터지는 샴페인 알데하이드 거품과 보송보송한 비누 잔향, Z세대의 빛나는 성장을 담은 산뜻한 댄스 팝',
    pyramid: {
      top: '샴페인 알데하이드 & 비누 거품 (Champagne Aldehydes)',
      middle: '만개한 은방울꽃 & 코튼 플라워 (Cotton Flower)',
      base: '화이트 머스크 & 캐시미어 우드 (Soft White Musk)',
    },
    bpm: '126 BPM (청량 클린 댄스 팝)',
    recommendedVocal: '리센느 원이 & 메이 (비타민 & 브레시)',
    genre: 'K-Pop 클린 2-Step & Y2K 댄스 팝',
    topic: '투명한 유리창에 비친 아침 햇살, 방울방울 터지는 비누 거품의 상쾌함, 매일 더 눈부시게 피어나는 우리',
    instruments: ['버블 신스 플럭', '2-Step 셔플 드럼', '타이트 펀치 베이스'],
    instrumentTechniques: [
      '탄산 기포처럼 톡 쏘듯 짧게 튀는 브라이트 버블 신스 플럭',
      '스냅 클랩과 당김음이 살아있는 crisp 2-Step 셔플 드럼',
      '보컬 공간을 방해하지 않는 타이트하고 경쾌한 펀치 베이스',
    ],
    sonicDescriptor: 'bright bubbly synth plucks with short decay, crisp syncopated 2-step garage shuffle drums, tight punchy bassline, dry upfront studio vocal mix, modern Y2K dance-pop bounce',
  },
  {
    id: 'burning-flower',
    emoji: '🌺',
    nameKo: '버닝 플로럴 & 네롤리 댄스',
    nameEn: 'Burning Flower & Spiced Neroli',
    conceptBadge: '싱글 1집 《Re:Scene》 · 플로럴(Burning Flower)',
    inspiration: '데뷔 타이틀 〈Uh-Uh〉와 선공개곡 〈YoYo〉의 당당함! 불꽃 속에서도 매혹적으로 타오르는 꽃처럼 강렬하고 도도한 모던 댄스 팝',
    pyramid: {
      top: '스파이시 핑크 페퍼 & 베르가못 (Spicy Pink Pepper)',
      middle: '만개한 네롤리 (오렌지꽃) & 레드 로즈 (Burning Floral)',
      base: '골든 앰버 & 모던 인센스 (Golden Amber)',
    },
    bpm: '124 BPM (시크 & 파워풀 댄스 팝)',
    recommendedVocal: '리센느 미나미 & 제나 (파워 & 시크)',
    genre: 'K-Pop 다크&시크 딥 댄스 팝',
    topic: '새벽을 가르는 붉은 불꽃, 코끝을 스치는 짜릿한 꽃잎의 잔향, 흔들림 없이 빛나는 당당한 시선',
    instruments: ['모던 브라스 신스 스탭', '글라이딩 808 서브베이스', '트랩 하우스 퍼커션'],
    instrumentTechniques: [
      '필터 컷오프가 칼같이 닫히는 세련된 모던 브라스 신스 스탭',
      '도도하고 묵직하게 미끄러지는 808 서브 글라이드 베이스',
      '비트의 엣지를 살리는 트랩 인퓨즈드 하우스 퍼커션',
    ],
    sonicDescriptor: 'slick modern brass synth stabs with fast cutoff, deep gliding 808 sub bass, crisp trap-infused house percussion, spacious dry vocal pocket, chic confident K-Pop bounce',
  },
  {
    id: 'dewy-green',
    emoji: '🍃',
    nameKo: '페트리코 웻 그린 & 칠 딥하우스',
    nameEn: 'Dewy Green & Rainy Petrichor',
    conceptBadge: '싱글 2집 《Dearest》 · 비 온 뒤 풀잎(Green & Petrichor)',
    inspiration: '싱글 2집 타이틀 〈Dearest〉의 아련함! 비 갠 뒤 촉촉하게 젖은 풀잎과 대지의 흙내음, 귓가에 오래 머무는 서정적이고 감각적인 칠 딥하우스',
    pyramid: {
      top: '풋풋한 무화과 잎 & 페트리코 (Fresh Dewy Green Leaf)',
      middle: '이슬 맺힌 은방울꽃 & 아이리스 (Lily & Dewdrop)',
      base: '밀키 샌달우드 & 클린 베티버 (Clean Vetiver)',
    },
    bpm: '122 BPM (서정적 칠 딥하우스)',
    recommendedVocal: '리센느 리브 & 미나미 (보컬 감성라인)',
    genre: 'K-Pop 서정적 칠 딥하우스 & 엠비언트 팝',
    topic: '비 갠 오후의 촉촉한 풀잎, 물방울에 번지는 기억의 잔향, 다정하게 건네는 애틋한 안부',
    instruments: ['글래스 신스 플럭', '사이드체인 서브베이스', '앰비언트 워터드롭 패드'],
    instrumentTechniques: [
      '이슬 맺힌 듯 영롱한 핑퐁 딜레이 글래스 플럭 아르페지오',
      '숨결처럼 공간을 채우는 사이드체인 딥 Moog 서브베이스',
      '물방울 튀듯 맑고 공간감 넘치는 앰비언트 텍스처',
    ],
    sonicDescriptor: 'dewy staccato glass plucks with stereo ping-pong delay, sidechain pumping deep clean sub-bass, filtered ambient water drop textures, spacious vocal arrangement, sophisticated chill deep house',
  },
  {
    id: 'juicy-berry',
    emoji: '🍓',
    nameKo: '쥬시 베리 & 립밤 팝',
    nameEn: 'Sparkling Wild Berry & Glossy Lip Balm',
    conceptBadge: '미니 3집 《lip bomb》 · 5가지 베리(Juicy Berry)',
    inspiration: '미니 3집 〈lip bomb〉과 〈Heart Drop〉의 톡 쏘는 매력! 립밤처럼 촉촉하게 발려 폭발하듯 터지는 라즈베리·블랙베리 과즙미, 중독적인 플럭 베이스의 키치 댄스 팝',
    pyramid: {
      top: '와일드 스트로베리 & 크랜베리 (Sparkling Cranberry)',
      middle: '달콤쌉싸름한 블랙베리 & 라즈베리 (Juicy Berry Accord)',
      base: '글로시 바닐라 빈 & 소프트 머스크 (Glossy Balm & Musk)',
    },
    bpm: '125 BPM (당돌한 키치 딥 팝)',
    recommendedVocal: '리센느 원이 & 제나 (에너지 & 엣지)',
    genre: 'K-Pop 키치 딥하우스 & 틴크러시 팝',
    topic: '입술에 닿는 순간 번지는 달콤한 베리 과즙, 숨길 수 없이 커지는 두근거림, 솔직하고 당돌한 고백',
    instruments: ['스냅 플럭 베이스', '스파클링 신스 벨', '타이트 클랩 그루브'],
    instrumentTechniques: [
      '쫀득한 어택감으로 튀어오르는 일래스틱 스냅 플럭 베이스',
      '과즙이 팡 터지듯 반짝이는 스파클링 신스 벨 아르페지오',
      '귀에 착 감기는 타이트한 스네어 클랩과 보컬 찹 레이어',
    ],
    sonicDescriptor: 'elastic snappy pluck bass groove with tight transient, sparkling bell arpeggios, tight crisp clap groove, subtle modern vocal chop layers, energetic glossy K-Pop bounce',
  },
  {
    id: 'heart-pulse',
    emoji: '🫀',
    nameKo: '벨벳 머스크 & 펄스 딥그루브',
    nameEn: 'Velvet Skin Musk & Heartbeat Pulse',
    conceptBadge: '미니 4집 《PULSE》 · 심장 박동 & 체온(Skin Pulse)',
    inspiration: '미니 4집 〈PULSE〉와 〈Pretty Girl〉의 서사! 살아 숨 쉬는 맥박처럼 뛰는 킥 비트와 나직하게 귓가에 스미는 체온, 미니멀하고 몽환적인 나이트 드라이브 딥하우스',
    pyramid: {
      top: '은은한 베르가못 & 샴페인 기포 (Subtle Sparkling Fizz)',
      middle: '벨벳 블랙 오키드 & 웜 스킨 센트 (Warm Skin Accord)',
      base: '캐시미어 우드 & 딥 앰버그리스 (Deep Cashmere & Pulse)',
    },
    bpm: '120 BPM (미니멀 펄스 딥하우스)',
    recommendedVocal: '리센느 메이 & 리브 (몽환 & 감성)',
    genre: 'K-Pop 미니멀 딥하우스 & 칠웨이브',
    topic: '나란히 걸을 때 느껴지는 규칙적인 심장 박동, 귓가에 머무는 따스한 숨결, 밤하늘 아래 우리 둘만의 파동',
    instruments: ['펄스 딥 킥', '에어리 신스 패드', '벨벳 미니멀 베이스'],
    instrumentTechniques: [
      '심장 박동처럼 규칙적으로 가슴을 울리는 미니멀 딥 킥 펄스',
      '보컬의 숨소리를 감싸 안는 넓고 투명한 에어리 신스 패드',
      '군더더기 없이 묵직하고 매끄러운 벨벳 미니멀 베이스라인',
    ],
    sonicDescriptor: 'heartbeat-inspired minimal deep kick pulse, warm minimalist deep house groove, airy whisper synth pads, intimate upfront breathy vocal pocket, hypnotic late-night modern polish',
  },
]

// 3. 커스텀 사운드 & 악기 주법 모듈 라이브러리
export interface SoundModuleItem {
  id: string
  nameKo: string
  nameEn: string
  type: 'keyboard' | 'bass' | 'space'
  descriptionKo: string
  techniqueTag: string // Suno stylePrompt에 들어갈 영문 악기+주법 태그
  emoji: string
}

export const CUSTOM_KEYBOARD_MODULES: SoundModuleItem[] = [
  {
    id: 'rhodes-tremolo',
    nameKo: '세련된 코러스 Rhodes 일렉 피아노',
    nameEn: 'Lush Chorus Rhodes Piano',
    type: 'keyboard',
    descriptionKo: '탁한 빈티지 먼지 대신, 맑고 투명한 코러스와 넓은 스테레오 공간감의 모던 Rhodes 코드',
    techniqueTag: 'lush modern Rhodes electric piano with crystal chorus chords, spacious airy voicing',
    emoji: '🎹',
  },
  {
    id: 'synth-plucks',
    nameKo: '반짝이는 아르페지오 신스 플럭',
    nameEn: 'Arpeggiated Synth Plucks',
    type: 'keyboard',
    descriptionKo: '크리스탈처럼 맑고 통통 튀는 딜레이 아르페지오 플럭 사운드 (보컬 공간 완벽 확보)',
    techniqueTag: 'sparkling arpeggiated synth plucks with crystal delay',
    emoji: '✨',
  },
  {
    id: 'modern-upright',
    nameKo: '선명하고 또렷한 모던 피아노 해머 질감',
    nameEn: 'Modern Polished Piano',
    type: 'keyboard',
    descriptionKo: '텁텁한 먹통 소리 없는 세련되고 선명한 타건감과 넓은 스테레오 모던 건반',
    techniqueTag: 'modern polished piano with crystalline transient and wide stereo spread',
    emoji: '🫧',
  },
  {
    id: 'staccato-leads',
    nameKo: '브라이트 필터 스타카토 리드 신스',
    nameEn: 'Staccato Synth Lead',
    type: 'keyboard',
    descriptionKo: '공진(Resonance) 필터가 열리며 톡 쏘듯 치고 나가는 청량한 리드',
    techniqueTag: 'bright resonant staccato synth leads with fast filter decay',
    emoji: '🎷',
  },
  {
    id: 'airy-pads',
    nameKo: '투명하고 넓은 에어리 신스 패드 스웰',
    nameEn: 'Airy Ethereal Synth Pad',
    type: 'keyboard',
    descriptionKo: '보컬 음역대를 가리지 않고 배경 공기를 맑게 채우는 쉬머 패드 화음',
    techniqueTag: 'airy ethereal synth pad swells with lush shimmer and wide stereo field',
    emoji: '☁️',
  },
]

export const CUSTOM_BASS_MODULES: SoundModuleItem[] = [
  {
    id: 'moog-sidechain',
    nameKo: '사이드체인 딥 Moog 서브베이스',
    nameEn: 'Sidechain Moog Sub Bass',
    type: 'bass',
    descriptionKo: '킥 드럼에 맞춰 심장을 묵직하게 두드리는 딥하우스 펌핑 서브베이스',
    techniqueTag: 'sidechain pumping Moog sub-bass groove with deep low-end',
    emoji: '🎸',
  },
  {
    id: 'two-step-shuffle',
    nameKo: '통통 튀는 2-Step Garage 셔플 비트',
    nameEn: '2-Step Shuffle Beat',
    type: 'bass',
    descriptionKo: '당김음(Syncopation)과 스냅 스네어로 세련된 리듬감을 주는 셔플 드럼',
    techniqueTag: 'crisp syncopated 2-step garage shuffle drums with tight snare claps',
    emoji: '🥁',
  },
  {
    id: 'punchy-808-glide',
    nameKo: '펀치감 넘치는 808 서브 글라이드',
    nameEn: 'Punchy 808 Glide Bass',
    type: 'bass',
    descriptionKo: '트렌디한 힙합/R&B 터치가 가미된 쫀득하고 묵직한 808 글라이드',
    techniqueTag: 'punchy 808 sub bass with smooth melodic glides',
    emoji: '💥',
  },
  {
    id: 'rolling-bass',
    nameKo: '도회적이고 둥근 롤링 베이스라인',
    nameEn: 'Rolling Donk Bassline',
    type: 'bass',
    descriptionKo: '곡의 질주감을 매끄럽게 이끄는 둥글고 그루비한 하우스 베이스',
    techniqueTag: 'bouncy rolling house bassline with round low-mid presence',
    emoji: '🌊',
  },
]

export const CUSTOM_SPACE_MODULES: SoundModuleItem[] = [
  {
    id: 'dry-close-mic',
    nameKo: '드라이 스튜디오 믹스 (AI 에코 차단)',
    nameEn: 'Dry Studio Mix',
    type: 'space',
    descriptionKo: '악기와 보컬이 붕 뜨지 않고 귀 바로 앞에서 또렷하게 들리는 현대적 믹스',
    techniqueTag: 'dry upfront close-mic studio production, clean modern mix',
    emoji: '🎙️',
  },
  {
    id: 'modern-gloss',
    nameKo: '하이글로시 모던 팝 투명 분리 믹스',
    nameEn: 'High-Gloss Modern Pop Mix',
    type: 'space',
    descriptionKo: '먹먹한 레트로 질감을 걷어내고 각 악기와 보컬의 주파수가 선명하게 분리되는 하이글로시 사운드',
    techniqueTag: 'polished high-gloss modern pop mix, transparent frequency separation',
    emoji: '💿',
  },
  {
    id: 'crystalline-hifi',
    nameKo: '청량하고 투명한 하이파이 크리스탈',
    nameEn: 'Crystalline Hi-Fi',
    type: 'space',
    descriptionKo: '고음역이 유리알처럼 맑고 깨끗하게 뻗어나가는 청량한 공간감',
    techniqueTag: 'sparkling crystalline high-fidelity mix with wide stereo imaging',
    emoji: '💎',
  },
]

// 4. 커스텀 사운드 조합 결과 빌더
export function buildCustomSoundFormula(
  keyboard: SoundModuleItem,
  bass: SoundModuleItem,
  space: SoundModuleItem
): {
  nameKo: string
  nameEn: string
  techniqueSummary: string
  sonicDescriptor: string
  genreRecommendation: string
  bpmRecommendation: string
} {
  const nameKo = `${keyboard.nameKo.split(' ')[1] || keyboard.nameKo} × ${bass.nameKo.split(' ')[1] || bass.nameKo}`
  const nameEn = `${keyboard.nameEn} & ${bass.nameEn}`
  const techniqueSummary = `${keyboard.nameKo} + ${bass.nameKo} + ${space.nameKo}`
  const sonicDescriptor = `${keyboard.techniqueTag}, ${bass.techniqueTag}, ${space.techniqueTag}`

  return {
    nameKo,
    nameEn,
    techniqueSummary,
    sonicDescriptor,
    genreRecommendation: 'K-Pop 딥하우스 & 2-Step Garage (커스텀 악기 조합)',
    bpmRecommendation: '126 BPM (리센느 시그니처 딥하우스)',
  }
}

// 이전 호환용 함수
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
  sonicDescriptor: string
} {
  const nameKo = `${top.nameKo.split(' ')[0]} × ${middle.nameKo.split(' ')[0]} 사운드`
  const nameEn = `${top.nameEn.split(' ')[0]} & ${middle.nameEn.split(' ')[0]} Scent`
  const pyramidSummary = `질감: ${top.nameKo} → 바디: ${middle.nameKo} → 서브: ${base.nameKo}`
  const topicSentence = `[상단 질감]: ${top.character}. [중간 바디]: ${middle.character}. [베이스]: ${base.character}.`

  let bpmRecommendation = '125-130 BPM (리센느 시그니처 2-Step & 딥하우스)'
  if (top.family === 'marine' || top.family === 'citrus') {
    bpmRecommendation = '128-132 BPM (청량감 넘치는 질주감 2-Step)'
  } else if (middle.family === 'tea' || base.family === 'woody') {
    bpmRecommendation = '118-124 BPM (나른하고 그루비한 감성 딥하우스)'
  }

  const sonicDescriptor = `${top.nameEn.toLowerCase()} synth texture with articulated attack, ${middle.nameEn.toLowerCase()} resonant chords, ${base.nameEn.toLowerCase()} warm analog low-end`

  return {
    nameKo,
    nameEn,
    pyramidSummary,
    topicSentence,
    genreRecommendation: 'K-Pop 딥하우스 & 2-Step Garage (커스텀 조향)',
    bpmRecommendation,
    sonicDescriptor,
  }
}

export function getScentById(id: string): CuratedScentFormula | undefined {
  return CURATED_NEW_SCENTS.find((s) => s.id === id)
}
