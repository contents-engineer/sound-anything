// lib/ai/mock.ts
import type { GenerationMode, GenerationResult, Selections, SongConcept } from '@/types'

export class MockProvider {
  name = 'mock'

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    await new Promise((r) => setTimeout(r, 600))

    const summary = [
      opts.genre.join('/'),
      opts.mood.join('/'),
      opts.vocal.join('/'),
      opts.bpm,
      opts.language,
    ].filter(Boolean).join(' · ') || '기본 옵션'

    const prompt = `[MOCK PROMPT] ${summary} | 길이 ${opts.lengthMin}분. 사용자의 모든 옵션을 자연스럽게 녹여낸 영문 음악 생성 프롬프트가 들어갈 자리입니다.`

    if (mode === 'prompt-only') {
      return { mode, prompt, songs: null }
    }

    const mockSection = (label: string, n: number) =>
      `[${label}]\nMOCK ${n} ${label} 첫번째 줄 자리\nMOCK ${n} ${label} 두번째 줄 자리\nMOCK ${n} ${label} 세번째 줄 자리\nMOCK ${n} ${label} 네번째 줄 자리`

    const mockLyrics = (n: number) => {
      const chorus = `[Chorus]\nMOCK ${n} 후렴 첫번째 줄 자리\nMOCK ${n} 후렴 두번째 줄 자리\nMOCK ${n} 후렴 세번째 줄 자리\nMOCK ${n} 후렴 네번째 줄 자리`
      return [
        mockSection('Verse 1', n),
        chorus,
        mockSection('Verse 2', n),
        mockSection('Bridge', n),
        chorus,
        mockSection('Outro', n),
      ].join('\n\n')
    }

    const needsKrTranslation =
      opts.language !== null &&
      opts.language !== '한국어' &&
      opts.language !== '한국어+영어 섞어서'

    const mockSectionKr = (label: string, n: number) =>
      `[${label}]\nMOCK ${n} ${label} 번역 첫번째 줄\nMOCK ${n} ${label} 번역 두번째 줄\nMOCK ${n} ${label} 번역 세번째 줄\nMOCK ${n} ${label} 번역 네번째 줄`

    const mockLyricsKr = (n: number) => {
      const chorus = `[Chorus]\nMOCK ${n} 후렴 번역 첫번째 줄\nMOCK ${n} 후렴 번역 두번째 줄\nMOCK ${n} 후렴 번역 세번째 줄\nMOCK ${n} 후렴 번역 네번째 줄`
      return [
        mockSectionKr('Verse 1', n),
        chorus,
        mockSectionKr('Verse 2', n),
        mockSectionKr('Bridge', n),
        chorus,
        mockSectionKr('Outro', n),
      ].join('\n\n')
    }

    const songCount = mode === 'single' ? 1 : 10
    const songs: SongConcept[] = Array.from({ length: songCount }, (_, i) => ({
      title: `목업 트랙 ${i + 1}`,
      titles: {
        ko: `목업 트랙 ${i + 1}`,
        en: `Mock Track ${i + 1}`,
        ja: `モックトラック ${i + 1}`,
      },
      concept: `${summary} 분위기를 살린 ${opts.lengthMin}분짜리 트랙의 콘셉트 메모 ${i + 1}번. 실제 LLM 응답은 분위기·이미지·훅 아이디어를 두세 문장으로 묘사합니다.`,
      lyrics: mockLyrics(i + 1),
      lyricsKr: needsKrTranslation ? mockLyricsKr(i + 1) : '',
    }))

    return { mode, prompt, songs }
  }
}
