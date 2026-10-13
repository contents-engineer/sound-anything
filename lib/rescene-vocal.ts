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

export const RESCENE_ANTI_ECHO_EXCLUDES = [
  'heavy reverb',
  'echo',
  'cavernous hall',
  'metallic vocals',
  'distant hollow vocals',
]

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
      technique: '인위적인 에코 없이 마이크에 바짝 붙은(Close-mic) 선명한 발성과 정교한 화음 레이어링',
      strengths: '향기가 퍼지듯 입체적이되 귀 바로 옆에서 들리듯 드라이하고 또렷한 5인 5색의 음색 조화',
      recommendedGenre: 'K-Pop Deep House, 2-Step Garage, Dry Studio Dance Pop',
    },
    stylePromptDescriptor: 'dry upfront harmonized K-pop girl group vocals, close-mic studio recording, crisp crystal-clear delivery, layered tight backing vocals, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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
      technique: '비음과 울림 없이 깔끔하고 정확한 한국어 딕션, 드라이하고 시원하게 뻗는 고음 벨팅',
      strengths: '후렴구 멜로디의 뼈대를 단단히 세우고 클라이맥스 고음 애드리브를 확실하게 소화하는 팀의 보컬 엔진',
      recommendedGenre: '다이내믹한 딥하우스 후렴구, 질주감 있는 2-Step 셔플, 감성 댄스 팝',
    },
    stylePromptDescriptor: 'dry upfront powerful high female vocals, close-mic studio recording, crisp Korean diction, stable punchy belting, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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
      technique: '부드럽고 안정적인 중고음역대 발성, 에코 없이 귀에 착 감기는 실키한 보컬 프레즌스',
      strengths: '곡의 도입부와 프리코러스를 매끄럽게 연결하며 플로럴한 무드를 단번에 전달하는 보컬 중심축',
      recommendedGenre: '세련된 감성 딥하우스, 몽환적인 새벽 드라이브 팝, 감성 미디엄 템포',
    },
    stylePromptDescriptor: 'dry pure crystal-clear female vocals, intimate close-mic delivery, silky smooth mid-high presence, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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
      technique: '비트에 달라붙는 쫀득한 타격감, 에코 없이 단단하고 깔끔한 리듬 프레이징',
      strengths: '도입부와 벌스에서 곡의 에너지를 끌어올리고 무대의 활력을 이끄는 텐션 메이커',
      recommendedGenre: '통통 튀는 2-Step Garage 셔플, 탄산 기포 비트, 에너제틱 하우스',
    },
    stylePromptDescriptor: 'dry bright energetic female vocals, punchy close-mic delivery, crisp upbeat rhythm, charismatic fresh groove, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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
      tone: '공기 반 소리 반의 귓가 속삭임(Breathy), 안개 낀 새벽처럼 신비롭고 섬세한 질감',
      technique: '먼 곳에서 울리는 에코가 아니라 바로 귓가에서 나직하게 속삭이는 클로즈마이크 ASMR 발성',
      strengths: '과도한 리버브 없이도 보컬의 숨결만으로 깊은 몽환감과 서정적인 여운을 완성',
      recommendedGenre: '앰비언트 하우스, 칠웨이브, 나른한 베드룸 신스팝, 페트리코 사운드',
    },
    stylePromptDescriptor: 'intimate breathy close-mic female vocals, dry upfront whispering tone, delicate crisp articulation, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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
      technique: '타이트하고 쫀득한 어택감(Punchy Close-mic Attack)과 감각적인 싱잉랩 플로우',
      strengths: '드롭 직전의 킬링 파트나 훅에서 반전 매력과 엣지를 부여하는 독보적인 포인트 보컬',
      recommendedGenre: '시크한 2-Step Garage, 버블링 베이스 딥하우스 드롭, 클럽 믹스',
    },
    stylePromptDescriptor: 'dry velvety low-mid female vocals, upfront chic delivery, punchy close-mic attack, modern cool edge, Clear Korean Pronunciation',
    excludeStylesVocal: RESCENE_ANTI_ECHO_EXCLUDES,
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

/**
 * 리센느 가사 섹션별 멤버 파트 분배 및 보컬 연출 브래킷 태그 가이드
 * Suno에 가사를 입력할 때 섹션 헤더나 파트 시작점에 아래 브래킷 태그를 표기하여
 * 인공지능이 구간별 음색 전환 및 멤버별 캐릭터를 표현하도록 지시합니다.
 */
export interface MemberPartCue {
  memberId: string
  nameKo: string
  nameEn: string
  sectionRole: string
  lyricBracketTag: string
  vocalDirecting: string
}

export const RESCENE_PART_CUES: MemberPartCue[] = [
  {
    memberId: 'may',
    nameKo: '메이',
    nameEn: 'MAY',
    sectionRole: '도입 인트로 / 나직한 귓가 속삭임 / 아웃트로 잔향',
    lyricBracketTag: '[Verse 1: May - breathy intimate whisper close-mic]',
    vocalDirecting: '공기 반 소리 반의 귓가 속삭임, 에코 없이 귀에 밀착된 ASMR 브레시 보컬',
  },
  {
    memberId: 'woni',
    nameKo: '원이',
    nameEn: 'WONI',
    sectionRole: '벌스 전개 / 비트 그루브 & 산뜻한 텐션 메이킹',
    lyricBracketTag: '[Verse 1 (Cont.): Woni - punchy energetic upbeat delivery]',
    vocalDirecting: '비트에 달라붙는 밝고 경쾌한 리듬감, 산뜻하고 당당한 비타민 에너지',
  },
  {
    memberId: 'zena',
    nameKo: '제나',
    nameEn: 'ZENA',
    sectionRole: '프리코러스 빌드업 / 시크한 중저음 / 킬링 훅 포인트',
    lyricBracketTag: '[Pre-Chorus: Zena - chic velvety low-mid tone, tension build]',
    vocalDirecting: '벨벳처럼 감기는 트렌디 중저음, 쿨한 싱잉랩 플로우와 텐션 고조',
  },
  {
    memberId: 'all',
    nameKo: '완전체',
    nameEn: 'ALL',
    sectionRole: '후렴구 / 5인 에테리얼 하모니 레이어링',
    lyricBracketTag: '[Chorus: All - tight girl group harmonies, Minami & Liv powerful lead]',
    vocalDirecting: '풍성한 5인 화음 레이어링과 드라이하고 또렷한 센터 리드 멜로디',
  },
  {
    memberId: 'liv',
    nameKo: '리브',
    nameEn: 'LIV',
    sectionRole: '벌스 2 메인 전개 / 청아한 크리스탈톤 서사',
    lyricBracketTag: '[Verse 2: Liv - pure crystal-clear lead melody]',
    vocalDirecting: '유리구슬처럼 맑은 청아함, 곡의 감정선을 안정적으로 이끄는 실키한 보컬',
  },
  {
    memberId: 'minami',
    nameKo: '미나미',
    nameEn: 'MINAMI',
    sectionRole: '브릿지 클라이맥스 / 폭발적인 고음 벨팅 & 애드리브',
    lyricBracketTag: '[Bridge: Minami - soaring high-pitch belting climax]',
    vocalDirecting: '단단한 코어에서 뻗어나오는 시원하고 정확한 한국어 딕션의 고음 벨팅',
  },
]
