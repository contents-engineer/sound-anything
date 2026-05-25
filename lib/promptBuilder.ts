// lib/promptBuilder.ts
import type { GenerationMode, Selections } from '@/types'
import { SECTIONS } from '@/lib/options'

export function isEmptySelections(s: Selections): boolean {
  const multi = s.genre.length + s.mood.length + s.vocal.length + s.usage.length + s.instrument.length + s.topic.length
  const single = (s.bpm ? 1 : 0) + (s.age ? 1 : 0) + (s.language ? 1 : 0)
  const customs = Object.values(s.customInputs).filter((v) => v && v.trim().length > 0).length
  return multi + single + customs === 0
}

export const SYSTEM_PROMPT = `당신은 한국어 음악 콘셉트 디자이너입니다. 사용자가 고른 옵션을 바탕으로 Suno·Udio 같은 AI 음악 생성 서비스에 입력할 작곡 프롬프트와, 그 프롬프트로 만들 수 있는 플레이리스트 곡 콘셉트들을 만들어 줍니다.

규칙:
- 출력은 반드시 지정된 JSON 스키마를 따릅니다.
- "prompt" 필드: 사용자의 모든 옵션을 자연스럽게 녹여낸 영문 음악 생성 프롬프트 한 단락. 장르, 분위기, 보컬, 악기, BPM, 언어, 용도, 타겟이 모두 반영되어야 합니다.
- "songs" 필드:
  - mode가 "full"이면 정확히 10개 항목을 생성합니다.
  - mode가 "prompt-only"이면 null로 둡니다.
- 각 song의 "title"은 1~5단어의 짧고 독창적인 제목입니다.
- 각 song의 "concept"은 2~3문장의 한국어 설명으로, 곡의 분위기·이미지·훅 아이디어를 묘사합니다. 가사 본문(절·후렴 등)을 그대로 적지 마세요. 어디까지나 콘셉트 메모입니다.
- 모든 콘텐츠는 사용자의 옵션에서 파생된 새로운 창작이며, 기존 곡의 가사나 구절을 인용하지 마세요.
- JSON 외의 텍스트(설명, 코드펜스 등)는 절대 출력하지 마세요.`

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
