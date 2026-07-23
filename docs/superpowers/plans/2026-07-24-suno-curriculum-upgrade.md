# 수노 제너레이터 커리큘럼 업그레이드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「Suno 심화 커리큘럼」 기반으로 SYSTEM_PROMPT를 전면 개편하고, 곡별 Exclude Styles·슬라이더 추천 출력 필드를 추가해 UI에 표시한다.

**Architecture:** LLM 출력 스키마를 확장(접근 C)한다 — `SongConcept`에 `excludeStyles`/`sliderHint`를 추가하고, Gemini responseSchema의 enum/minItems/maxItems로 값 형식을 스키마 레벨에서 강제한다. TS 타입은 optional(구 히스토리 호환), 응답 스키마는 required(신규 생성 보장). 프롬프트 규칙은 `lib/promptBuilder.ts`의 SYSTEM_PROMPT 한 곳에 집중돼 있어 openai/anthropic 경로에도 자동 적용된다.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind CSS v4, @google/genai 2.x (responseSchema + enum).

**Spec:** `docs/superpowers/specs/2026-07-24-suno-curriculum-upgrade-design.md`

## Global Constraints

- 이 프로젝트는 테스트 러너가 없음. 각 태스크 검증은 `npm run lint`와 `npm run build` 통과로 하고, 마지막 태스크에서 실동작(E2E)을 확인한다.
- AGENTS.md 경고 준수: 이 Next.js는 훈련 데이터와 다를 수 있음. 이 플랜은 기존 파일의 기존 패턴만 수정하며 새 Next API를 도입하지 않는다.
- 스타일: 기존 zinc/violet 팔레트, `rounded-lg`/`rounded-2xl`, `border-l-2` 섹션 카드 톤 재사용. 새 의존성 도입 금지.
- 슬라이더 enum 값은 정확히 이 문자열만 허용: weirdness `'0-20%' | '20-40%' | '40-60%' | '60-80%'`, styleInfluence `'30-50%' | '50-70%' | '70-100%'`.
- excludeStyles는 2~5개(응답 스키마 minItems 2 / maxItems 5), 서버에서 최대 5개로 자르는 안전망 추가.
- TS 타입에서 신규 필드 2개는 **optional** — localStorage 구 히스토리 항목에 없기 때문. UI는 없으면 해당 섹션을 렌더하지 않는다.
- prompt-only 모드(레거시)의 prompt 필드 규칙은 현행 유지. 이번 개편 대상은 single/full 모드의 곡별 출력.
- 한국어 UI 문구는 이 플랜에 명시된 그대로 사용: `🚫 Exclude Styles (Suno Exclude 입력란용)`, `🎚️ 슬라이더 추천`, `Weirdness`, `Style Influence`.

---

### Task 1: 타입 확장 (`types.ts`)

**Files:**
- Modify: `types.ts` (SongConcept 아래, 29~35행 부근)

**Interfaces:**
- Consumes: 없음.
- Produces: `WEIRDNESS_LEVELS`/`STYLE_INFLUENCE_LEVELS` 상수(readonly 튜플), `SliderHint` 타입, `SongConcept.excludeStyles?: string[]`, `SongConcept.sliderHint?: SliderHint`. Task 2(스키마), Task 4(mock), Task 6(UI)이 이를 import한다.

- [ ] **Step 1: SongConcept 확장 및 SliderHint 신설**

`types.ts`의 기존 `SongConcept` 블록:

```ts
export type SongConcept = {
  title: string
  titles: { ko: string; en: string; ja: string }
  concept: string
  stylePrompt: string
  lyrics: string
}
```

을 아래로 교체:

```ts
export const WEIRDNESS_LEVELS = ['0-20%', '20-40%', '40-60%', '60-80%'] as const
export const STYLE_INFLUENCE_LEVELS = ['30-50%', '50-70%', '70-100%'] as const

export type SliderHint = {
  weirdness: (typeof WEIRDNESS_LEVELS)[number]
  styleInfluence: (typeof STYLE_INFLUENCE_LEVELS)[number]
  note: string
}

export type SongConcept = {
  title: string
  titles: { ko: string; en: string; ja: string }
  concept: string
  stylePrompt: string
  excludeStyles?: string[]
  sliderHint?: SliderHint
  lyrics: string
}
```

enum 문자열 배열을 `types.ts`에 두는 이유: `lib/promptBuilder.ts`(RESPONSE_SCHEMA)와 `lib/ai/gemini.ts`(responseSchema) 두 곳이 같은 값을 써야 하므로 단일 소스로 공유한다(DRY). `types.ts`는 이미 모든 파일이 import하는 최하위 모듈이라 순환 참조가 생기지 않는다.

- [ ] **Step 2: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 오류 없이 통과 (아직 아무도 새 필드를 사용하지 않음)

- [ ] **Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: SongConcept에 excludeStyles·sliderHint 타입 추가"
```

---

### Task 2: 응답 스키마 확장 (`lib/promptBuilder.ts` RESPONSE_SCHEMA + `lib/ai/gemini.ts` SONG_SCHEMA)

**Files:**
- Modify: `lib/promptBuilder.ts` (파일 하단 `RESPONSE_SCHEMA`)
- Modify: `lib/ai/gemini.ts` (상단 `SONG_SCHEMA`, 7~27행 부근)

**Interfaces:**
- Consumes: Task 1의 `WEIRDNESS_LEVELS`, `STYLE_INFLUENCE_LEVELS` (`@/types`).
- Produces: 응답 스키마에서 `excludeStyles`(array, 2~5개)와 `sliderHint`(enum 강제)가 **required**. Gemini 구조화 출력이 이 형식을 보장한다.

- [ ] **Step 1: RESPONSE_SCHEMA 확장 (promptBuilder.ts)**

`lib/promptBuilder.ts` 상단 import에 상수 추가:

```ts
import { STYLE_INFLUENCE_LEVELS, WEIRDNESS_LEVELS } from '@/types'
```

(기존 `import type { ... } from '@/types'` 줄은 그대로 두고 별도 값 import 줄을 추가한다.)

기존 `RESPONSE_SCHEMA`의 items 오브젝트를 아래로 교체:

```ts
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
          titles: {
            type: 'object',
            properties: {
              ko: { type: 'string' },
              en: { type: 'string' },
              ja: { type: 'string' },
            },
            required: ['ko', 'en', 'ja'],
          },
          concept: { type: 'string' },
          stylePrompt: { type: 'string' },
          excludeStyles: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 5,
          },
          sliderHint: {
            type: 'object',
            properties: {
              weirdness: { type: 'string', enum: [...WEIRDNESS_LEVELS] },
              styleInfluence: { type: 'string', enum: [...STYLE_INFLUENCE_LEVELS] },
              note: { type: 'string' },
            },
            required: ['weirdness', 'styleInfluence', 'note'],
          },
          lyrics: { type: 'string' },
        },
        required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'lyrics'],
      },
    },
  },
  required: ['prompt', 'songs'],
} as const
```

- [ ] **Step 2: SONG_SCHEMA 확장 (gemini.ts)**

`lib/ai/gemini.ts` 상단 import에 상수 추가:

```ts
import { STYLE_INFLUENCE_LEVELS, WEIRDNESS_LEVELS } from '@/types'
```

기존 `SONG_SCHEMA` 블록(그 위 `TITLES_SCHEMA`는 그대로)을 아래로 교체:

```ts
const SLIDER_HINT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    weirdness: { type: Type.STRING, enum: [...WEIRDNESS_LEVELS] },
    styleInfluence: { type: Type.STRING, enum: [...STYLE_INFLUENCE_LEVELS] },
    note: { type: Type.STRING },
  },
  required: ['weirdness', 'styleInfluence', 'note'],
}

const SONG_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title:    { type: Type.STRING },
    titles:   TITLES_SCHEMA,
    concept:  { type: Type.STRING },
    stylePrompt: { type: Type.STRING },
    excludeStyles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: '2',
      maxItems: '5',
    },
    sliderHint: SLIDER_HINT_SCHEMA,
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'lyrics'],
}
```

주의: `@google/genai`의 minItems/maxItems는 기존 코드(`minItems: String(songCount)`)와 동일하게 **문자열**로 넣는다.

- [ ] **Step 3: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 4: Commit**

```bash
git add lib/promptBuilder.ts lib/ai/gemini.ts
git commit -m "feat: 응답 스키마에 excludeStyles·sliderHint 추가 (enum/개수 강제)"
```

---

### Task 3: SYSTEM_PROMPT 전면 개편 (`lib/promptBuilder.ts`)

**Files:**
- Modify: `lib/promptBuilder.ts` (`SYSTEM_PROMPT` 상수 전체 교체, `buildUserPrompt`의 mode 안내 2줄 수정)

**Interfaces:**
- Consumes: 없음 (순수 문자열).
- Produces: 커리큘럼 규칙이 반영된 SYSTEM_PROMPT. gemini/openai/anthropic 3개 프로바이더가 공유.

- [ ] **Step 1: SYSTEM_PROMPT 상수 교체**

기존 `SYSTEM_PROMPT` 전체를 아래 문자열로 교체한다 (백틱 템플릿 리터럴 유지):

```ts
export const SYSTEM_PROMPT = `당신은 음악 콘셉트 디자이너이자 작사가입니다. 사용자가 고른 옵션을 바탕으로 Suno·Udio 같은 AI 음악 생성 서비스에 그대로 붙여넣을 곡별 작곡 스타일 프롬프트와, 그 프롬프트에 어울리는 플레이리스트 곡 콘셉트·가사·제외 스타일·슬라이더 추천을 만들어 줍니다.

Suno는 명령을 수행하는 엔진이 아니라 분위기(vibe)를 조합하는 확률 모델입니다. 소리로 번역되는 묘사만 작동하고, 추상어·명령문은 무시됩니다. 모든 출력 필드는 이 전제 위에서 작성합니다.

# 출력 규칙

- 출력은 반드시 지정된 JSON 스키마를 따릅니다. JSON 외의 텍스트(설명, 코드펜스 등)는 절대 출력하지 마세요.
- "songs" 필드:
  - mode가 "full"이면 정확히 10개 항목을 생성합니다.
  - mode가 "single"이면 정확히 1개 항목만 생성합니다.
  - mode가 "prompt-only"이면 null로 둡니다.

# prompt 필드 (레거시 호환용)

- mode가 "single" 또는 "full"이면 통합 프롬프트를 만들지 말고 정확히 빈 문자열 ""로 둡니다.
- mode가 "prompt-only"일 때만 사용자의 모든 옵션을 녹여낸 영문 한 줄 style prompt를 작성합니다.

# 각 song의 stylePrompt 필드 (Suno Style 입력란용)

- 반드시 영어로만, 콤마로 구분된 디스크립터 **4~7개**로 작성합니다. 8개 이상 금지 — 디스크립터끼리 경쟁해 소리가 탁해집니다.
- 순서 고정(앞일수록 가중치가 큼): 장르/서브장르 → 템포/에너지 → 핵심 악기 → 보컬 → 프로덕션 → 무드. **주 장르를 반드시 맨 앞에** 둡니다.
- 사용자가 옵션을 많이 골라도 전부 나열하지 말고, 곡 콘셉트에 맞게 우선순위를 정해 4~7개로 압축·번역합니다.
- 차별화 레버 (곡마다 1개 이상 활용):
  - 마이크로장르: rock 대신 shoegaze·surf rock, hip-hop 대신 boom-bap·phonk처럼 좁고 뾰족한 장르명
  - 악기 고유명사: keyboard 대신 Rhodes electric piano, Juno-106 pad, Moog bass, TR-808
  - 시대 앵커: 80s synth-pop, late 2010s minimal production처럼 시대를 못박기
  - 프로덕션 질감: tape saturation, vinyl crackle, gated reverb drums, warm analog production
- 보컬은 3계층으로 씁니다: Character(누가 — raspy female vocals), Delivery(어떻게 — breathy, powerful belt), Effects(질감 — reverb-drenched, 필요할 때만). 최소 Character+Delivery는 지정합니다.
- 가사 언어를 보컬 디스크립터에 명시합니다: "female vocals singing in Korean"처럼.
- 가사 언어가 한국어(혼용 포함)면 "Clear Korean Pronunciation"을 디스크립터로 포함합니다.
- BPM 옵션이 있으면 그대로 명시합니다(예: 70-90 BPM). 신호끼리 싸우게 하지 마세요: slow + 140 BPM, happy bright + D minor 같은 조합 금지.
- 무드는 한 방향만. aggressive와 peaceful 병치 금지 — 대비가 필요하면 태그가 아니라 가사 구조(조용한 [Verse] → 터지는 [Chorus])로 만듭니다.
- 금지: 추상어(epic, beautiful, amazing, emotional), 명령문(make the drums louder), 실제 아티스트명, "Target duration ..." 같은 길이 지시.
- 예시: "Dream Pop, slow 70-90 BPM, Juno-106 pad and clean electric guitar, breathy female vocals singing in Korean, Clear Korean Pronunciation, 2010s reverb-heavy production, wistful"
- mode가 "full"이면 10곡의 stylePrompt가 서로 명확히 달라야 하며, 곡마다 차별화 레버 중 최소 1개를 다르게 씁니다.

# 각 song의 excludeStyles 필드 (Suno Exclude Styles 입력란용)

- 이 곡의 콘셉트에서 새어 나오기 쉬운 원치 않는 요소를 **2~5개**, 영어 구체 명사(구)로 작성합니다.
- 예: 명상곡 → "drums", "edm drops", "distorted guitar" / 여성 보컬 고정 → "male vocals" / 어쿠스틱 → "synthesizer", "autotune"
- stylePrompt와 모순 금지: exclude에 넣은 요소를 stylePrompt에 쓰지 마세요.
- 추상어 금지. 구체적인 악기·보컬·사운드 명사만 씁니다.

# 각 song의 sliderHint 필드 (Suno 슬라이더 추천)

- weirdness: "0-20%", "20-40%", "40-60%", "60-80%" 중 하나.
  - 극도로 보수적·교과서적 사운드(동요·자장가 등)만 "0-20%", 상업적·안전 지향이면 "20-40%", 대부분의 곡은 "40-60%", 실험적 장르(앰비언트·글리치 등)만 "60-80%".
- styleInfluence: "30-50%", "50-70%", "70-100%" 중 하나.
  - 기본 "50-70%". stylePrompt가 4~5개로 적고 뾰족하면 "70-100%", 태그를 느슨한 참고로만 쓸 곡은 "30-50%".
- note: 이 곡에 이 값을 추천하는 이유를 한국어 한 문장으로.

# 각 song의 나머지 필드

- "title": 1~6단어의 짧고 시적인 원작 제목. 시각적·은유적 표현 사용. 사용자가 고른 가사 언어에 맞춰 작성합니다.
- "titles": 같은 곡의 제목을 한국어·영어·일본어 세 언어로 각각 작성한 객체. 키는 정확히 ko, en, ja 세 개. 단순 직역이 아니라 각 언어의 노래 제목 톤에 맞춰 자연스럽게 표현하되, 원곡 분위기와 의미를 유지합니다. 가사 언어와 무관하게 세 언어 모두 채웁니다.
- "concept": 2~3문장의 한국어 설명. 곡의 분위기·이미지·훅 아이디어 마케팅 메모처럼. 가사 본문을 인용하지 마세요.
- "lyrics": Suno 가사 입력란에 그대로 붙여넣는 형식의 새 가사. 아래 규칙을 정확히 따릅니다.

# 가사 구조 (노래 길이별로 다름 — 반드시 준수)

모든 곡은 [Intro]로 시작하고 [Outro] + [End]로 끝납니다.
- [Intro]는 태그만 쓰고 가사를 넣지 않습니다(연주 인트로). [End]도 태그만 쓰고 가사를 넣지 않습니다.
- [End]를 [Outro] 없이 단독으로 쓰지 마세요 — 랜덤 루프를 유발합니다.
- 곡 길이에 맞는 아래 구조를 **정확히** 따르세요. 사용자 입력 "노래 길이: N분"을 보고 해당 구간을 선택합니다.

- **1~2분 (짧은 곡)**: [Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Outro] → [End]. 본문 섹션당 **3줄**, [Outro]는 **1줄**.
- **3~5분 (표준)**: [Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Chorus] → [Outro] → [End]. 본문 섹션당 **4줄**, [Outro]는 **2줄**.
- **6~8분 (긴 곡)**: [Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Verse 3] → [Chorus] → [Outro] → [End]. 본문 섹션당 **5줄**, [Outro]는 **2줄**.
- **9~10분 (대곡)**: [Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Bridge] → [Verse 3] → [Chorus] → [Bridge] → [Outro] → [End]. 본문 섹션당 **5줄**, [Outro]는 **2줄**.

이 표는 절대 규칙입니다. 3분과 9분 결과의 분량이 거의 같으면 안 됩니다.

# 가사 형식 규칙 (반드시 준수)

1. 각 섹션 헤더는 대괄호로 감싸 자기 줄에 단독으로 표기합니다. 예: "[Verse 1]", "[Chorus]"
2. 섹션당 줄 수는 위 "가사 구조"의 길이별 줄 수를 정확히 지킵니다.
3. **[Chorus]가 두 번 이상 등장하면 헤더와 가사 모두 한 글자도 다르지 않게 동일하게** 적습니다(편곡 파라미터가 붙었으면 그것까지 동일하게). "(repeat)" 같은 약어·중략 금지. [Bridge]가 두 번 등장하면 가사는 달라도 운율은 유지합니다.
4. 한 줄은 한 호흡으로 부를 길이 — 한국어 기준 대략 10~18자, 영어 기준 5~8단어.
5. 줄 끝에 마침표나 느낌표를 붙이지 마세요. 문장 중간의 쉼표나 물음표는 허용.
6. 섹션과 섹션 사이는 빈 줄 1개로 구분. 섹션 내부에는 빈 줄을 넣지 마세요.
7. 허용 태그는 [Intro] [Verse N] [Chorus] [Bridge] [Outro] [End]와 아래 편곡 파라미터 문법뿐입니다. Pre-Chorus, Hook, Drop 같은 다른 태그는 사용하지 마세요.
8. "가사없는 연주곡" 옵션이거나 보컬에 "가사없는 연주곡"이 선택되면 lyrics 필드는 정확히 "(Instrumental)" 한 줄만 채웁니다.

# 섹션별 편곡 태그 (파라미터 문법)

- 곡당 **1~2개 본문 섹션에만**, 대비가 필요한 지점에 사용합니다: "[Verse 1: whispered vocals, acoustic guitar only]" → "[Chorus: full band, soaring vocals]"
- 태그당 연출은 1~2개까지, 짧은 영어 구로. 과잉 태깅은 노이즈입니다.
- [Intro]와 [End]에는 파라미터를 붙이지 않습니다.

# 보컬 연출·포매팅 기호 (절제해서 사용)

- 소괄호 = 배킹보컬/애드립 레이어: 1~3단어, 후렴 위주로 곡당 2~4회. 예: "빛나는 밤 (밤)"
- ALL CAPS = 크고 강하게: 섹션당 최대 1회, 1~3단어만.
- ~ = 비브라토, - = 음절 늘이기(lo-o-o-ove), … = 드라마틱 포즈.
- 위 기호·연출의 곡 전체 사용 합계는 3~6회로 제한합니다. 남용은 노이즈입니다.
- 숫자는 절대 숫자로 쓰지 말고 발음대로 씁니다: 한국어 가사는 한글로(3월→삼월, 1시→한 시), 영어 가사는 단어로(3am→three A-M, 24/7→twenty four seven). 약어는 철자를 분리합니다(AI→A-I, DJ→dee-jay).

# 가사 언어

- 사용자가 고른 "가사 언어" 옵션을 따릅니다. 선택이 없으면 한국어.
- **각 언어는 반드시 그 언어 본래의 문자·표기법으로 작성합니다.** 한국어는 한글로, 영어는 라틴 문자로, 일본어는 히라가나·가타카나·한자(일본어 표기 그대로)로 씁니다.
- **일본어 가사를 로마자(romaji)나 영어 발음으로 음차 표기하는 것은 절대 금지입니다.** 예: "君"을 "kimi"로, "桜"를 "sakura"로, "心"을 "kokoro"로 쓰는 식의 발음 표기는 안 됩니다. 반드시 일본어 문자 그대로("君", "桜", "心") 작성합니다.
- 혼용 옵션은 **"섹션당 한 언어"** 원칙을 따릅니다. 한 섹션 안에 두 언어를 섞지 마세요.
  - "한국어+영어 섞어서": [Chorus] 또는 [Bridge] 중 **하나의 섹션 전체**를 영어(라틴 문자)로 쓰고, 나머지 섹션은 모두 한글로 씁니다.
  - "일본어+영어 섞어서": 위와 동일하게 영어 섹션 1개, 나머지는 일본어 문자(히라가나·가타카나·한자)로 씁니다. 일본어 부분은 절대 로마자로 바꾸지 마세요.

# 저작권

- 모든 가사·제목·콘셉트는 사용자의 옵션에서 파생된 새 창작이어야 합니다.
- 기존 가요·팝송의 가사, 후렴구, 표현, 번안을 인용·차용·재구성하지 마세요.
- 의미가 비슷한 다른 표현으로 완전히 새롭게 작성합니다.

# 출력 전 자체 검토 (반드시 수행)

최종 제출 전에 아래 검토를 머릿속에서 한 번 수행하고, 오류를 발견하면 **JSON에 담는 최종본 자체를 교정된 상태로** 제출하세요. 검토 과정이나 수정 내역은 출력 JSON에 노출하지 마세요.

[구조·형식 점검]
- lyrics가 [Intro]로 시작하고 [Outro] + [End]로 끝나는가. [Outro] 줄 수(1~2줄)와 본문 섹션 줄 수가 길이별 표와 일치하는가.
- 반복 [Chorus]가 헤더·가사 완전 동일한가.
- 편곡 파라미터 태그가 곡당 1~2개 이내이고, 기호·배킹보컬 합계가 3~6회 이내인가.
- stylePrompt 디스크립터가 4~7개이고 주 장르가 맨 앞인가. 추상어·명령문·아티스트명·길이 지시가 없는가.
- excludeStyles가 2~5개이고 stylePrompt와 모순되지 않는가.

[문법·표기 점검]
- **시적 허용은 그대로 둡니다.** 다음은 오류가 아닙니다:
  - 운율·박자를 위한 어순 도치, 주어/조사 생략, 반복, 후렴 변형
  - 의도된 비문, 감탄어, 의성/의태어, 신조어·은어, 줄임말, 라임을 위한 변칙 표기
  - 외래어·외국어 혼용(단, 혼용은 섹션 단위)
- **시적 허용을 벗어난 명백한 문법·단어 오류는 교정합니다.** 예:
  - 한국어: 조사 오용("을"/"를" 혼동 등), 활용 오류, 시제 비일치, 맞춤법("되" vs "돼", "데" vs "대" 등), 의미가 바뀌는 띄어쓰기 오류, 부정확한 단어 선택
  - 영어: 주어-동사 일치, 시제 일관성, 관사·전치사 오용, 철자 오류, 단어 의미 오용
  - 일본어: 조사 오용, 활용 오류, 한자·가나 오용
- **표기 문자 점검:** 일본어 가사(또는 혼용의 일본어 부분)에 로마자 음차(예: "kimi", "sakura")가 섞여 있으면 반드시 일본어 문자(君·桜 등)로 되돌립니다. 숫자가 절대 숫자(1, 3월, 3am)로 남아 있으면 발음 표기로 바꿉니다.
- 의미·운율·분위기를 바꾸는 교정은 하지 마세요. 의심스러우면 시적 허용으로 두세요.
- 섹션 라벨과 줄 수·빈 줄 구조는 절대 바꾸지 마세요.
- "(Instrumental)" 한 줄짜리 lyrics는 문법 검토 대상이 아닙니다.`
```

- [ ] **Step 2: buildUserPrompt의 mode 안내 문구 갱신**

`buildUserPrompt` 안의 두 줄을 수정한다.

기존:

```ts
  if (mode === 'full') {
    lines.push('- songs 배열은 반드시 정확히 10개. 9개나 11개는 허용되지 않습니다. 각 곡의 콘셉트·stylePrompt·가사를 모두 다르게 작성하세요.')
  } else if (mode === 'single') {
    lines.push('- songs 배열은 반드시 정확히 1개. 해당 곡 전용 영문 stylePrompt를 포함하세요.')
  }
```

교체:

```ts
  if (mode === 'full') {
    lines.push('- songs 배열은 반드시 정확히 10개. 9개나 11개는 허용되지 않습니다. 각 곡의 콘셉트·stylePrompt·excludeStyles·가사를 모두 다르게 작성하세요.')
  } else if (mode === 'single') {
    lines.push('- songs 배열은 반드시 정확히 1개. 해당 곡 전용 영문 stylePrompt·excludeStyles·sliderHint를 포함하세요.')
  }
```

- [ ] **Step 3: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 4: Commit**

```bash
git add lib/promptBuilder.ts
git commit -m "feat: SYSTEM_PROMPT 커리큘럼 기반 전면 개편 (스타일 공식·Intro/End·편곡 태그·혼용 섹션 분리)"
```

---

### Task 4: mock 프로바이더 갱신 (`lib/ai/mock.ts`)

**Files:**
- Modify: `lib/ai/mock.ts`

**Interfaces:**
- Consumes: Task 1의 `SliderHint` 타입 (`@/types`, 기존 import type 줄에 추가).
- Produces: API 키 없이도 신규 필드·신규 가사 구조를 UI에서 확인할 수 있는 목업 데이터.

- [ ] **Step 1: 목업 가사 구조와 신규 필드 반영**

`lib/ai/mock.ts`에서 기존 `mockLyrics` 함수를 교체:

```ts
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
```

`songs` 생성부의 각 곡 객체에 신규 필드 2개를 추가 (`stylePrompt`와 `lyrics` 사이):

```ts
    const songs: SongConcept[] = Array.from({ length: songCount }, (_, i) => ({
      title: `목업 트랙 ${i + 1}`,
      titles: {
        ko: `목업 트랙 ${i + 1}`,
        en: `Mock Track ${i + 1}`,
        ja: `モックトラック ${i + 1}`,
      },
      concept: `${summary} 분위기를 살린 ${opts.lengthMin}분짜리 트랙의 콘셉트 메모 ${i + 1}번. 실제 LLM 응답은 분위기·이미지·훅 아이디어를 두세 문장으로 묘사합니다.`,
      stylePrompt: `Mock playlist-ready style, distinct song concept ${i + 1}, cinematic hook, expressive vocal texture`,
      excludeStyles: ['edm drops', 'distorted guitar', 'crowd noise'].slice(0, 2 + (i % 2)),
      sliderHint: {
        weirdness: '40-60%',
        styleInfluence: '50-70%',
        note: `목업 추천 ${i + 1}: 창의성과 일관성의 기본 균형 구간입니다.`,
      },
      lyrics: mockLyrics(i + 1),
    }))
```

파일 상단 import type 줄에 `SliderHint`는 필요 없다 — 리터럴이 `SongConcept`의 필드 타입으로 좁혀지는지 확인하고, TS가 string으로 넓혀 오류를 내면 아래처럼 `satisfies`나 `as const`를 쓰는 대신 import를 추가해 명시 타입을 붙인다:

```ts
import type { GenerationExtras, GenerationMode, GenerationResult, Selections, SliderHint, SongConcept } from '@/types'
```

```ts
      sliderHint: {
        weirdness: '40-60%',
        styleInfluence: '50-70%',
        note: `목업 추천 ${i + 1}: 창의성과 일관성의 기본 균형 구간입니다.`,
      } satisfies SliderHint,
```

(배열이 `SongConcept[]`로 주석돼 있으므로 보통은 문맥 타이핑으로 통과한다. 통과하면 `satisfies` 불필요.)

- [ ] **Step 2: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 3: mock API 응답 확인**

Run:

```bash
AI_PROVIDER=mock npm run dev &   # 이미 dev 서버가 떠 있으면 재사용하되 AI_PROVIDER=mock 필요
sleep 5
curl -s -X POST localhost:3000/api/generate \
  -H 'content-type: application/json' \
  -d '{"selections":{"genre":"발라드","mood":[],"vocal":[],"usage":null,"instrument":[],"bpm":null,"age":null,"language":null,"topic":[],"lengthMin":3,"customInputs":{}},"mode":"single"}' \
  | python3 -m json.tool | head -40
```

Expected: `songs[0]`에 `excludeStyles` 배열(2~3개), `sliderHint` 객체(weirdness/styleInfluence/note), lyrics가 `[Intro]`로 시작하고 `[End]`로 끝남.
(주의: 요청 body에 `model`을 넣으면 Gemini로 라우팅되므로 **model 필드 없이** 호출해야 mock이 응답한다.)

- [ ] **Step 4: Commit**

```bash
git add lib/ai/mock.ts
git commit -m "feat: mock 프로바이더에 excludeStyles·sliderHint·신규 가사 구조 반영"
```

---

### Task 5: 서버 정규화 안전망 (`app/api/generate/route.ts`)

**Files:**
- Modify: `app/api/generate/route.ts` (POST 핸들러의 result 조립부, 53~57행 부근)

**Interfaces:**
- Consumes: `GenerationResult.songs[].excludeStyles?` (Task 1).
- Produces: excludeStyles가 항상 최대 5개로 잘린 응답.

- [ ] **Step 1: excludeStyles 상한 정규화 추가**

기존:

```ts
    const result: GenerationResult = {
      ...partial,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
```

교체:

```ts
    const result: GenerationResult = {
      ...partial,
      songs: partial.songs
        ? partial.songs.map((s) =>
            s.excludeStyles ? { ...s, excludeStyles: s.excludeStyles.slice(0, 5) } : s,
          )
        : partial.songs,
      provider: provider.name,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
```

- [ ] **Step 2: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 3: Commit**

```bash
git add app/api/generate/route.ts
git commit -m "feat: excludeStyles 최대 5개 서버 정규화"
```

---

### Task 6: 결과 UI에 Exclude Styles·슬라이더 추천 표시 (`components/ResultPanel.tsx`)

**Files:**
- Modify: `components/ResultPanel.tsx` (곡 카드 렌더부)

**Interfaces:**
- Consumes: `SongConcept.excludeStyles?`, `SongConcept.sliderHint?` (Task 1).
- Produces: 곡 카드에 조건부 렌더되는 두 섹션 + exclude 포함 전체 복사 텍스트.

- [ ] **Step 1: 전체 복사 텍스트에 Exclude 블록 추가**

`result.songs.map((s, i) => {` 바로 아래의 변수 선언부:

```tsx
            const isRegenerating = regenerating === i
            const stylePrompt = (s.stylePrompt ?? '').trim()
```

에 한 줄 추가:

```tsx
            const isRegenerating = regenerating === i
            const stylePrompt = (s.stylePrompt ?? '').trim()
            const excludeStyles = s.excludeStyles ?? []
```

summary 안의 `CopyButton` text를 교체:

기존:

```tsx
                    <CopyButton
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}\n\n${s.lyrics}`}
                    />
```

교체:

```tsx
                    <CopyButton
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}${excludeStyles.length > 0 ? `\n\n--- Exclude Styles ---\n${excludeStyles.join(', ')}` : ''}\n\n${s.lyrics}`}
                    />
```

- [ ] **Step 2: Style Prompt 섹션 아래 두 섹션 추가**

기존 Style Prompt 섹션 블록(`{stylePrompt && ( <section ... 🎛️ Style Prompt ... </section> )}`) **바로 다음**에 추가:

```tsx
                  {excludeStyles.length > 0 && (
                    <section className="mb-3 rounded-lg border-l-2 border-rose-300 bg-rose-50/50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">🚫 Exclude Styles (Suno Exclude 입력란용)</span>
                        <CopyButton text={excludeStyles.join(', ')} />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {excludeStyles.map((x, j) => (
                          <span
                            key={j}
                            lang="en"
                            className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 font-mono text-xs text-zinc-800 ring-1 ring-rose-200"
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {s.sliderHint && (
                    <section className="mb-3 rounded-lg border-l-2 border-amber-300 bg-amber-50/50 px-3 py-2">
                      <div className="mb-1 text-xs font-medium text-zinc-500">🎚️ 슬라이더 추천</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-amber-200">
                          Weirdness {s.sliderHint.weirdness}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-amber-200">
                          Style Influence {s.sliderHint.styleInfluence}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{s.sliderHint.note}</p>
                    </section>
                  )}
```

- [ ] **Step 3: lint/build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 4: Commit**

```bash
git add components/ResultPanel.tsx
git commit -m "feat: 곡 카드에 Exclude Styles·슬라이더 추천 섹션 추가"
```

---

### Task 7: E2E 검증

**Files:**
- 수정 없음 (검증 전용)

**Interfaces:**
- Consumes: Task 1~6 전체.
- Produces: 스펙 5장 검증 계획의 통과 기록.

- [ ] **Step 1: 빌드·린트 최종 확인**

Run: `npm run lint && npm run build`
Expected: 통과

- [ ] **Step 2: mock UI 렌더 확인 (playwriter headless)**

`AI_PROVIDER=mock`으로 dev 서버를 띄운 뒤, mock 검증은 Task 4 Step 3처럼 curl로 이미 확인했으므로 여기서는 **실제 화면**을 본다. 단 UI는 항상 `model: gemini-*`를 보내므로 화면 검증은 실제 Gemini로 진행한다 (`.env.local`의 GOOGLE_API_KEY 사용):

```bash
npm run dev &
```

playwriter(headless 세션)로:
1. `localhost:3000` 접속, 하이드레이션/콘솔 에러 없는지 확인
2. 장르 1개(예: 발라드) 선택 → "1곡 생성" 클릭 → 결과 대기(최대 60초)
3. 곡 카드에 `🚫 Exclude Styles` 섹션(칩 2~5개)과 `🎚️ 슬라이더 추천` 섹션(Weirdness/Style Influence 배지 + note)이 렌더되는지 확인
4. Exclude 복사 버튼 클릭 → "복사됨" 표시 확인

Expected: 두 섹션 정상 렌더, 콘솔 에러 없음.

- [ ] **Step 3: 생성 품질 육안 검증 (1곡 + 10곡)**

1곡 생성 결과에서:
- lyrics가 `[Intro]`로 시작, `[Outro]`(1~2줄) + `[End]`로 끝나는지
- stylePrompt 디스크립터가 4~7개, 주 장르가 맨 앞인지, `Target duration` 문구가 없는지
- excludeStyles 2~5개, stylePrompt와 모순 없는지
- sliderHint enum 값이 허용 문자열인지

10곡 생성 1회 실행 후:
- 10곡의 stylePrompt가 서로 다른지 (마이크로장르/악기/시대/질감 레버 변화)
- 응답 시간이 120초 타임아웃 안에 들어오는지

Expected: 전 항목 충족. 미충족 항목은 SYSTEM_PROMPT 해당 규칙의 강조 수위를 높여 재시도(1변수씩).

- [ ] **Step 4: 구 히스토리 하위 호환 확인**

히스토리 드로어에서 업그레이드 이전에 생성된 항목을 열어:
- Exclude/슬라이더 섹션이 **표시되지 않고** 나머지가 정상 렌더되는지 확인.

Expected: 오류 없이 기존 필드만 표시.

- [ ] **Step 5: 최종 커밋 (잔여 변경이 있는 경우만)**

```bash
git status --short   # 잔여 변경 확인
```

Expected: 클린 트리 (Task별 커밋 완료 상태)

---

## 스펙 커버리지 매핑

| 스펙 섹션 | 태스크 |
|---|---|
| 1. 데이터 모델 & 스키마 | Task 1, 2, 5 |
| 2-a~2-h. SYSTEM_PROMPT 개편 | Task 3 |
| 3. UI 변경 | Task 6 |
| 4. 하위 호환 & 프로바이더 (mock 포함) | Task 1(optional 타입), 4, 6(조건부 렌더) |
| 5. 검증 계획 | Task 7 (+ 각 태스크의 lint/build) |
