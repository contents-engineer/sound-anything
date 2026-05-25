# Playlist Music Creator Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js 15 clone of the TubeMaster "플레이리스트 음악 만들기" page that takes 10 categories of user selections and uses a swappable LLM provider to produce a composite music-generation prompt plus 10 original song concepts (title + brief mood/imagery summary — not lyric text).

**Architecture:** Next.js 15 App Router. UI state lives in a single React state object on `app/page.tsx`. All LLM calls go through a server-side API route (`app/api/generate/route.ts`) that picks one of four providers (`openai`, `anthropic`, `gemini`, `mock`) via the `AI_PROVIDER` env var. A `MockProvider` returns deterministic data so the UI can be built and verified before any real API key is configured.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind v4, React 19, `openai` / `@anthropic-ai/sdk` / `@google/genai` SDKs.

**Spec reference:** `docs/superpowers/specs/2026-05-25-playlist-music-creator-clone-design.md`

**Testing policy (from spec §12):** No automated unit tests in MVP — explicit YAGNI decision. Each task includes a manual verification step using the dev server + the `mock` provider.

---

### Task 1: Initialize Next.js project and git repo

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore` (all via scaffolding)
- Create: `.gitattributes` (none needed initially — scaffold defaults are fine)

- [ ] **Step 1: Scaffold Next.js app in current directory**

Run (note the trailing `.` to install into the existing empty directory):

```bash
cd /Users/yeonhokim/jadenspace/sound-anything
npx --yes create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir false \
  --import-alias "@/*" \
  --use-npm \
  --turbopack \
  --skip-install false \
  --yes
```

Expected: project scaffolded with `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, Tailwind config. `docs/` directory is preserved.

- [ ] **Step 2: Verify project boots**

```bash
npm run dev
```

In another shell: `curl -sI http://localhost:3000 | head -1` → expect `HTTP/1.1 200 OK`. Stop the dev server with Ctrl-C.

- [ ] **Step 3: Initialize git and ignore env files**

```bash
cd /Users/yeonhokim/jadenspace/sound-anything
git init
```

Append to `.gitignore` (create entry if missing):

```
# local env
.env*.local
.env
```

`create-next-app` already adds `.env*` entries — double-check with `grep -n env .gitignore`. If the line `.env*` exists, that already covers `.env` and `.env.local`. Leave it.

- [ ] **Step 4: Install AI provider SDKs**

```bash
npm install openai @anthropic-ai/sdk @google/genai
```

- [ ] **Step 5: First commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 app with TypeScript and Tailwind"
```

---

### Task 2: Define core types

**Files:**
- Create: `types.ts`

- [ ] **Step 1: Create `types.ts`**

```ts
// types.ts
export type GenerationMode = 'prompt-only' | 'full'

export type SectionKey =
  | 'genre'
  | 'mood'
  | 'vocal'
  | 'usage'
  | 'instrument'
  | 'bpm'
  | 'age'
  | 'language'
  | 'topic'

export type Selections = {
  genre: string[]
  mood: string[]
  vocal: string[]
  usage: string[]
  instrument: string[]
  bpm: string | null
  age: string | null
  language: string | null
  topic: string[]
  lengthMin: number
  customInputs: Partial<Record<SectionKey, string>>
}

export type SongConcept = {
  title: string
  concept: string
}

export type GenerationResult = {
  mode: GenerationMode
  prompt: string
  songs: SongConcept[] | null
  generatedAt: string
  provider: string
}

export type ApiError = {
  error: { code: 'EMPTY_SELECTION' | 'MISSING_API_KEY' | 'LLM_ERROR' | 'INVALID_RESPONSE'; message: string }
}

export type ApiRequest = {
  selections: Selections
  mode: GenerationMode
}
```

- [ ] **Step 2: Type-check passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: add core types for selections and generation result"
```

---

### Task 3: Static preset data

**Files:**
- Create: `lib/options.ts`

- [ ] **Step 1: Create `lib/options.ts`**

This is the single source of truth for every preset button on every section. Copied from the TubeMaster page snapshot.

```ts
// lib/options.ts
import type { SectionKey } from '@/types'

export type Preset = { emoji: string; label: string }

export type SectionMeta = {
  key: SectionKey
  number: number
  emoji: string
  title: string
  subtitle: string
  placeholder: string
  multi: boolean
  presets: Preset[]
}

export const GENRES: Preset[] = [
  { emoji: '🎹', label: '시티팝(City Pop)' },
  { emoji: '🎧', label: '로파이(Lo-fi)' },
  { emoji: '🌊', label: '칠웨이브' },
  { emoji: '🎸', label: 'K-록' },
  { emoji: '👥', label: '합창/중창' },
  { emoji: '🧘', label: '명상/치유' },
  { emoji: '✝️', label: 'CCM/찬양' },
  { emoji: '💫', label: 'K-pop' },
  { emoji: '💔', label: '발라드' },
  { emoji: '🎺', label: '재즈' },
  { emoji: '🎤', label: '팝' },
  { emoji: '🎵', label: '힙합' },
  { emoji: '🌌', label: '뉴에이지' },
  { emoji: '🌫️', label: '앰비언트' },
  { emoji: '🎶', label: '트로트' },
  { emoji: '🎷', label: '블루스' },
  { emoji: '🤠', label: '컨트리' },
  { emoji: '🪕', label: '포크' },
  { emoji: '🏝️', label: '레게' },
  { emoji: '✨', label: '디스코' },
  { emoji: '🎸', label: '록' },
  { emoji: '🔊', label: '전자음악' },
  { emoji: '🎼', label: 'R&B' },
  { emoji: '🎹', label: '소울' },
  { emoji: '🎛️', label: '신스팝' },
  { emoji: '☁️', label: '드림 팝' },
  { emoji: '🎨', label: '인디팝' },
  { emoji: '🙏', label: '가스펠' },
  { emoji: '🎺', label: '스윙' },
  { emoji: '💃', label: '라틴' },
  { emoji: '🎵', label: '이지리스닝' },
  { emoji: '👶', label: '자장가' },
  { emoji: '🧸', label: '동요' },
  { emoji: '🎄', label: '캐롤' },
]

export const MOODS: Preset[] = [
  { emoji: '🌙', label: '잔잔한 (고요한)' },
  { emoji: '😢', label: '깊은 슬픔' },
  { emoji: '🌃', label: '우울한 새벽' },
  { emoji: '🙏', label: '경건하고 은혜로운' },
  { emoji: '🤗', label: '따스한 위로' },
  { emoji: '☮️', label: '순수한 평화' },
  { emoji: '☁️', label: '포근한 구름' },
  { emoji: '⚡', label: '에너지 폭발' },
  { emoji: '💕', label: '로맨틱 감성' },
  { emoji: '🌅', label: '일몰같은' },
  { emoji: '🌌', label: '우주 같은' },
  { emoji: '🖤', label: '다크하고 강렬' },
  { emoji: '🍃', label: '시원한 바람' },
  { emoji: '🚗', label: '강력한 드라이브' },
  { emoji: '💪', label: '도전적인' },
  { emoji: '🏔️', label: '웅장한 대서사시' },
  { emoji: '🥰', label: '귀여운' },
]

export const VOCALS: Preset[] = [
  { emoji: '👶', label: '어린이 합창단' },
  { emoji: '👥', label: '어른 합창단' },
  { emoji: '👩', label: '맑고 깨끗한 여성 보컬' },
  { emoji: '✨', label: '에테리얼 여성 보컬' },
  { emoji: '💕', label: '로맨틱 여성 보컬' },
  { emoji: '🎙️', label: '허스키 남성 보컬' },
  { emoji: '👦', label: '소년 보컬' },
  { emoji: '👧', label: '맑은 소녀 보컬' },
  { emoji: '🔥', label: '열정적인 남성 보컬' },
  { emoji: '🎵', label: '남녀 코러스 합창' },
  { emoji: '🤖', label: '보코더 효과' },
  { emoji: '🤫', label: '속삭이는 여성' },
  { emoji: '🎤', label: '랩 (남성)' },
  { emoji: '🎤', label: '랩 (여성)' },
  { emoji: '🎭', label: '오페라틱 (남성)' },
  { emoji: '🎭', label: '오페라틱 (여성)' },
  { emoji: '🌬️', label: '공기반 사운드반' },
  { emoji: '🎼', label: '가사없는 연주곡' },
]

export const USAGES: Preset[] = [
  { emoji: '📹', label: '유튜브 브이로그 BGM' },
  { emoji: '🎮', label: '게임 방송 배경음' },
  { emoji: '📚', label: '공부/집중력 향상' },
  { emoji: '💪', label: '운동/피트니스' },
  { emoji: '😴', label: '숙면/명상' },
  { emoji: '☕', label: '카페 분위기' },
  { emoji: '📱', label: '감성 쇼츠/틱톡' },
  { emoji: '⛪', label: '교회 예배/묵상' },
]

export const INSTRUMENTS: Preset[] = [
  { emoji: '🎹', label: '그랜드 피아노' },
  { emoji: '🎸', label: '어쿠스틱 기타' },
  { emoji: '⚡', label: '일렉 기타' },
  { emoji: '🎵', label: '오르골' },
  { emoji: '🎷', label: '색소폰' },
  { emoji: '🎻', label: '바이올린' },
  { emoji: '🎻', label: '첼로' },
  { emoji: '🔔', label: '싱잉볼' },
  { emoji: '🎛️', label: '신디사이저' },
]

export const BPMS: Preset[] = [
  { emoji: '😴', label: '초저속 (40-50 BPM)' },
  { emoji: '🌙', label: '매우 느림 (50-70 BPM)' },
  { emoji: '🧘', label: '느림 (70-90 BPM)' },
  { emoji: '🚶', label: '보통 (90-110 BPM)' },
  { emoji: '😊', label: '약간 빠름 (110-130 BPM)' },
  { emoji: '🏃', label: '빠름 (130-150 BPM)' },
  { emoji: '💪', label: '매우 빠름 (150-170 BPM)' },
  { emoji: '⚡', label: '초고속 (170+ BPM)' },
]

export const AGES: Preset[] = [
  { emoji: '👶', label: '유아 (0-7세)' },
  { emoji: '🎒', label: '10대 (청소년)' },
  { emoji: '💼', label: '20대 (청춘)' },
  { emoji: '👔', label: '30-40대 (직장인/부모)' },
  { emoji: '🎩', label: '50-60대 (시니어)' },
  { emoji: '🌍', label: '전 연령대' },
]

export const LANGUAGES: Preset[] = [
  { emoji: '🇰🇷', label: '한국어' },
  { emoji: '🇺🇸', label: '영어' },
  { emoji: '🌏', label: '한국어+영어 섞어서' },
]

export const TOPICS: Preset[] = [
  { emoji: '💕', label: '첫사랑' },
  { emoji: '👶', label: '자장가' },
  { emoji: '🌅', label: '새벽 묵상' },
  { emoji: '💔', label: '이별의 아픔' },
  { emoji: '🤝', label: '재회' },
  { emoji: '😊', label: '짝사랑' },
  { emoji: '💪', label: '자기 사랑' },
  { emoji: '🔥', label: '용기' },
  { emoji: '✨', label: '갓생' },
  { emoji: '👤', label: '주체적 나' },
  { emoji: '🎯', label: '실패와 극복' },
  { emoji: '💎', label: '자신감 회복' },
  { emoji: '🏠', label: '향수' },
  { emoji: '🌧️', label: '비 오는 날' },
  { emoji: '✈️', label: '여행' },
  { emoji: '🙏', label: '감사와 기도' },
  { emoji: '🎼', label: '가사없는(연주곡)' },
  { emoji: '🎄', label: '크리스마스' },
]

export const SECTIONS: SectionMeta[] = [
  { key: 'genre',      number: 1, emoji: '🎸', title: '장르 선택',        subtitle: '음악의 색깔',     placeholder: '원하는 장르를 직접 입력하세요',          multi: true,  presets: GENRES },
  { key: 'mood',       number: 2, emoji: '✨', title: '분위기 및 감성',    subtitle: '감정의 깊이',     placeholder: '원하는 분위기를 직접 입력하세요',        multi: true,  presets: MOODS },
  { key: 'vocal',      number: 3, emoji: '🎤', title: '보컬 및 창법',      subtitle: '목소리의 질감',   placeholder: '원하는 보컬 스타일을 직접 입력하세요',   multi: true,  presets: VOCALS },
  { key: 'usage',      number: 4, emoji: '🎬', title: '사용 용도',         subtitle: '공간의 울림',     placeholder: '사용 용도를 직접 입력하세요',            multi: true,  presets: USAGES },
  { key: 'instrument', number: 5, emoji: '🎹', title: '주요 악기',         subtitle: '소리의 도구',     placeholder: '원하는 악기를 직접 입력하세요',          multi: true,  presets: INSTRUMENTS },
  { key: 'bpm',        number: 6, emoji: '⚡', title: '속도 (BPM)',        subtitle: '리듬의 맥박',     placeholder: '원하는 BPM을 직접 입력하세요',           multi: false, presets: BPMS },
  { key: 'age',        number: 7, emoji: '👥', title: '타겟 연령대',       subtitle: '청중의 공감',     placeholder: '타겟 연령대를 직접 입력하세요',          multi: false, presets: AGES },
  { key: 'language',   number: 8, emoji: '🌐', title: '가사 언어',         subtitle: '글로벌 소통',     placeholder: '원하는 언어를 직접 입력하세요',          multi: false, presets: LANGUAGES },
  { key: 'topic',      number: 9, emoji: '📝', title: '가사 주제 및 요청', subtitle: '창작의 핵심',     placeholder: '원하는 가사 주제나 요청사항을 자유롭게 입력하세요', multi: true, presets: TOPICS },
]
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/options.ts
git commit -m "feat: add static preset data for all 10 option sections"
```

---

### Task 4: Prompt builder

**Files:**
- Create: `lib/promptBuilder.ts`

- [ ] **Step 1: Create `lib/promptBuilder.ts`**

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/promptBuilder.ts
git commit -m "feat: add system + user prompt builder and response schema"
```

---

### Task 5: Mock provider + provider entry

**Files:**
- Create: `lib/ai/provider.ts`
- Create: `lib/ai/mock.ts`

- [ ] **Step 1: Create `lib/ai/mock.ts`**

```ts
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
```

- [ ] **Step 2: Create `lib/ai/provider.ts`**

```ts
// lib/ai/provider.ts
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { MockProvider } from '@/lib/ai/mock'

export interface AIProvider {
  name: string
  generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>>
}

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? 'mock').toLowerCase()
  switch (name) {
    case 'mock':
      return new MockProvider()
    case 'openai':
    case 'anthropic':
    case 'gemini':
      throw new Error(`Provider "${name}" is not yet implemented. Run with AI_PROVIDER=mock for now.`)
    default:
      throw new Error(`Unknown AI_PROVIDER: ${name}`)
  }
}
```

(Real providers added in Tasks 13–15. The plan stays runnable end-to-end until then by defaulting to `mock`.)

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/ai
git commit -m "feat: add provider abstraction with mock implementation"
```

---

### Task 6: `/api/generate` route

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/generate/route.ts
import { NextResponse } from 'next/server'
import type { ApiError, ApiRequest, GenerationResult } from '@/types'
import { getProvider } from '@/lib/ai/provider'
import { isEmptySelections } from '@/lib/promptBuilder'

export const runtime = 'nodejs'

function err(code: ApiError['error']['code'], message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status })
}

export async function POST(req: Request) {
  let body: ApiRequest
  try {
    body = (await req.json()) as ApiRequest
  } catch {
    return err('LLM_ERROR', 'Invalid JSON body', 400)
  }

  if (!body?.selections || !body?.mode) return err('LLM_ERROR', 'selections and mode are required', 400)
  if (isEmptySelections(body.selections)) return err('EMPTY_SELECTION', '최소 1개 옵션을 선택해주세요', 400)

  let provider
  try {
    provider = getProvider()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown provider error'
    return err('MISSING_API_KEY', message, 500)
  }

  try {
    const partial = await provider.generate(body.selections, body.mode)
    const result: GenerationResult = {
      ...partial,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM error'
    return err('LLM_ERROR', message, 502)
  }
}
```

- [ ] **Step 2: Verify the route with curl + mock provider**

Start the dev server in one shell:

```bash
AI_PROVIDER=mock npm run dev
```

In another shell:

```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"selections":{"genre":["K-pop"],"mood":[],"vocal":[],"usage":[],"instrument":[],"bpm":null,"age":null,"language":null,"topic":[],"lengthMin":3,"customInputs":{}},"mode":"full"}' | head -c 400
```

Expected: JSON containing `"provider":"mock"`, `"mode":"full"`, a `prompt` string starting with `[MOCK PROMPT]`, and a `songs` array of 10 items. Then verify the empty-selection guard:

```bash
curl -s -X POST http://localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"selections":{"genre":[],"mood":[],"vocal":[],"usage":[],"instrument":[],"bpm":null,"age":null,"language":null,"topic":[],"lengthMin":3,"customInputs":{}},"mode":"full"}'
```

Expected: `{"error":{"code":"EMPTY_SELECTION","message":"최소 1개 옵션을 선택해주세요"}}`. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add app/api
git commit -m "feat: add /api/generate route with mock provider end-to-end"
```

---

### Task 7: `OptionButton` component

**Files:**
- Create: `components/OptionButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/OptionButton.tsx
'use client'

type Props = {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}

export function OptionButton({ emoji, label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected}
      className={[
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
        'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400',
        'data-[selected=true]:border-violet-500 data-[selected=true]:bg-violet-500 data-[selected=true]:text-white',
      ].join(' ')}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/OptionButton.tsx
git commit -m "feat: add OptionButton with selected variant"
```

---

### Task 8: `OptionSection` component

**Files:**
- Create: `components/OptionSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/OptionSection.tsx
'use client'

import { OptionButton } from '@/components/OptionButton'
import type { Preset } from '@/lib/options'

type Props = {
  number: number
  emoji: string
  title: string
  subtitle: string
  presets: Preset[]
  selected: string[] | string | null
  onToggle: (label: string) => void
  multi: boolean
  customInput: string | undefined
  onCustomChange: (value: string) => void
  placeholder: string
}

export function OptionSection({
  number, emoji, title, subtitle, presets, selected, onToggle, multi, customInput, onCustomChange, placeholder,
}: Props) {
  const isSelected = (label: string) => {
    if (Array.isArray(selected)) return selected.includes(label)
    return selected === label
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold text-zinc-900">
          <span>{emoji}</span>
          <span>{number}. {title}</span>
          <span className="text-sm font-normal text-zinc-500">({subtitle})</span>
          {!multi && <span className="ml-auto text-xs text-zinc-500">단일 선택</span>}
        </h2>
      </header>
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <OptionButton
            key={`${p.label}-${i}`}
            emoji={p.emoji}
            label={p.label}
            selected={isSelected(p.label)}
            onClick={() => onToggle(p.label)}
          />
        ))}
      </div>
      <input
        type="text"
        value={customInput ?? ''}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none"
      />
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/OptionSection.tsx
git commit -m "feat: add OptionSection reusable for all 10 sections"
```

---

### Task 9: `LengthSlider` component

**Files:**
- Create: `components/LengthSlider.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/LengthSlider.tsx
'use client'

type Props = {
  value: number
  onChange: (v: number) => void
}

export function LengthSlider({ value, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold text-zinc-900">
          <span>⏳</span>
          <span>10. 노래 길이</span>
          <span className="text-sm font-normal text-zinc-500">(1분~10분)</span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">가사 분량과 생성 프롬프트에 반영됩니다</p>
      </header>
      <div className="flex items-center gap-3">
        <span className="w-8 text-xs text-zinc-500">1분</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-violet-500"
        />
        <span className="w-12 text-xs text-zinc-500">10분</span>
        <span className="ml-2 inline-flex min-w-12 justify-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
          {value}분
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/LengthSlider.tsx
git commit -m "feat: add LengthSlider 1–10 minutes"
```

---

### Task 10: Main page assembly (no result panel yet)

**Files:**
- Modify: `app/page.tsx` (overwrite the create-next-app default)
- Modify: `app/layout.tsx` (set Korean lang + title)

- [ ] **Step 1: Overwrite `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '플레이리스트 음악 만들기',
  description: 'TubeMaster clone — generate music-gen prompts and song concepts from option selections',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Overwrite `app/page.tsx`**

```tsx
// app/page.tsx
'use client'

import { useState } from 'react'
import type { GenerationMode, GenerationResult, Selections, SectionKey } from '@/types'
import { SECTIONS } from '@/lib/options'
import { OptionSection } from '@/components/OptionSection'
import { LengthSlider } from '@/components/LengthSlider'

const EMPTY: Selections = {
  genre: [], mood: [], vocal: [], usage: [], instrument: [],
  bpm: null, age: null, language: null,
  topic: [], lengthMin: 3, customInputs: {},
}

const MULTI_KEYS: SectionKey[] = ['genre', 'mood', 'vocal', 'usage', 'instrument', 'topic']

export default function Page() {
  const [selections, setSelections] = useState<Selections>(EMPTY)
  const [loading, setLoading] = useState<GenerationMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)

  function toggle(key: SectionKey, label: string) {
    setSelections((s) => {
      if (MULTI_KEYS.includes(key)) {
        const arr = s[key] as string[]
        const next = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label]
        return { ...s, [key]: next }
      }
      const cur = s[key] as string | null
      return { ...s, [key]: cur === label ? null : label }
    })
  }

  function setCustom(key: SectionKey, value: string) {
    setSelections((s) => ({ ...s, customInputs: { ...s.customInputs, [key]: value } }))
  }

  async function generate(mode: GenerationMode) {
    setError(null)
    setLoading(mode)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selections, mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? '알 수 없는 오류')
        return
      }
      setResult(data as GenerationResult)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '네트워크 오류')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">플레이리스트 음악 만들기</h1>
        <p className="text-sm text-zinc-500">프롬프트 + 10곡 콘셉트를 한 번에 생성합니다</p>
      </header>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((sec) => (
          <OptionSection
            key={sec.key}
            number={sec.number}
            emoji={sec.emoji}
            title={sec.title}
            subtitle={sec.subtitle}
            presets={sec.presets}
            selected={selections[sec.key] as string[] | string | null}
            onToggle={(label) => toggle(sec.key, label)}
            multi={sec.multi}
            customInput={selections.customInputs[sec.key]}
            onCustomChange={(v) => setCustom(sec.key, v)}
            placeholder={sec.placeholder}
          />
        ))}
        <LengthSlider
          value={selections.lengthMin}
          onChange={(v) => setSelections((s) => ({ ...s, lengthMin: v }))}
        />
      </div>

      <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-lg backdrop-blur">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => generate('prompt-only')}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading === 'prompt-only' ? '생성 중…' : '단일 스타일 프롬프트 생성'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => generate('full')}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50"
        >
          {loading === 'full' ? '생성 중…' : 'Playlist 만들기'}
        </button>
        {error && <span className="text-sm text-red-600">⚠ {error}</span>}
      </div>

      {/* ResultPanel slot — filled in Task 11 */}
      {result && (
        <pre className="mt-6 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-900 p-4 text-xs text-zinc-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Smoke-test the page**

```bash
AI_PROVIDER=mock npm run dev
```

Open `http://localhost:3000`. Verify:
- All 10 sections render with their preset buttons.
- Clicking a button in section 1 toggles it (violet fill ↔ outline).
- BPM/age/language sections behave as single-select (clicking another deselects the previous).
- Length slider moves 1↔10 with the label updating.
- Clicking "Playlist 만들기" with at least one option selected returns JSON shown in the pre block at the bottom (10 mock songs).
- Clicking it with everything cleared shows "⚠ 최소 1개 옵션을 선택해주세요".

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: wire main page with all option sections and mock generation"
```

---

### Task 11: `ResultPanel` component

**Files:**
- Create: `components/ResultPanel.tsx`
- Modify: `app/page.tsx` (replace the inline `<pre>` placeholder)

- [ ] **Step 1: Create `components/ResultPanel.tsx`**

```tsx
// components/ResultPanel.tsx
'use client'

import { useState } from 'react'
import type { GenerationResult } from '@/types'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
    >
      {copied ? '복사됨' : '복사'}
    </button>
  )
}

export function ResultPanel({ result }: { result: GenerationResult }) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">통합 프롬프트</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{result.provider}</span>
            <CopyButton text={result.prompt} />
          </div>
        </header>
        <p className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm text-zinc-800">{result.prompt}</p>
      </article>

      {result.songs && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.songs.map((s, i) => (
            <article key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <header className="mb-1 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900">{i + 1}. {s.title}</h4>
                <CopyButton text={`${s.title}\n\n${s.concept}`} />
              </header>
              <p className="text-sm leading-relaxed text-zinc-700">{s.concept}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace the inline `<pre>` in `app/page.tsx`**

Find this block in `app/page.tsx`:

```tsx
      {result && (
        <pre className="mt-6 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-900 p-4 text-xs text-zinc-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
```

Replace with:

```tsx
      {result && <ResultPanel result={result} />}
```

Add the import at the top of `app/page.tsx`:

```tsx
import { ResultPanel } from '@/components/ResultPanel'
```

- [ ] **Step 3: Smoke-test**

```bash
AI_PROVIDER=mock npm run dev
```

Generate a playlist; verify the prompt card and 10 song cards render. Click "복사" on a card — text lands in the clipboard. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add components/ResultPanel.tsx app/page.tsx
git commit -m "feat: add ResultPanel with copy buttons"
```

---

### Task 12: `HistoryDrawer` + localStorage history

**Files:**
- Create: `lib/history.ts`
- Create: `components/HistoryDrawer.tsx`
- Modify: `app/page.tsx` (push on success, render drawer + toggle button)

- [ ] **Step 1: Create `lib/history.ts`**

```ts
// lib/history.ts
import type { GenerationResult } from '@/types'

const KEY = 'tubemaster-clone:history'
const MAX = 20

export function loadHistory(): GenerationResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GenerationResult[]) : []
  } catch {
    return []
  }
}

export function pushHistory(entry: GenerationResult): GenerationResult[] {
  const next = [entry, ...loadHistory()].slice(0, MAX)
  window.localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  window.localStorage.removeItem(KEY)
}
```

- [ ] **Step 2: Create `components/HistoryDrawer.tsx`**

```tsx
// components/HistoryDrawer.tsx
'use client'

import type { GenerationResult } from '@/types'

type Props = {
  open: boolean
  entries: GenerationResult[]
  onClose: () => void
  onSelect: (entry: GenerationResult) => void
  onClear: () => void
}

export function HistoryDrawer({ open, entries, onClose, onSelect, onClear }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-20 bg-black/30 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <aside
        className={[
          'fixed right-0 top-0 z-30 flex h-full w-80 flex-col border-l border-zinc-200 bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h3 className="font-semibold">히스토리 ({entries.length})</h3>
          <div className="flex gap-2">
            <button onClick={onClear} className="text-xs text-zinc-500 hover:text-red-600">전체 삭제</button>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900">✕</button>
          </div>
        </header>
        <ul className="flex-1 overflow-auto">
          {entries.length === 0 && <li className="p-4 text-sm text-zinc-500">생성 기록이 없습니다</li>}
          {entries.map((e, i) => (
            <li key={`${e.generatedAt}-${i}`}>
              <button
                onClick={() => onSelect(e)}
                className="block w-full border-b border-zinc-100 px-4 py-3 text-left hover:bg-zinc-50"
              >
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{new Date(e.generatedAt).toLocaleString('ko-KR')}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5">{e.provider} · {e.mode}</span>
                </div>
                <p className="mt-1 truncate text-sm text-zinc-800">{e.prompt}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Wire into `app/page.tsx`**

Add imports near the existing imports:

```tsx
import { useEffect } from 'react'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { loadHistory, pushHistory, clearHistory } from '@/lib/history'
```

Add state near the other `useState` hooks:

```tsx
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => { setHistory(loadHistory()) }, [])
```

In `generate()`, after `setResult(data)`, push to history:

```tsx
      setResult(data as GenerationResult)
      setHistory(pushHistory(data as GenerationResult))
```

Add a history-toggle button inside the `<header>` block:

```tsx
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">플레이리스트 음악 만들기</h1>
          <p className="text-sm text-zinc-500">프롬프트 + 10곡 콘셉트를 한 번에 생성합니다</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          히스토리 {history.length}
        </button>
      </header>
```

At the end of the returned JSX (just before the closing `</div>`), render the drawer:

```tsx
      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={() => setHistoryOpen(false)}
        onSelect={(e) => { setResult(e); setHistoryOpen(false) }}
        onClear={() => { clearHistory(); setHistory([]) }}
      />
```

- [ ] **Step 4: Smoke-test**

```bash
AI_PROVIDER=mock npm run dev
```

Generate twice → click "히스토리 N" → drawer opens with 2 entries → click an entry → result panel reloads with that entry → "전체 삭제" empties the list. Reload the page → history persists from localStorage. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add lib/history.ts components/HistoryDrawer.tsx app/page.tsx
git commit -m "feat: add localStorage history and side drawer"
```

---

### Task 13: OpenAI provider

**Files:**
- Create: `lib/ai/openai.ts`
- Modify: `lib/ai/provider.ts`

- [ ] **Step 1: Create `lib/ai/openai.ts`**

```ts
// lib/ai/openai.ts
import OpenAI from 'openai'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

export class OpenAIProvider {
  name = 'openai'

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
    const client = new OpenAI({ apiKey })

    const userPrompt = buildUserPrompt(opts, mode)

    const call = async (extraInstruction = '') => {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + (extraInstruction ? `\n\n${extraInstruction}` : '') },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
      })
      const text = completion.choices[0]?.message?.content ?? ''
      return JSON.parse(text) as { prompt: string; songs: GenerationResult['songs'] }
    }

    let parsed
    try {
      parsed = await call()
    } catch {
      parsed = await call('이전 응답이 JSON 스키마를 어겼습니다. 반드시 {"prompt": string, "songs": null | Array<{title,concept}>} 형태로만 답하세요.')
    }
    return { mode, prompt: parsed.prompt, songs: mode === 'full' ? parsed.songs : null }
  }
}
```

- [ ] **Step 2: Register in `lib/ai/provider.ts`**

Replace the `case 'openai':` line so it constructs the provider:

```ts
    case 'openai':
      return new OpenAIProvider()
```

Add the import at the top:

```ts
import { OpenAIProvider } from '@/lib/ai/openai'
```

- [ ] **Step 3: Smoke-test (requires a real key)**

Create `.env.local`:

```bash
echo 'AI_PROVIDER=openai' >> .env.local
echo 'OPENAI_API_KEY=sk-...' >> .env.local
```

Run `npm run dev`, generate a playlist in the UI, confirm `result.provider === 'openai'` and the songs look sensible. Remove the API key from `.env.local` afterwards if it was a test key.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/openai.ts lib/ai/provider.ts
git commit -m "feat: add OpenAI provider"
```

---

### Task 14: Anthropic provider

**Files:**
- Create: `lib/ai/anthropic.ts`
- Modify: `lib/ai/provider.ts`

- [ ] **Step 1: Create `lib/ai/anthropic.ts`**

```ts
// lib/ai/anthropic.ts
import Anthropic from '@anthropic-ai/sdk'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

const TOOL = {
  name: 'submit_playlist',
  description: 'Return the generated music-gen prompt and song concepts.',
  input_schema: {
    type: 'object' as const,
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
  },
}

export class AnthropicProvider {
  name = 'anthropic'

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001'
    const client = new Anthropic({ apiKey })

    const userPrompt = buildUserPrompt(opts, mode)

    const msg = await client.messages.create({
      model,
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'submit_playlist' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    const toolUse = msg.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Anthropic did not return tool_use block')
    const input = toolUse.input as { prompt: string; songs: GenerationResult['songs'] }
    return { mode, prompt: input.prompt, songs: mode === 'full' ? input.songs : null }
  }
}
```

- [ ] **Step 2: Register in `lib/ai/provider.ts`**

Add the import and replace the `case 'anthropic':` line:

```ts
import { AnthropicProvider } from '@/lib/ai/anthropic'
// ...
    case 'anthropic':
      return new AnthropicProvider()
```

- [ ] **Step 3: Smoke-test**

`.env.local`:

```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Run the dev server, generate, confirm `result.provider === 'anthropic'`.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/anthropic.ts lib/ai/provider.ts
git commit -m "feat: add Anthropic provider with tool_use schema"
```

---

### Task 15: Gemini provider

**Files:**
- Create: `lib/ai/gemini.ts`
- Modify: `lib/ai/provider.ts`

- [ ] **Step 1: Create `lib/ai/gemini.ts`**

```ts
// lib/ai/gemini.ts
import { GoogleGenAI, Type } from '@google/genai'
import type { GenerationMode, GenerationResult, Selections } from '@/types'
import { SYSTEM_PROMPT, buildUserPrompt } from '@/lib/promptBuilder'

const SONG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title:   { type: Type.STRING },
    concept: { type: Type.STRING },
  },
  required: ['title', 'concept'],
}

export class GeminiProvider {
  name = 'gemini'

  async generate(opts: Selections, mode: GenerationMode): Promise<Omit<GenerationResult, 'generatedAt' | 'provider'>> {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
    const client = new GoogleGenAI({ apiKey })

    const userPrompt = buildUserPrompt(opts, mode)

    const schema = mode === 'full'
      ? {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            songs:  { type: Type.ARRAY, items: SONG_SCHEMA },
          },
          required: ['prompt', 'songs'],
        }
      : {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
          },
          required: ['prompt'],
        }

    const resp = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.9,
      },
    })

    const text = resp.text ?? ''
    const parsed = JSON.parse(text) as { prompt: string; songs?: GenerationResult['songs'] }
    return { mode, prompt: parsed.prompt, songs: mode === 'full' ? parsed.songs ?? null : null }
  }
}
```

- [ ] **Step 2: Register in `lib/ai/provider.ts`**

```ts
import { GeminiProvider } from '@/lib/ai/gemini'
// ...
    case 'gemini':
      return new GeminiProvider()
```

- [ ] **Step 3: Smoke-test**

`.env.local`:

```
AI_PROVIDER=gemini
GOOGLE_API_KEY=...
```

Generate, confirm `result.provider === 'gemini'`.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/gemini.ts lib/ai/provider.ts
git commit -m "feat: add Gemini provider with response schema"
```

---

### Task 16: `.env.example`, README, and acceptance pass

**Files:**
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Write `.env.example`**

```bash
# Which provider to use: mock | openai | anthropic | gemini
AI_PROVIDER=mock

# Fill only the provider you're using.
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

- [ ] **Step 2: Write `README.md`**

```markdown
# Sound Anything — Playlist Music Creator Clone

A Next.js 15 clone of TubeMaster's "플레이리스트 음악 만들기" page. Pick from 10 categories of musical attributes and an LLM generates a composite music-gen prompt plus 10 original song concepts (title + brief mood/imagery summary). Outputs are designed to be pasted into AI music services like Suno or Udio.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local — pick a provider and add its key, or leave AI_PROVIDER=mock
npm run dev
```

Open http://localhost:3000.

## Providers

Set `AI_PROVIDER` in `.env.local` to one of:

| Provider  | Env var(s)                                     |
| --------- | ---------------------------------------------- |
| `mock`    | none — deterministic dummy data, useful for UI work |
| `openai`  | `OPENAI_API_KEY`, optional `OPENAI_MODEL`      |
| `anthropic` | `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL` |
| `gemini`  | `GOOGLE_API_KEY`, optional `GEMINI_MODEL`      |

The API key never leaves the server — all LLM calls go through `/api/generate`.

## What this app generates

- A single composite music-generation prompt.
- 10 song concepts (each: short original title + 2–3 sentence description of mood, imagery, and hook idea). The concepts are creative metadata, not lyric text.

## Design / Plan

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.
```

- [ ] **Step 3: Run the spec acceptance checklist**

Start the dev server (`AI_PROVIDER=mock npm run dev`) and walk through the checklist from spec §12:

- [ ] All 10 sections render with correct presets and toggle behaviour.
- [ ] Single-select sections (BPM/age/language) enforce single choice.
- [ ] Custom-input textboxes work and are sent to the LLM (verify by entering text in a textbox, generating, and checking the network panel shows the value in the request body).
- [ ] Length slider moves smoothly 1↔10 with live label.
- [ ] Mock provider returns a result panel with 10 song cards.
- [ ] At least one real provider returns a valid `GenerationResult` end-to-end (pick the one whose key you have).
- [ ] localStorage history stores up to 20 entries and reloads on click.
- [ ] All 4 error codes show appropriate messages (clear all options, then submit → `EMPTY_SELECTION`; unset env key for selected provider → `MISSING_API_KEY`; intentionally corrupt the API key → `LLM_ERROR`; `INVALID_RESPONSE` is exercised by the provider's retry path — observation only).
- [ ] API key never appears in browser-side bundles (`grep -R OPENAI_API_KEY .next/static 2>/dev/null` returns nothing).

- [ ] **Step 4: Final commit**

```bash
git add .env.example README.md
git commit -m "docs: add .env.example and README; spec acceptance pass"
```

---

## Self-review

**Spec coverage (§ → tasks):**
- §3 Tech stack → Task 1
- §4 Architecture / file layout → Tasks 1 (scaffold), 2, 3, 4, 5, 6, 7–12 (components/page), 13–15 (providers)
- §5 Data model → Task 2
- §6 Data flow → Tasks 6, 10, 11, 12
- §7 Provider abstraction → Tasks 5, 13, 14, 15
- §8 Env vars → Task 16
- §9 UI components → Tasks 7, 8, 9, 11, 12
- §10 Static preset data → Task 3
- §11 Error handling → Tasks 6 (route codes), 10 (UI surface), 16 (acceptance check)
- §12 Testing strategy → mock-provider verification baked into every UI task; final manual checklist in Task 16

**Placeholder scan:** No TBDs or "TODO later" steps; every code-changing step has full code. No "similar to Task N" references — provider tasks each duplicate the full module body.

**Type consistency:**
- `Selections` shape defined in Task 2 used identically in Tasks 4, 5, 6, 10, 13, 14, 15.
- `Omit<GenerationResult, 'generatedAt' | 'provider'>` return shape is consistent between Task 5 (interface), 6 (API route fills the omitted fields), and Tasks 13/14/15 (providers).
- Provider constructor pattern (`class XProvider { name = 'x'; async generate(...) }`) consistent across mock/openai/anthropic/gemini.
- `SectionKey` union from Task 2 lines up with `MULTI_KEYS` in Task 10 and `SECTIONS` in Task 3.
- localStorage key `'tubemaster-clone:history'` used only in `lib/history.ts` (Task 12).
