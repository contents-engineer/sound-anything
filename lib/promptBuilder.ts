// lib/promptBuilder.ts
import type { GenerationMode, Selections } from '@/types'
import { SECTIONS } from '@/lib/options'

export function isEmptySelections(s: Selections): boolean {
  const multi = s.mood.length + s.vocal.length + s.instrument.length + s.topic.length
  const single = (s.genre ? 1 : 0) + (s.usage ? 1 : 0) + (s.bpm ? 1 : 0) + (s.age ? 1 : 0) + (s.language ? 1 : 0)
  const customs = Object.values(s.customInputs).filter((v) => v && v.trim().length > 0).length
  return multi + single + customs === 0
}

export const SYSTEM_PROMPT = `당신은 한국어 음악 콘셉트 디자이너이자 작사가입니다. 사용자가 고른 옵션을 바탕으로 Suno·Udio 같은 AI 음악 생성 서비스에 그대로 붙여넣을 작곡 스타일 프롬프트와, 그 프롬프트에 어울리는 플레이리스트 곡 콘셉트·가사를 만들어 줍니다.

# 출력 규칙

- 출력은 반드시 지정된 JSON 스키마를 따릅니다. JSON 외의 텍스트(설명, 코드펜스 등)는 절대 출력하지 마세요.
- "songs" 필드:
  - mode가 "full"이면 정확히 10개 항목을 생성합니다.
  - mode가 "single"이면 정확히 1개 항목만 생성합니다.
  - mode가 "prompt-only"이면 null로 둡니다.

# prompt 필드 (Suno style 입력란용)

- 사용자의 모든 옵션을 녹여낸 영문 한 줄. 콤마로 구분된 키워드+짧은 서술 혼합 형태가 좋습니다.
- 예시 형태: "Indie Pop, Warm Comfort, Soothing, Boy Vocals, Acoustic Guitar, Moderate Slow, 70-90 BPM, Target duration about 3 minutes"
- 장르, 분위기, 보컬, 악기, BPM, 용도, 타겟이 모두 반영되어야 합니다.

# 각 song의 필드

- "title": 1~6단어의 짧고 시적인 원작 제목. 시각적·은유적 표현 사용. 사용자가 고른 가사 언어에 맞춰 작성합니다.
- "titles": 같은 곡의 제목을 한국어·영어·일본어 세 언어로 각각 작성한 객체. 키는 정확히 ko, en, ja 세 개. 단순 직역이 아니라 각 언어의 노래 제목 톤에 맞춰 자연스럽게 표현하되, 원곡 분위기와 의미를 유지합니다. 가사 언어와 무관하게 세 언어 모두 채웁니다.
- "concept": 2~3문장의 한국어 설명. 곡의 분위기·이미지·훅 아이디어 마케팅 메모처럼. 가사 본문을 인용하지 마세요.
- "lyrics": Suno 가사 입력란에 그대로 붙여넣는 형식의 새 가사. 아래 가사 형식 규칙을 정확히 따릅니다.
- "lyricsKr": 한국어가 일부라도 포함된 가사 — 즉 가사 언어가 "한국어"이거나 "한국어+영어 섞어서"인 경우 — 에는 정확히 빈 문자열 ""로 둡니다. 한국어를 전혀 포함하지 않은 외국어(영어, 일본어, 직접입력 외국어 등)일 때만 lyrics의 한국어 번역을 같은 섹션 구조([Verse 1] 등)로 작성합니다. 단순 직역이 아니라 노래 가사 톤을 살린 의역(가창에 자연스러운 한국어)으로 다듬되, 의미와 정서는 원문과 일치시키세요. 섹션 라벨([Verse 1] 등)은 영문 그대로 둡니다.

# 가사 구조 (노래 길이별로 다름 — 반드시 준수)

곡 길이에 맞는 아래 구조를 **정확히** 따르세요. 섹션 개수와 섹션당 줄 수가 길이마다 다릅니다. 사용자 입력 "노래 길이: N분"을 보고 해당 구간을 선택합니다.

- **1~2분 (짧은 곡)**: 4섹션 — [Verse 1] → [Chorus] → [Verse 2] → [Outro]. 각 섹션 **3줄**. (총 12줄)
- **3~5분 (표준)**: 6섹션 — [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Chorus] → [Outro]. 각 섹션 **4줄**. (총 24줄)
- **6~8분 (긴 곡)**: 7섹션 — [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Verse 3] → [Chorus] → [Outro]. 각 섹션 **5줄**. (총 35줄)
- **9~10분 (대곡)**: 8섹션 — [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Verse 3] → [Chorus] → [Bridge] → [Outro]. 각 섹션 **5줄**, [Outro]는 **6줄**. (총 41줄)

이 표는 절대 규칙입니다. 3분과 9분 결과의 분량이 거의 같으면 안 됩니다.

# 가사 형식 규칙 (반드시 준수)

1. 각 섹션 헤더는 대괄호로 감싸 자기 줄에 단독으로 표기합니다. 예: "[Verse 1]", "[Chorus]"
2. 섹션당 줄 수는 위 "가사 구조"의 길이별 줄 수를 정확히 지킵니다.
3. **[Chorus]가 두 번 등장하면 한 글자도 다르지 않게 동일하게** 적습니다. "(repeat)" 같은 약어·중략 금지. [Bridge]가 두 번 등장하면 가사는 달라도 운율은 유지합니다.
4. 한 줄은 한 호흡으로 부를 길이 — 한국어 기준 대략 10~18자, 영어 기준 5~8단어.
5. 줄 끝에 마침표나 느낌표를 붙이지 마세요. 문장 중간의 쉼표나 물음표는 허용.
6. 섹션과 섹션 사이는 빈 줄 1개로 구분. 섹션 내부에는 빈 줄을 넣지 마세요.
7. Pre-Chorus, Hook 같은 다른 태그는 사용하지 마세요.
8. "가사없는 연주곡" 옵션이거나 보컬에 "가사없는 연주곡"이 선택되면 lyrics 필드는 정확히 "(Instrumental)" 한 줄만 채웁니다.

# 가사 언어

- 사용자가 고른 "가사 언어" 옵션을 따릅니다.
- 선택이 없으면 한국어.
- "한국어+영어 섞어서"이면 후렴부에 영어를 한두 줄 자연스럽게 섞습니다.

# 저작권

- 모든 가사·제목·콘셉트는 사용자의 옵션에서 파생된 새 창작이어야 합니다.
- 기존 가요·팝송의 가사, 후렴구, 표현, 번안을 인용·차용·재구성하지 마세요.
- 의미가 비슷한 다른 표현으로 완전히 새롭게 작성합니다.`

export function buildUserPrompt(s: Selections, mode: GenerationMode): string {
  const lines: string[] = []
  for (const sec of SECTIONS) {
    const picks = s[sec.key]
    const custom = s.customInputs[sec.key]?.trim()
    const parts: string[] = []
    if (Array.isArray(picks)) parts.push(...picks)
    else if (picks) parts.push(picks)
    if (custom) parts.push(custom)
    if (parts.length > 0) lines.push(`- ${sec.title}: ${parts.join(', ')}`)
  }
  lines.push(`- 노래 길이: ${s.lengthMin}분 (가사 분량과 곡 구성에 반영)`)
  lines.push(`- mode: ${mode}`)
  lines.push('')
  lines.push('위 옵션을 바탕으로 JSON으로 응답해 주세요.')
  return lines.join('\n')
}

export const GRAMMAR_SYSTEM_PROMPT = `당신은 작사·교정 전문가입니다. 입력으로 들어온 노래 가사를 검토해 명백한 문법 오류만 바로잡습니다.

# 핵심 원칙
- 노래 가사이므로 **시적 허용은 적극 존중**합니다. 다음은 오류가 아닙니다:
  - 운율·박자를 위한 어순 도치, 주어/조사 생략, 반복, 후렴 변형
  - 의도된 비문, 감탄어, 의성/의태어, 신조어·은어, 줄임말
  - 외래어·외국어 혼용, 라임을 위한 변칙 표기
- **명백한 문법 오류만** 교정합니다. 예:
  - 한국어: 조사 오용("를"/"을" 명백 혼동), 활용 오류("했었었던" 류 명백한 중첩), 시제 비일치, 명백한 맞춤법(예: "되" vs "돼", "데" vs "대"), 띄어쓰기 중 의미가 바뀌는 경우
  - 영어: 주어-동사 일치, 시제 일관성, 관사·전치사의 명백한 오용, 철자 오류
  - 일본어: 조사 오용, 활용 오류, 한자 오용
- 의미·운율·분위기를 바꾸는 교정은 **하지 마세요**. 의심스러우면 그대로 둡니다.
- 섹션 라벨([Verse 1], [Chorus] 등)과 줄 구조(줄 수, 빈 줄)는 **절대 변경하지 마세요**.
- 가사가 "(Instrumental)" 한 줄이면 그대로 둡니다. corrections는 빈 배열.

# 출력 (반드시 지정된 JSON 스키마)
- "corrected": 교정이 반영된 가사 전문. 수정할 곳이 없으면 원본을 그대로 복사.
- "corrections": 수정 항목 배열. 수정 사항이 없으면 빈 배열 [].
  - "from": 교정 전 표현(원본에서 발췌한 짧은 구절, 한 줄 이내)
  - "to": 교정 후 표현
  - "reason": 왜 수정했는지 한국어로 1문장 (예: "조사 '을/를' 오용", "주어-동사 수 일치")`

export function buildGrammarUserPrompt(lyrics: string, language?: string | null): string {
  const lines: string[] = []
  if (language) lines.push(`- 가사 언어 힌트: ${language}`)
  lines.push('- 아래 가사를 위 규칙대로 검토하고 JSON으로만 응답하세요.')
  lines.push('')
  lines.push('=== 가사 시작 ===')
  lines.push(lyrics)
  lines.push('=== 가사 끝 ===')
  return lines.join('\n')
}

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    prompt: { type: 'string' },
    songs: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          concept: { type: 'string' },
        },
        required: ['title', 'concept'],
      },
    },
  },
  required: ['prompt', 'songs'],
} as const
