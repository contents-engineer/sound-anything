// lib/ai/mock.ts
import type { GenerationExtras, GenerationMode, GenerationResult, Selections, SongConcept, TrackRole } from '@/types'
import { INSTRUMENTAL_VOCAL_LABEL, VOCAL_STEM_USAGE_LABEL } from '@/lib/options'

export class MockProvider {
  name = 'mock'

  async generate(opts: Selections, mode: GenerationMode, extras?: GenerationExtras): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    void extras
    await new Promise((r) => setTimeout(r, 600))

    const summary = [
      opts.genre,
      opts.mood.join('/'),
      opts.vocal.join('/'),
      opts.bpm,
      opts.language,
    ].filter(Boolean).join(' · ') || '기본 옵션'

    const prompt = mode === 'prompt-only'
      ? `[MOCK STYLE PROMPT] Suno v6 playlist-ready song style, user-selected mood and arrangement, target duration about ${opts.lengthMin} minutes`
      : ''

    if (mode === 'prompt-only') {
      return { mode, prompt, songs: null }
    }

    const mockSection = (label: string, n: number) =>
      `[${label}]\nMOCK ${n} ${label} 첫번째 줄 자리\nMOCK ${n} ${label} 두번째 줄 자리\nMOCK ${n} ${label} 세번째 줄 자리\nMOCK ${n} ${label} 네번째 줄 자리`

    const mockLyrics = (n: number) => {
      const chorus = `[Chorus]\nMOCK ${n} 후렴 첫번째 줄 자리\nMOCK ${n} 후렴 두번째 줄 자리\nMOCK ${n} 후렴 세번째 줄 자리\nMOCK ${n} 후렴 네번째 줄 자리`
      return [
        '[Intro]',
        mockSection('Verse 1', n),
        chorus,
        mockSection('Verse 2', n),
        mockSection('Bridge', n),
        chorus,
        `[Outro]\nMOCK ${n} 아웃트로 첫번째 줄 자리\nMOCK ${n} 아웃트로 두번째 줄 자리`,
        '[End]',
      ].join('\n\n')
    }

    const instrumental = opts.vocal.includes(INSTRUMENTAL_VOCAL_LABEL)
    const stemMode = opts.usage === VOCAL_STEM_USAGE_LABEL && !instrumental

    // opener 1(1번째)·closer 1(10번째)·climax 1(7번째)·interlude 1·energy lift 3·depth 3
    const MOCK_ROLES: TrackRole[] = [
      'opener', 'depth', 'energy lift', 'interlude', 'depth',
      'energy lift', 'climax', 'depth', 'energy lift', 'closer',
    ]

    const songCount = mode === 'single' ? 1 : 10
    const songs: SongConcept[] = Array.from({ length: songCount }, (_, i) => {
      const isWild = !stemMode && (i === 3 || i === 7)
      return {
        title: `목업 트랙 ${i + 1}`,
        titles: {
          ko: `목업 트랙 ${i + 1}`,
          en: `Mock Track ${i + 1}`,
          ja: `モックトラック ${i + 1}`,
        },
        concept: `${summary} 분위기를 살린 ${opts.lengthMin}분짜리 트랙의 콘셉트 메모 ${i + 1}번. 실제 LLM 응답은 분위기·이미지·훅 아이디어를 두세 문장으로 묘사합니다.`,
        stylePrompt: instrumental
          ? `Mock ambient instrumental ${i + 1}, instrumental, no vocals, warm analog production`
          : stemMode
            ? `Mock stem-ready style ${i + 1}, 90-110 BPM, sparse arrangement, expressive vocals, dry vocals, no reverb`
            : `Mock playlist-ready style, distinct song concept ${i + 1}, cinematic hook, expressive vocal texture`,
        excludeStyles: instrumental
          ? ['vocals', 'singing', 'chanting', 'vocal samples']
          : stemMode
            ? ['reverb', 'background noise', 'low quality audio']
            : ['edm drops', 'distorted guitar', 'crowd noise'].slice(0, 2 + (i % 2)),
        sliderHint: {
          weirdness: stemMode ? '20-40%' : (isWild ? '60-80%' : '40-60%'),
          styleInfluence: stemMode ? '70-100%' : '50-70%',
          variety: stemMode ? 'Off' : (isWild ? 'Extra' : (i % 2 === 0 ? 'Off' : 'Normal')),
          maxMode: opts.lengthMin >= 3 || MOCK_ROLES[i] === 'climax' ? 'On' : 'Off',
          durationSliderNote: `${opts.lengthMin}분 (${opts.lengthMin * 60}초) 내외 설정 권장`,
          note: stemMode
            ? `목업 추천 ${i + 1}: Suno v6 플래그십 모델로 보컬 스템 분리를 위해 보수적 슬라이더와 프롬프트 원문을 보존하는 Variety Off, 고정밀 Max Mode를 적용한 설정입니다.`
            : isWild
              ? `목업 추천 ${i + 1}: Suno v6-wild 모델과 높은 Variety로 모험적이고 다채로운 사운드 탐색을 추천합니다.`
              : `목업 추천 ${i + 1}: Suno v6 기본 모델로 완성도와 균형 잡힌 스타일 변주(Variety)를 맞춘 추천입니다.`,
        },
        recommendedModel: isWild ? 'v6-wild' : 'v6',
        trackRole: mode === 'full' ? MOCK_ROLES[i] : null,
        lyrics: instrumental ? '[Instrumental]' : mockLyrics(i + 1),
      }
    })

    return { mode, prompt, songs }
  }
}
