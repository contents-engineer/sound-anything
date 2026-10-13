// lib/suno-safe.ts
/**
 * Suno AI 가사 복사 시 보컬이 대괄호 안의 긴 영문 연출 지시문을
 * 가사로 읽어버리는 환각(Hallucination) 현상을 방지하기 위해,
 * 브래킷 태그를 Suno가 가장 안정적으로 인식하는 표준 규격으로 간소화합니다.
 */
const RESCENE_MEMBERS_LOWER = ['minami', 'liv', 'woni', 'may', 'zena', 'all', '미나미', '리브', '원이', '메이', '제나', '완전체']

function cleanBracketContent(inner: string): string {
  const trimmed = inner.trim()
  const lower = trimmed.toLowerCase()

  // 1. 단일 제어 태그 유지
  if (
    trimmed === 'Female Vocals' ||
    trimmed === 'Male Vocals' ||
    trimmed === 'Instrumental' ||
    trimmed === 'End' ||
    trimmed === 'Outro' ||
    trimmed === 'Chorus' ||
    trimmed === 'Pre-Chorus' ||
    trimmed === 'Post-Chorus' ||
    trimmed === 'Bridge'
  ) {
    return trimmed
  }

  // 2. 인트로 및 드롭 간소화
  if (lower.startsWith('intro')) return 'Intro'
  if (lower.startsWith('drop')) return 'Drop'

  // 3. 멤버 단독 및 멤버 큐 간소화 ([Minami: high belting] or [Minami - cue] -> [Minami])
  for (const m of RESCENE_MEMBERS_LOWER) {
    if (lower === m) return trimmed
    if (lower.startsWith(`${m}:`) || lower.startsWith(`${m} -`) || lower.startsWith(`${m},`)) {
      // 멤버 이름 대소문자 보존
      const matched = trimmed.match(new RegExp(`^(${m})`, 'i'))
      return matched ? matched[1] : trimmed
    }
  }

  // 4. [Section: Member - cue] 형태 처리
  // 예: "Verse 1: May - breathy intimate whisper close-mic" -> "Verse 1 - May"
  // 예: "Chorus: All - tight harmonies" -> "Chorus - All"
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx > 0) {
    const sectionPart = trimmed.slice(0, colonIdx).trim()
    const rest = trimmed.slice(colonIdx + 1).trim()
    const restLower = rest.toLowerCase()

    // rest가 멤버로 시작하는지 확인
    for (const m of RESCENE_MEMBERS_LOWER) {
      if (restLower.startsWith(m)) {
        const matched = rest.match(new RegExp(`^(${m})`, 'i'))
        const memberName = matched ? matched[1] : m
        return `${sectionPart} - ${memberName}`
      }
    }

    // 대시(-) 이전의 멤버 파트 추출 (단, rest 자체가 Pre-Chorus 등인 경우는 없음)
    const dashIdx = rest.indexOf('-')
    let memberPart = dashIdx > 0 ? rest.slice(0, dashIdx).trim() : rest

    // 쉼표가 있으면 앞부분만
    const commaIdx = memberPart.indexOf(',')
    if (commaIdx > 0 && !memberPart.toLowerCase().includes('&')) {
      memberPart = memberPart.slice(0, commaIdx).trim()
    }

    // 만약 memberPart가 너무 긴 디스크립터라면 섹션만 남김
    if (memberPart.length > 20) {
      return sectionPart
    }

    if (memberPart) {
      return `${sectionPart} - ${memberPart}`
    }
    return sectionPart
  }

  // 5. Pre-Chorus / Post-Chorus 처리 (단어 자체의 하이픈 보존)
  if (lower.startsWith('pre-chorus') || lower.startsWith('post-chorus')) {
    // "Pre-Chorus - cue" 처럼 뒤에 추가 대시가 있는 경우
    const secondDash = trimmed.indexOf('-', 5)
    if (secondDash > 0) {
      return trimmed.slice(0, secondDash).trim()
    }
    return trimmed
  }

  // 6. 기타 대시가 있는 브래킷 처리 (예: [Outro - fade out] -> [Outro])
  const dashIdx = trimmed.indexOf('-')
  if (dashIdx > 0) {
    return trimmed.slice(0, dashIdx).trim()
  }

  return trimmed
}

export function convertToSunoSafeLyrics(lyrics: string): string {
  if (!lyrics) return ''

  return lyrics
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()

      // 1. 줄 전체가 브래킷인 경우 ([Section] 또는 [Member])
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim()
        return `[${cleanBracketContent(inner)}]`
      }

      // 2. 줄 처음에 [Member: cue] 가사 가사... 형태로 인라인 브래킷이 붙은 경우
      if (trimmed.startsWith('[')) {
        const closeIdx = trimmed.indexOf(']')
        if (closeIdx > 0) {
          const inner = trimmed.slice(1, closeIdx).trim()
          const after = trimmed.slice(closeIdx + 1)
          return `[${cleanBracketContent(inner)}]${after}`
        }
      }

      return line
    })
    .join('\n')
}
