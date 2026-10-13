// lib/suno-safe.ts
/**
 * Suno AI 가사 복사 시 보컬이 대괄호 안의 긴 영문 연출 지시문을
 * 가사로 읽어버리는 환각(Hallucination) 현상을 방지하기 위해,
 * 브래킷 태그를 Suno가 가장 안정적으로 인식하는 표준 규격으로 간소화합니다.
 */
export function convertToSunoSafeLyrics(lyrics: string): string {
  if (!lyrics) return ''

  return lyrics
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const inner = trimmed.slice(1, -1).trim()

        // 1. 단일 제어 태그 유지
        if (
          inner === 'Female Vocals' ||
          inner === 'Male Vocals' ||
          inner === 'Instrumental' ||
          inner === 'End' ||
          inner === 'Outro'
        ) {
          return line
        }

        // 2. 인트로 및 아웃트로 간소화
        if (inner.toLowerCase().startsWith('intro')) {
          return '[Intro]'
        }
        if (inner.toLowerCase().startsWith('outro')) {
          const colonIdx = inner.indexOf(':')
          if (colonIdx > 0) {
            const memberPart = inner.slice(colonIdx + 1).split('-')[0].trim()
            if (memberPart) return `[Outro - ${memberPart}]`
          }
          return '[Outro]'
        }

        // 3. 드롭 구간
        if (inner.toLowerCase().startsWith('drop')) {
          return '[Drop]'
        }

        // 4. [Section: Member - cue] 형태 처리
        // 예: "Verse 1: May - breathy intimate whisper close-mic" -> "[Verse 1 - May]"
        const colonIdx = inner.indexOf(':')
        if (colonIdx > 0) {
          const sectionPart = inner.slice(0, colonIdx).trim()
          const rest = inner.slice(colonIdx + 1).trim()

          // 대시(-) 이전의 멤버 파트 추출
          const dashIdx = rest.indexOf('-')
          let memberPart = dashIdx > 0 ? rest.slice(0, dashIdx).trim() : rest

          // 쉼표가 있으면 앞부분만
          const commaIdx = memberPart.indexOf(',')
          if (commaIdx > 0 && !memberPart.toLowerCase().includes('&')) {
            memberPart = memberPart.slice(0, commaIdx).trim()
          }

          if (memberPart) {
            return `[${sectionPart} - ${memberPart}]`
          }
          return `[${sectionPart}]`
        }

        // 5. 기타 대시가 있는 브래킷 처리
        const dashIdx = inner.indexOf('-')
        if (dashIdx > 0) {
          return `[${inner.slice(0, dashIdx).trim()}]`
        }
      }

      return line
    })
    .join('\n')
}
