// lib/suno-safe.ts
/**
 * Suno AI 가사 복사 시 보컬이 대괄호 안의 긴 영문 연출 지시문을
 * 가사로 읽어버리는 환각(Hallucination) 현상을 방지하기 위해,
 * 브래킷 태그를 Suno가 가장 안정적으로 인식하는 표준 규격으로 간소화합니다.
 */
const RESCENE_MEMBERS_LOWER = ['minami', 'liv', 'woni', 'may', 'zena', 'all', '미나미', '리브', '원이', '메이', '제나', '완전체']

const RESCENE_DEFAULT_VOICE_CUES: Record<string, string> = {
  liv: 'Liv: crystal-clear high tone',
  minami: 'Minami: powerful clear belt',
  zena: 'Zena: chic velvety low-mid',
  may: 'May: breathy intimate whisper',
  woni: 'Woni: bright punchy delivery',
  리브: 'Liv: crystal-clear high tone',
  미나미: 'Minami: powerful clear belt',
  제나: 'Zena: chic velvety low-mid',
  메이: 'May: breathy intimate whisper',
  원이: 'Woni: bright punchy delivery',
}

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

  // 3. 멤버별 실전 보이스 디렉팅 태그 ([Member: Voice Cue]) 보존 및 표준화
  for (const m of RESCENE_MEMBERS_LOWER) {
    if (m === 'all' || m === '완전체') continue

    // 멤버 단독 표기인 경우 -> 실제 Suno 보이스가 발현되도록 표준 보이스 큐 부여
    if (lower === m) {
      return RESCENE_DEFAULT_VOICE_CUES[m] || trimmed
    }

    // [Member: cue] 또는 [Member - cue] 형태인 경우
    if (lower.startsWith(`${m}:`) || lower.startsWith(`${m} -`)) {
      const matched = trimmed.match(new RegExp(`^(${m})([: -]+)(.*)`, 'i'))
      if (matched) {
        const memberKey = matched[1].toLowerCase()
        const rawCue = matched[3].trim()

        // 쉼표나 긴 부가 설명은 1차 정제
        const cleanCue = rawCue.split(',')[0].trim()
        // 35자 이내의 간결한 영문 음향 디스크립터면 보존, 너무 길면 표준 큐로 치환
        if (cleanCue.length > 0 && cleanCue.length <= 35) {
          const capName = memberKey === 'minami' ? 'Minami' :
                          memberKey === 'liv' ? 'Liv' :
                          memberKey === 'zena' ? 'Zena' :
                          memberKey === 'may' ? 'May' :
                          memberKey === 'woni' ? 'Woni' : matched[1]
          return `${capName}: ${cleanCue}`
        }
        return RESCENE_DEFAULT_VOICE_CUES[memberKey] || trimmed
      }
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

    // 멤버 지정이 아닌 일반 편곡 디스크립터([Chorus: uplifting 2-step...] 등)는 순수 섹션명만 반환
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
