// lib/rescene-vocal.ts
/**
 * 걸그룹 리센느(RESCENE) 멤버별 공식 보컬 분석 및 Suno v6 스타일 프롬프트 매핑 데이터
 * 멤버: 원이(Woni), 리브(Liv), 미나미(Minami), 메이(May), 제나(Zena) + 완전체
 */

export interface ResceneMemberVocal {
  id: 'all' | 'minami' | 'liv' | 'woni' | 'may' | 'zena'
  nameKo: string
  nameEn: string
  roleKo: string
  badge: string
  scentKeyword: string
  emoji: string
  label: string
  vocalAnalysis: {
    tone: string // 음색 및 질감
    technique: string // 발성 및 딕션
    strengths: string // 팀 내 역할 및 강점
    recommendedGenre: string // 가장 잘 어울리는 비트
  }
  stylePromptDescriptor: string // Suno Style Prompt에 들어갈 영문 디스크립터
  excludeStylesVocal?: string[]
}

export const RESCENE_MEMBERS: ResceneMemberVocal[] = [
  {
    id: 'all',
    nameKo: '리센느 완전체',
    nameEn: 'RESCENE (Full Group)',
    roleKo: '5인 시그니처 에테리얼 하모니',
    badge: '완전체 하모니',
    scentKeyword: '시그니처 프루스트 블렌딩 (Scent & Scene)',
    emoji: '🫧',
    label: '리센느 완전체 (5인 에테리얼 하모니)',
    vocalAnalysis: {
      tone: '다섯 멤버의 맑고 투명한 음색이 조화롭게 어우러진 시그니처 에테리얼(Ethereal) 블렌딩',
      technique: '유려한 화음 적층, 공간감을 채우는 풍성한 백보컬 레이어링, 청량한 앙상블',
      strengths: '향기가 퍼지듯 입체적으로 펼쳐지는 5인 5색의 음색 조화와 감성적인 후렴 하모니',
      recommendedGenre: 'K-Pop Deep House, 2-Step Garage, Ethereal Dance Pop',
    },
    stylePromptDescriptor: 'ethereal harmonized K-pop girl group vocals, layered lush backing chorus, sparkling crystal-clear delivery, Clear Korean Pronunciation',
  },
  {
    id: 'minami',
    nameKo: '미나미',
    nameEn: 'MINAMI',
    roleKo: '메인보컬 롤 & 올라운더',
    badge: '메인보컬 / 탄탄한 고음',
    scentKeyword: '청량하고 시원한 시트러스 & 스파클링',
    emoji: '✨',
    label: '리센느 미나미 (메인보컬·탄탄한 고음·명확한 딕션)',
    vocalAnalysis: {
      tone: '단단한 코어와 긴 호흡에서 나오는 시원하고 맑은 고음역대 보이스',
      technique: '비음 없는 깔끔하고 정확한 한국어 딕션, 폭넓은 음역대를 커버하는 안정적인 벨팅',
      strengths: '후렴구 멜로디의 뼈대를 단단히 세우고 클라이맥스 고음 애드리브를 확실하게 소화하는 팀의 보컬 엔진',
      recommendedGenre: '다이내믹한 딥하우스 후렴구, 질주감 있는 2-Step 셔플, 감성 댄스 팝',
    },
    stylePromptDescriptor: 'clean powerful high female vocals, crisp Korean diction, stable belting with versatile melodic delivery, Clear Korean Pronunciation',
  },
  {
    id: 'liv',
    nameKo: '리브',
    nameEn: 'LIV',
    roleKo: '리드보컬 & 보컬 기둥',
    badge: '리드보컬 / 맑은 크리스탈톤',
    scentKeyword: '순수하고 우아한 화이트 플로럴',
    emoji: '🌸',
    label: '리센느 리브 (리드보컬·맑은 크리스탈톤·안정된 중고음)',
    vocalAnalysis: {
      tone: '유리구슬처럼 투명하고 맑은 크리스탈 음색, 듣는 이의 마음을 편안하게 감싸는 청아함',
      technique: '부드럽고 안정적인 중고음역대 발성, 흔들림 없는 피치 컨트롤과 서정적인 감정선',
      strengths: '곡의 도입부와 프리코러스를 매끄럽게 연결하며 플로럴한 무드를 단번에 전달하는 보컬 중심축',
      recommendedGenre: '세련된 감성 딥하우스, 몽환적인 새벽 드라이브 팝, 감성 미디엄 템포',
    },
    stylePromptDescriptor: 'pure airy female vocals, silky smooth mid-high delivery, soulful emotional tone, Clear Korean Pronunciation',
  },
  {
    id: 'woni',
    nameKo: '원이',
    nameEn: 'WONI',
    roleKo: '리더 & 보컬 & 에너지',
    badge: '리더 / 산뜻한 그루브·에너지',
    scentKeyword: '생기 넘치는 프루티 & 베리',
    emoji: '💫',
    label: '리센느 원이 (리더·산뜻한 그루브·경쾌한 에너지)',
    vocalAnalysis: {
      tone: '밝고 당당하며 경쾌한 비타민 같은 보이스, 산뜻하게 튀어 오르는 프레시한 톤',
      technique: '리듬을 쪼개며 타는 뛰어난 그루브 감각, 톡톡 튀는 악센트와 캐치한 프레이징',
      strengths: '도입부와 벌스에서 곡의 에너지를 끌어올리고 무대의 활력을 이끄는 텐션 메이커',
      recommendedGenre: '통통 튀는 2-Step Garage 셔플, 탄산 기포 비트, 에너제틱 하우스',
    },
    stylePromptDescriptor: 'bright energetic female vocals, groovy upbeat delivery, charismatic fresh vocal tone, Clear Korean Pronunciation',
  },
  {
    id: 'may',
    nameKo: '메이',
    nameEn: 'MAY',
    roleKo: '서브보컬 & 감성 표현',
    badge: '서브보컬 / 몽환적 브레시',
    scentKeyword: '비 갠 뒤 풀잎 향(페트리코) & 은은한 비누',
    emoji: '☁️',
    label: '리센느 메이 (서브보컬·몽환적 브레시·섬세한 잔향)',
    vocalAnalysis: {
      tone: '공기 반 소리 반의 귓가 속삭임(Breathy), 안개 낀 새벽처럼 신비롭고 몽환적인 질감',
      technique: '부드러운 가성과 공기 섞인 허밍, 잔향(Afterglow)처럼 은은하게 번지는 섬세한 호흡 조절',
      strengths: '곡에 신비롭고 몽환적인 공간감을 불어넣고, 브릿지와 아웃트로의 아련한 여운을 완성',
      recommendedGenre: '앰비언트 하우스, 칠웨이브, 나른한 베드룸 신스팝, 페트리코 사운드',
    },
    stylePromptDescriptor: 'soft breathy whispery female vocals, delicate airy tone, ethereal lingering vocal texture, Clear Korean Pronunciation',
  },
  {
    id: 'zena',
    nameKo: '제나',
    nameEn: 'ZENA',
    roleKo: '서브보컬 & 킬링파트 (막내)',
    badge: '막내 / 트렌디 중저음·시크 엣지',
    scentKeyword: '매혹적인 앰버그리스(용연향) & 딥 우디',
    emoji: '🖤',
    label: '리센느 제나 (막내·트렌디 중저음·시크한 엣지)',
    vocalAnalysis: {
      tone: '트렌디하고 벨벳처럼 감기는 중저음 톤, 쿨하고 시크한 어반 뉘앙스',
      technique: '쫀득한 어택감(Punchy Attack)과 리드미컬한 플로우, 짧은 마디에서도 강한 몰입감 형성',
      strengths: '드롭 직전의 킬링 파트나 훅에서 반전 매력과 엣지를 부여하는 독보적인 포인트 보컬',
      recommendedGenre: '시크한 2-Step Garage, 버블링 베이스 딥하우스 드롭, 클럽 믹스',
    },
    stylePromptDescriptor: 'trendy chic female vocals, velvety low-mid delivery, playful punchy attack, cool modern edge, Clear Korean Pronunciation',
  },
]

export function getResceneMemberById(id: string): ResceneMemberVocal | undefined {
  return RESCENE_MEMBERS.find((m) => m.id === id)
}

export function findResceneMemberByLabel(label: string): ResceneMemberVocal | undefined {
  return RESCENE_MEMBERS.find((m) => m.label === label || label.includes(m.nameKo))
}

export function isResceneVocalLabel(label: string): boolean {
  return label.includes('리센느') || RESCENE_MEMBERS.some((m) => label.includes(m.nameKo))
}
