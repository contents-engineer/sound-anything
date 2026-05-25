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

    const songs: SongConcept[] = Array.from({ length: 10 }, (_, i) => ({
      title: `목업 트랙 ${i + 1}`,
      concept: `${summary} 분위기를 살린 ${opts.lengthMin}분짜리 트랙의 콘셉트 메모 ${i + 1}번. 실제 LLM 응답은 분위기·이미지·훅 아이디어를 두세 문장으로 묘사합니다.`,
    }))

    return { mode, prompt, songs }
  }
}
