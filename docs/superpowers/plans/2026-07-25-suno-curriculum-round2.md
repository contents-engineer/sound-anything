# 수노 커리큘럼 2차 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 커리큘럼 2차 대조 평가에서 확인된 격차 8건을 반영한다 — 인스트루멘털 3중 차단, 프롬프트 정밀도 3건, 보컬 고정·듀엣 규약, 플레이리스트 일관성(trackRole), Extend 지원, 증상 기반 재생성.

**Architecture:** LLM 시스템 프롬프트(`lib/promptBuilder.ts`)와 응답 스키마(trackRole 필드 신설)를 확장하고, 기존 `GenerationExtras.retryHint` 배관을 API/UI까지 연결한다. UI는 `ResultPanel` 단일 파일 패턴을 유지한다.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind CSS v4, @google/genai 2.11.

## Global Constraints

- 이 저장소는 관례상 **main에 직접 커밋**한다 (사용자 승인됨).
- 테스트 러너 없음. 각 태스크 검증은 `npm run lint`(+ 다중 파일 태스크는 `npm run build`) 통과로 한다.
- Next.js 16.2.6은 훈련 데이터와 다를 수 있음 — Next API를 새로 만질 일이 생기면 `node_modules/next/dist/docs/` 먼저 확인 (이 계획의 태스크들은 Next API를 새로 도입하지 않음).
- **하위 호환**: localStorage 히스토리(`suno-lyrics:history`)의 구 포맷 엔트리(trackRole/excludeStyles/sliderHint 없음, `(Instrumental)` 가사)가 계속 렌더돼야 한다. 새 필드는 TS 타입에서 옵셔널.
- Gemini responseSchema 규약: `minItems`/`maxItems`는 **문자열**, enum은 `{ type: Type.STRING, format: 'enum', enum: [...] }`, null 허용은 `nullable: true`.
- 커리큘럼 고정값 (그대로 사용):
  - 인스트루멘털 3중 차단: Style `instrumental, no vocals` / Lyrics `[Instrumental]` / Exclude `vocals, singing, chanting, vocal samples`
  - 루프 유발어: `hypnotic, looping, endless`
  - 저중역 질감 계열: `dark, warm, lush, heavy, thick, reverb-heavy` — 곡당 최대 2개
  - 음절: Verse 8~10 / Chorus 10~12, 줄 간 일관성 우선
  - 듀엣: Style에 `Duet`, 매 가사 줄 `[Male]`/`[Female]` 라벨, `[Both]` 훅 1줄만, 전환 4~6회
  - trackRole enum: `['opener', 'depth', 'energy lift', 'interlude', 'climax', 'closer']` — opener 1(1번째)/closer 1(10번째)/climax 1(7~9번째)/interlude 1~2/energy lift 2~3/depth 2~3
- SYSTEM_PROMPT 편집은 아래 명시된 old→new 문자열 교체를 **그대로** 적용한다(표현 임의 변경 금지).

---

### Task 1: 타입 확장 (TRACK_ROLES, trackRole, retryHint)

**Files:**
- Modify: `types.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `export const TRACK_ROLES`, `export type TrackRole`, `SongConcept.trackRole?: TrackRole | null`, `ApiRequest.retryHint?: string` — Task 3~6이 import.

- [ ] **Step 1: TRACK_ROLES 상수와 TrackRole 타입 추가**

`types.ts`에서 다음을:

```ts
export const WEIRDNESS_LEVELS = ['0-20%', '20-40%', '40-60%', '60-80%'] as const
```

다음으로 교체:

```ts
export const TRACK_ROLES = ['opener', 'depth', 'energy lift', 'interlude', 'climax', 'closer'] as const
export type TrackRole = (typeof TRACK_ROLES)[number]

export const WEIRDNESS_LEVELS = ['0-20%', '20-40%', '40-60%', '60-80%'] as const
```

- [ ] **Step 2: SongConcept에 trackRole 추가**

```ts
  sliderHint?: SliderHint
  lyrics: string
```

다음으로 교체:

```ts
  sliderHint?: SliderHint
  trackRole?: TrackRole | null
  lyrics: string
```

- [ ] **Step 3: ApiRequest에 retryHint 추가**

```ts
export type ApiRequest = {
  selections: Selections
  mode: GenerationMode
  model?: string
  excludeTitles?: string[]
}
```

다음으로 교체:

```ts
export type ApiRequest = {
  selections: Selections
  mode: GenerationMode
  model?: string
  excludeTitles?: string[]
  retryHint?: string
}
```

- [ ] **Step 4: lint 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add types.ts
git commit -m "feat: TRACK_ROLES·trackRole·retryHint 타입 추가"
```

---

### Task 2: SYSTEM_PROMPT 정확성·정밀도 개편

인스트루멘털 3중 차단, 루프 유발어, muddy 다이어트, 음절 가이드, phonetic respelling, 보컬 고정·듀엣 규약. 모두 `lib/promptBuilder.ts`의 `SYSTEM_PROMPT` 템플릿 리터럴 내부 문자열 교체다. **old 문자열은 파일에 현재 그대로 존재한다 — 정확히 일치시켜 교체할 것.**

**Files:**
- Modify: `lib/promptBuilder.ts` (SYSTEM_PROMPT만)

**Interfaces:**
- Consumes: 없음.
- Produces: 프롬프트 규칙 (Task 5 mock, Task 7 검증이 이 규칙과 일치해야 함) — 연주곡 lyrics는 정확히 `[Instrumental]`, 연주곡 exclude 4종, 듀엣 라벨 규약.

- [ ] **Step 1: 보컬 3계층 규칙에 연주곡 예외·듀엣 디스크립터 추가**

old:

```
- 보컬은 3계층으로 씁니다: Character(누가 — raspy female vocals), Delivery(어떻게 — breathy, powerful belt), Effects(질감 — reverb-drenched, 필요할 때만). 최소 Character+Delivery는 지정합니다.
```

new:

```
- 보컬은 3계층으로 씁니다: Character(누가 — raspy female vocals), Delivery(어떻게 — breathy, powerful belt), Effects(질감 — reverb-drenched, 필요할 때만). 최소 Character+Delivery는 지정합니다.
- **연주곡(가사없는 연주곡) 예외**: 보컬 디스크립터를 일절 쓰지 말고, 대신 "instrumental"과 "no vocals" 두 디스크립터를 반드시 포함합니다.
- **듀엣**(남성·여성 보컬을 함께 선택했거나 듀엣을 요청한 곡): "Duet"을 디스크립터로 반드시 포함합니다.
```

- [ ] **Step 2: muddy 다이어트 규칙 추가**

old:

```
- 무드는 한 방향만. aggressive와 peaceful 병치 금지 — 대비가 필요하면 태그가 아니라 가사 구조(조용한 [Verse] → 터지는 [Chorus])로 만듭니다.
```

new:

```
- 무드는 한 방향만. aggressive와 peaceful 병치 금지 — 대비가 필요하면 태그가 아니라 가사 구조(조용한 [Verse] → 터지는 [Chorus])로 만듭니다.
- 저중역 질감 계열 디스크립터(dark, warm, lush, heavy, thick, reverb-heavy 등)는 곡당 **최대 2개** — 뭉개진(muddy) 믹스를 예방합니다. 무드상 이 계열이 몰리면 하나를 clean mix 또는 hi-fi production으로 대체합니다.
```

- [ ] **Step 3: 금지 목록에 루프 유발어 추가**

old:

```
- 금지: 추상어(epic, beautiful, amazing, emotional), 명령문(make the drums louder), 실제 아티스트명, "Target duration ..." 같은 길이 지시.
```

new:

```
- 금지: 추상어(epic, beautiful, amazing, emotional), 명령문(make the drums louder), 실제 아티스트명, "Target duration ..." 같은 길이 지시, 무한 루프 유발어(hypnotic, looping, endless).
```

- [ ] **Step 4: excludeStyles 규칙에 연주곡·보컬 성별 규칙 추가**

old:

```
- stylePrompt와 모순 금지: exclude에 넣은 요소를 stylePrompt에 쓰지 마세요.
```

new:

```
- stylePrompt와 모순 금지: exclude에 넣은 요소를 stylePrompt에 쓰지 마세요. 단 연주곡의 "no vocals"(stylePrompt)와 "vocals"(exclude)는 모순이 아니라 의도된 이중 차단입니다.
- **연주곡은 반드시** "vocals", "singing", "chanting", "vocal samples" 4개를 포함합니다(필요하면 콘셉트별 1개를 더해 5개까지).
- 보컬 성별이 고정된 곡은 반대 성별을 포함합니다: 여성 보컬 곡 → "male vocals", 남성 보컬 곡 → "female vocals". 듀엣 곡에는 적용하지 않습니다.
```

- [ ] **Step 5: 가사 구조에 보컬 고정 태그 규칙 추가**

old:

```
모든 곡은 [Intro]로 시작하고 [Outro] + [End]로 끝납니다.
- [Intro]는 태그만 쓰고 가사를 넣지 않습니다(연주 인트로). [End]도 태그만 쓰고 가사를 넣지 않습니다.
```

new:

```
모든 곡은 [Intro]로 시작하고 [Outro] + [End]로 끝납니다.
- 보컬 성별이 고정된 곡(여성 또는 남성 보컬만 선택)은 lyrics **첫 줄**에 [Female Vocals] 또는 [Male Vocals] 태그 한 줄을 놓아 보컬을 고정하고, 그 다음 줄부터 [Intro]로 시작합니다. 연주곡·듀엣 곡·성별 미지정 곡에는 쓰지 않습니다.
- [Intro]는 태그만 쓰고 가사를 넣지 않습니다(연주 인트로). [End]도 태그만 쓰고 가사를 넣지 않습니다.
```

- [ ] **Step 6: 형식 규칙 4 — 음절 가이드로 교체**

old:

```
4. 한 줄은 한 호흡으로 부를 길이 — 한국어 기준 대략 10~18자, 영어 기준 5~8단어.
```

new:

```
4. 한 줄은 한 호흡으로 부를 길이 — Verse 줄은 8~10음절, Chorus 줄은 10~12음절을 기준으로 합니다(한국어는 글자 수 ≒ 음절 수, 영어는 대략 5~8단어). 정확한 카운트보다 **줄 간 길이 일관성**이 중요합니다. 어떤 줄도 영어 12단어 / 한국어 18자를 넘기지 마세요.
```

- [ ] **Step 7: 형식 규칙 7 — 허용 태그에 보컬 지정 태그 추가**

old:

```
7. 허용 태그는 [Intro] [Verse N] [Chorus] [Bridge] [Outro] [End]와 아래 편곡 파라미터 문법뿐입니다. Pre-Chorus, Hook, Drop 같은 다른 태그는 사용하지 마세요.
```

new:

```
7. 허용 태그는 [Intro] [Verse N] [Chorus] [Bridge] [Outro] [End], 보컬 지정 태그([Female Vocals] [Male Vocals]는 첫 줄 전용 · [Male] [Female] [Both]는 듀엣 가사 줄 라벨 전용), 그리고 아래 편곡 파라미터 문법뿐입니다. Pre-Chorus, Hook, Drop 같은 다른 태그는 사용하지 마세요.
```

- [ ] **Step 8: 형식 규칙 8 — [Instrumental] 대괄호로 교체**

old:

```
8. "가사없는 연주곡" 옵션이거나 보컬에 "가사없는 연주곡"이 선택되면 lyrics 필드는 정확히 "(Instrumental)" 한 줄만 채웁니다.
```

new:

```
8. "가사없는 연주곡" 옵션이거나 보컬에 "가사없는 연주곡"이 선택되면 lyrics 필드는 정확히 "[Instrumental]" 한 줄만 채웁니다. 소괄호 "(Instrumental)"는 가사로 불릴 수 있으므로 반드시 대괄호 표기를 씁니다.
```

- [ ] **Step 9: 동철이음어 규칙 + 듀엣 규약 섹션 추가**

old:

```
- 숫자는 절대 숫자로 쓰지 말고 발음대로 씁니다: 한국어 가사는 한글로(3월→삼월, 1시→한 시), 영어 가사는 단어로(3am→three A-M, 24/7→twenty four seven). 약어는 철자를 분리합니다(AI→A-I, DJ→dee-jay).

# 가사 언어
```

new:

```
- 숫자는 절대 숫자로 쓰지 말고 발음대로 씁니다: 한국어 가사는 한글로(3월→삼월, 1시→한 시), 영어 가사는 단어로(3am→three A-M, 24/7→twenty four seven). 약어는 철자를 분리합니다(AI→A-I, DJ→dee-jay).
- 영어 동철이음어는 발음대로 표기합니다: live(공연)→laiv, read(과거형)→red, bass(악기)→bayss. 같은 단어는 곡 전체에서 동일한 표기를 유지합니다.

# 듀엣 규약 (남성·여성 보컬을 함께 쓰는 곡 전용)

- 가사의 **모든 가사 줄** 앞에 [Male] 또는 [Female] 라벨을 붙입니다: "[Male] 어두운 골목 끝에서". 맨 위에 한 번만 쓰면 중간에 무너집니다.
- [Both]는 후렴 훅 **한 줄**에만 허용합니다.
- 목소리 전환(라벨이 바뀌는 지점)은 곡 전체 4~6회 이내 — 줄마다 번갈지 말고 블록 단위로 묶습니다.
- 섹션 헤더는 라벨 없이 그대로 둡니다. 듀엣이 아닌 곡에는 [Male] [Female] [Both]를 절대 쓰지 않습니다.

# 가사 언어
```

- [ ] **Step 10: 자체 검토 — 구조 점검 갱신**

old:

```
[구조·형식 점검]
- lyrics가 [Intro]로 시작하고 [Outro] + [End]로 끝나는가. [Outro] 줄 수(1~2줄)와 본문 섹션 줄 수가 길이별 표와 일치하는가. ("(Instrumental)" 한 줄짜리 lyrics는 이 구조 점검에서 제외)
- 반복 [Chorus]가 헤더·가사 완전 동일한가.
- 편곡 파라미터 태그가 곡당 1~2개 이내이고, 기호·배킹보컬 합계가 3~6회 이내인가.
- stylePrompt 디스크립터가 4~7개이고 주 장르가 맨 앞인가. 추상어·명령문·아티스트명·길이 지시가 없는가.
- excludeStyles가 2~5개이고 stylePrompt와 모순되지 않는가.
```

new:

```
[구조·형식 점검]
- lyrics가 [Intro]로 시작하고(보컬 고정 태그가 있으면 그 다음 줄부터) [Outro] + [End]로 끝나는가. [Outro] 줄 수(1~2줄)와 본문 섹션 줄 수가 길이별 표와 일치하는가. ("[Instrumental]" 한 줄짜리 lyrics는 이 구조 점검에서 제외)
- 반복 [Chorus]가 헤더·가사 완전 동일한가.
- 편곡 파라미터 태그가 곡당 1~2개 이내이고, 기호·배킹보컬 합계가 3~6회 이내인가.
- stylePrompt 디스크립터가 4~7개이고 주 장르가 맨 앞인가. 추상어·명령문·아티스트명·길이 지시·루프 유발어가 없는가. 저중역 질감 계열이 3개 이상 겹치지 않는가.
- excludeStyles가 2~5개이고 stylePrompt와 모순되지 않는가.
- 연주곡이면: lyrics가 정확히 "[Instrumental]" 한 줄인가, stylePrompt에 instrumental·no vocals가 있고 보컬 디스크립터가 없는가, excludeStyles에 vocals·singing·chanting·vocal samples 4개가 모두 있는가.
- 듀엣이면: 모든 가사 줄에 [Male]/[Female] 라벨이 있는가, 전환이 4~6회 이내인가, [Both]가 최대 1줄인가. 듀엣이 아니면 이 라벨이 하나도 없는가.
```

- [ ] **Step 11: 자체 검토 — 마지막 줄 표기 교체**

old:

```
- "(Instrumental)" 한 줄짜리 lyrics는 구조·문법 검토 대상이 아닙니다.
```

new:

```
- "[Instrumental]" 한 줄짜리 lyrics는 구조·문법 검토 대상이 아닙니다.
```

- [ ] **Step 12: lint 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 13: 커밋**

```bash
git add lib/promptBuilder.ts
git commit -m "feat: 인스트루멘털 3중 차단·정밀도 규칙·보컬 고정·듀엣 규약 프롬프트 반영"
```

---

### Task 3: 플레이리스트 일관성 프롬프트 + trackRole 스키마 (promptBuilder)

**Files:**
- Modify: `lib/promptBuilder.ts` (SYSTEM_PROMPT, RESPONSE_SCHEMA, buildUserPrompt)

**Interfaces:**
- Consumes: `TRACK_ROLES` (types.ts, Task 1).
- Produces: SYSTEM_PROMPT의 "# 플레이리스트 일관성" 섹션 + RESPONSE_SCHEMA에 trackRole. Task 4의 프로바이더 스키마가 이 계약과 동일해야 함.

- [ ] **Step 1: import에 TRACK_ROLES 추가**

old:

```ts
import { STYLE_INFLUENCE_LEVELS, WEIRDNESS_LEVELS } from '@/types'
```

new:

```ts
import { STYLE_INFLUENCE_LEVELS, TRACK_ROLES, WEIRDNESS_LEVELS } from '@/types'
```

- [ ] **Step 2: stylePrompt full-mode 차별화 규칙에 앵커 단서 추가**

old:

```
- mode가 "full"이면 10곡의 stylePrompt가 서로 명확히 달라야 하며, 곡마다 차별화 레버 중 최소 1개를 다르게 씁니다.
```

new:

```
- mode가 "full"이면 10곡의 stylePrompt가 서로 명확히 달라야 하며, 곡마다 차별화 레버 중 최소 1개를 다르게 씁니다. 단, 그 차이는 아래 "플레이리스트 일관성" 섹션의 앵커를 깨지 않는 범위에서 만듭니다.
```

- [ ] **Step 3: 나머지 필드 목록에 trackRole 설명 추가**

old:

```
- "concept": 2~3문장의 한국어 설명. 곡의 분위기·이미지·훅 아이디어 마케팅 메모처럼. 가사 본문을 인용하지 마세요.
```

new:

```
- "concept": 2~3문장의 한국어 설명. 곡의 분위기·이미지·훅 아이디어 마케팅 메모처럼. 가사 본문을 인용하지 마세요.
- "trackRole": mode가 "full"이면 아래 "플레이리스트 일관성" 규칙에 따라 배정합니다. mode가 "single"이면 null로 둡니다.
```

- [ ] **Step 4: "# 플레이리스트 일관성" 섹션 신설**

"# 저작권" 섹션 바로 앞에 삽입한다. old:

```
# 저작권
```

new:

```
# 플레이리스트 일관성 (mode: "full" 전용)

10곡은 각각 따로 노는 곡이 아니라, 한 채널에서 연속 재생되는 **하나의 플레이리스트**입니다.

- 앵커 고정: 모든 곡이 같은 장르 패밀리 안에 있고, 핵심 악기 1~2개와 보컬 캐릭터를 공유합니다(사용자 선택에서 도출).
- 변수 분리: 곡 간 차이는 템포·에너지·편곡 밀도·마이크로장르 변형·무드의 폭으로 만듭니다. 앵커를 바꾸는 차별화는 금지.
- trackRole 배정(정확히 10곡 합계): "opener" 1곡 — 반드시 1번째, "closer" 1곡 — 반드시 10번째, "climax" 1곡 — 7~9번째 중, "interlude" 1~2곡, "energy lift" 2~3곡, "depth" 나머지 2~3곡.
- songs 배열 순서 = 재생 순서. 3막 구조로 배열합니다: 1~3번 도입(arrival), 4~7번 여정(journey), 8~10번 해소(resolution).
- 역할이 곡에 드러나야 합니다: interlude는 편곡 밀도를 낮추고, climax는 에너지 정점, closer는 해소감으로 마무리.

# 저작권
```

- [ ] **Step 5: RESPONSE_SCHEMA에 trackRole 추가**

old:

```ts
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
```

new:

```ts
          sliderHint: {
            type: 'object',
            properties: {
              weirdness: { type: 'string', enum: [...WEIRDNESS_LEVELS] },
              styleInfluence: { type: 'string', enum: [...STYLE_INFLUENCE_LEVELS] },
              note: { type: 'string' },
            },
            required: ['weirdness', 'styleInfluence', 'note'],
          },
          trackRole: { type: ['string', 'null'], enum: [...TRACK_ROLES, null] },
          lyrics: { type: 'string' },
        },
        required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'trackRole', 'lyrics'],
```

- [ ] **Step 6: buildUserPrompt 모드 안내에 trackRole·앵커 반영**

old:

```ts
    lines.push('- songs 배열은 반드시 정확히 10개. 9개나 11개는 허용되지 않습니다. 각 곡의 콘셉트·stylePrompt·excludeStyles·가사를 모두 다르게 작성하세요.')
  } else if (mode === 'single') {
    lines.push('- songs 배열은 반드시 정확히 1개. 해당 곡 전용 영문 stylePrompt·excludeStyles·sliderHint를 포함하세요.')
```

new:

```ts
    lines.push('- songs 배열은 반드시 정확히 10개. 9개나 11개는 허용되지 않습니다. 각 곡의 콘셉트·stylePrompt·excludeStyles·가사를 모두 다르게 작성하되, 하나의 플레이리스트로서 앵커(장르 패밀리·핵심 악기·보컬 캐릭터)를 공유하고 trackRole을 규칙대로 배정하세요.')
  } else if (mode === 'single') {
    lines.push('- songs 배열은 반드시 정확히 1개. 해당 곡 전용 영문 stylePrompt·excludeStyles·sliderHint를 포함하고, trackRole은 null로 둡니다.')
```

- [ ] **Step 7: lint 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 8: 커밋**

```bash
git add lib/promptBuilder.ts
git commit -m "feat: 플레이리스트 일관성(앵커+trackRole) 프롬프트·스키마 반영"
```

---

### Task 4: 프로바이더 스키마 + API route (trackRole·retryHint)

**Files:**
- Modify: `lib/ai/gemini.ts`, `lib/ai/anthropic.ts`, `lib/ai/openai.ts`, `app/api/generate/route.ts`

**Interfaces:**
- Consumes: `TRACK_ROLES` (Task 1), `ApiRequest.retryHint` (Task 1), `GenerationExtras.retryHint` (기존).
- Produces: `/api/generate`가 body.retryHint를 프롬프트에 전달하고, 응답 songs의 trackRole을 enum 밖 값이면 null로 정규화.

- [ ] **Step 1: gemini.ts — SONG_SCHEMA에 trackRole**

import old:

```ts
import { STYLE_INFLUENCE_LEVELS, WEIRDNESS_LEVELS } from '@/types'
```

new:

```ts
import { STYLE_INFLUENCE_LEVELS, TRACK_ROLES, WEIRDNESS_LEVELS } from '@/types'
```

SONG_SCHEMA old:

```ts
    sliderHint: SLIDER_HINT_SCHEMA,
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'lyrics'],
```

new:

```ts
    sliderHint: SLIDER_HINT_SCHEMA,
    trackRole: { type: Type.STRING, format: 'enum', enum: [...TRACK_ROLES], nullable: true },
    lyrics:   { type: Type.STRING },
  },
  required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'trackRole', 'lyrics'],
```

- [ ] **Step 2: anthropic.ts — TOOL input_schema에 trackRole**

import old:

```ts
import { STYLE_INFLUENCE_LEVELS, WEIRDNESS_LEVELS } from '@/types'
```

new:

```ts
import { STYLE_INFLUENCE_LEVELS, TRACK_ROLES, WEIRDNESS_LEVELS } from '@/types'
```

TOOL old:

```ts
            lyrics: { type: 'string' },
          },
          required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'lyrics'],
```

new:

```ts
            trackRole: { type: ['string', 'null'], enum: [...TRACK_ROLES, null] },
            lyrics: { type: 'string' },
          },
          required: ['title', 'titles', 'concept', 'stylePrompt', 'excludeStyles', 'sliderHint', 'trackRole', 'lyrics'],
```

- [ ] **Step 3: openai.ts — 재시도 shape 힌트에 trackRole**

old:

```ts
      parsed = await call('이전 응답이 JSON 스키마를 어겼습니다. 반드시 {"prompt": string, "songs": null | Array<{title,titles,concept,stylePrompt,excludeStyles,sliderHint,lyrics}>} 형태로만 답하세요.')
```

new:

```ts
      parsed = await call('이전 응답이 JSON 스키마를 어겼습니다. 반드시 {"prompt": string, "songs": null | Array<{title,titles,concept,stylePrompt,excludeStyles,sliderHint,trackRole,lyrics}>} 형태로만 답하세요.')
```

- [ ] **Step 4: route.ts — retryHint 수용·병합 + trackRole 정규화**

import old:

```ts
import type { ApiError, ApiRequest, GenerationExtras, GenerationResult } from '@/types'
```

new:

```ts
import type { ApiError, ApiRequest, GenerationExtras, GenerationResult } from '@/types'
import { TRACK_ROLES } from '@/types'
```

extras 구성 old:

```ts
  const extras: GenerationExtras = {}
  if (body.excludeTitles && body.excludeTitles.length > 0) extras.excludeTitles = body.excludeTitles
```

new:

```ts
  const extras: GenerationExtras = {}
  if (body.excludeTitles && body.excludeTitles.length > 0) extras.excludeTitles = body.excludeTitles
  if (typeof body.retryHint === 'string' && body.retryHint.trim().length > 0) extras.retryHint = body.retryHint.trim()
```

곡 수 재시도 old:

```ts
      if (got !== want) {
        const retryHint = `이전 응답의 songs 배열은 ${got}개였습니다. 반드시 정확히 ${want}개여야 합니다. 누락된 곡을 채워 다시 만들고, 모든 곡의 콘셉트·제목·stylePrompt·가사를 서로 다르게 작성하세요.`
        partial = await provider.generate(body.selections, body.mode, { ...extras, retryHint })
      }
```

new (사용자 retryHint를 덮어쓰지 않고 병합):

```ts
      if (got !== want) {
        const countHint = `이전 응답의 songs 배열은 ${got}개였습니다. 반드시 정확히 ${want}개여야 합니다. 누락된 곡을 채워 다시 만들고, 모든 곡의 콘셉트·제목·stylePrompt·가사를 서로 다르게 작성하세요.`
        const retryHint = [extras.retryHint, countHint].filter(Boolean).join(' ')
        partial = await provider.generate(body.selections, body.mode, { ...extras, retryHint })
      }
```

결과 조립 old:

```ts
      songs: partial.songs
        ? partial.songs.map((s) =>
            Array.isArray(s.excludeStyles) ? { ...s, excludeStyles: s.excludeStyles.slice(0, 5) } : s,
          )
        : partial.songs,
```

new:

```ts
      songs: partial.songs
        ? partial.songs.map((s) => ({
            ...s,
            ...(Array.isArray(s.excludeStyles) ? { excludeStyles: s.excludeStyles.slice(0, 5) } : {}),
            trackRole:
              s.trackRole && (TRACK_ROLES as readonly string[]).includes(s.trackRole) ? s.trackRole : null,
          }))
        : partial.songs,
```

- [ ] **Step 5: lint + build 확인**

Run: `npm run lint && npm run build`
Expected: 둘 다 통과.

- [ ] **Step 6: 커밋**

```bash
git add lib/ai/gemini.ts lib/ai/anthropic.ts lib/ai/openai.ts app/api/generate/route.ts
git commit -m "feat: 프로바이더 스키마·route에 trackRole 및 사용자 retryHint 반영"
```

---

### Task 5: mock 프로바이더 — 연주곡 분기 + trackRole

**Files:**
- Modify: `lib/ai/mock.ts`

**Interfaces:**
- Consumes: `TrackRole` 타입 (Task 1), Task 2의 연주곡 계약(lyrics `[Instrumental]`, exclude 4종, style에 instrumental·no vocals).
- Produces: 키 없는 E2E 검증용 목업 데이터 (Task 7이 사용 가능).

- [ ] **Step 1: import에 TrackRole 추가**

old:

```ts
import type { GenerationExtras, GenerationMode, GenerationResult, Selections, SongConcept } from '@/types'
```

new:

```ts
import type { GenerationExtras, GenerationMode, GenerationResult, Selections, SongConcept, TrackRole } from '@/types'
```

- [ ] **Step 2: 연주곡 판정 + 역할 배열 + songs 생성 교체**

old:

```ts
    const songCount = mode === 'single' ? 1 : 10
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

new:

```ts
    const instrumental =
      opts.vocal.includes('가사없는 연주곡') || opts.topic.includes('가사없는(연주곡)')

    // opener 1(1번째)·closer 1(10번째)·climax 1(7번째)·interlude 1·energy lift 3·depth 3
    const MOCK_ROLES: TrackRole[] = [
      'opener', 'depth', 'energy lift', 'interlude', 'depth',
      'energy lift', 'climax', 'depth', 'energy lift', 'closer',
    ]

    const songCount = mode === 'single' ? 1 : 10
    const songs: SongConcept[] = Array.from({ length: songCount }, (_, i) => ({
      title: `목업 트랙 ${i + 1}`,
      titles: {
        ko: `목업 트랙 ${i + 1}`,
        en: `Mock Track ${i + 1}`,
        ja: `モックトラック ${i + 1}`,
      },
      concept: `${summary} 분위기를 살린 ${opts.lengthMin}분짜리 트랙의 콘셉트 메모 ${i + 1}번. 실제 LLM 응답은 분위기·이미지·훅 아이디어를 두세 문장으로 묘사합니다.`,
      stylePrompt: instrumental
        ? `Mock ambient instrumental ${i + 1}, instrumental, no vocals, warm analog production`
        : `Mock playlist-ready style, distinct song concept ${i + 1}, cinematic hook, expressive vocal texture`,
      excludeStyles: instrumental
        ? ['vocals', 'singing', 'chanting', 'vocal samples']
        : ['edm drops', 'distorted guitar', 'crowd noise'].slice(0, 2 + (i % 2)),
      sliderHint: {
        weirdness: '40-60%',
        styleInfluence: '50-70%',
        note: `목업 추천 ${i + 1}: 창의성과 일관성의 기본 균형 구간입니다.`,
      },
      trackRole: mode === 'full' ? MOCK_ROLES[i] : null,
      lyrics: instrumental ? '[Instrumental]' : mockLyrics(i + 1),
    }))
```

- [ ] **Step 3: lint 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/ai/mock.ts
git commit -m "feat: mock에 연주곡 3중 차단·trackRole 반영"
```

---

### Task 6: UI — 역할 배지·Extend 후반부·증상 재생성·슬라이더 복사

**Files:**
- Modify: `components/ResultPanel.tsx`, `app/page.tsx`, `components/LengthSlider.tsx`

**Interfaces:**
- Consumes: `SongConcept.trackRole` (Task 1), `/api/generate`의 retryHint (Task 4).
- Produces: `ResultPanelProps.onRegenerate?: (index: number, retryHint?: string) => void` — page.tsx의 `regenerateSong`이 이 시그니처를 구현.

- [ ] **Step 1: ResultPanel — 역할 라벨·처방·Extend 헬퍼 추가**

`ResultPanel.tsx`에서 old:

```tsx
type ChipItem = { label: string; emoji?: string; sectionKey?: SectionKey }
```

new:

```tsx
const ROLE_LABELS: Record<string, string> = {
  opener: '🎬 오프너',
  depth: '🌊 깊이 트랙',
  'energy lift': '⚡ 에너지 리프트',
  interlude: '🌙 인터루드',
  climax: '🔥 클라이맥스',
  closer: '🌅 클로저',
}

// M5 증상→처방 매핑표 기반 재생성 힌트
const RETRY_PRESCRIPTIONS: { label: string; hint: string }[] = [
  {
    label: '🩺 보컬이 웅얼거림',
    hint: '이전 곡은 보컬이 웅얼거렸습니다. 가사를 1~3음절 단어 위주로 다시 쓰고, stylePrompt에 crisp enunciation을 추가하고 hazy·dreamy·distant 계열 디스크립터를 제거하세요.',
  },
  {
    label: '🩺 장르가 튐',
    hint: '이전 곡은 의도한 장르에서 벗어났습니다. 주 장르를 맨 앞에 두고 더 좁은 마이크로장르로 뾰족하게 만들고, 충돌하는 무드·악기 신호를 제거하세요.',
  },
  {
    label: '🩺 믹스가 탁함',
    hint: '이전 곡은 믹스가 탁했습니다(muddy). 저중역 질감 디스크립터(dark, warm, lush, heavy, thick, reverb-heavy)를 최대 1개로 줄이고 clean mix, hi-fi production을 추가하세요.',
  },
  {
    label: '🩺 훅이 약함',
    hint: '이전 곡은 후렴 훅이 약했습니다. 더 반복적이고 따라 부르기 쉬운 훅 라인으로 후렴을 다시 쓰고, 후렴에 배킹보컬(소괄호) 콜앤리스폰스를 1~2회 넣으세요.',
  },
]

// Suno 초기 생성 상한(약 4~8분) 대응: [Verse 3]부터를 Extend용으로 분리
function getExtendChunk(lyrics: string): string | null {
  const idx = lyrics.indexOf('[Verse 3]')
  return idx > 0 ? lyrics.slice(idx).trim() : null
}

type ChipItem = { label: string; emoji?: string; sectionKey?: SectionKey }
```

- [ ] **Step 2: onRegenerate 시그니처 변경**

old:

```tsx
type ResultPanelProps = {
  result: GenerationResult
  onRegenerate?: (index: number) => void
  regenerating?: number | null
}
```

new:

```tsx
type ResultPanelProps = {
  result: GenerationResult
  onRegenerate?: (index: number, retryHint?: string) => void
  regenerating?: number | null
}
```

- [ ] **Step 3: 곡 루프 상단에 extendChunk 계산 추가**

old:

```tsx
            const stylePrompt = (s.stylePrompt ?? '').trim()
            const excludeStyles = s.excludeStyles ?? []
```

new:

```tsx
            const stylePrompt = (s.stylePrompt ?? '').trim()
            const excludeStyles = s.excludeStyles ?? []
            const extendChunk = getExtendChunk(s.lyrics)
```

- [ ] **Step 4: 제목 옆 역할 배지**

old:

```tsx
                      <h4 className="text-base font-semibold text-zinc-900">
                        {i + 1}. {s.title}
                      </h4>
                      {result.selections && <SongSummaryChips selections={result.selections} />}
```

new:

```tsx
                      <h4 className="text-base font-semibold text-zinc-900">
                        {i + 1}. {s.title}
                      </h4>
                      {s.trackRole && ROLE_LABELS[s.trackRole] && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          {ROLE_LABELS[s.trackRole]}
                        </span>
                      )}
                      {result.selections && <SongSummaryChips selections={result.selections} />}
```

- [ ] **Step 5: 곡 전체 복사 텍스트에 슬라이더 블록 추가**

old:

```tsx
                    <CopyButton
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}${excludeStyles.length > 0 ? `\n\n--- Exclude Styles ---\n${excludeStyles.join(', ')}` : ''}\n\n${s.lyrics}`}
                    />
```

new:

```tsx
                    <CopyButton
                      text={`${s.title}\n\n[KO] ${s.titles.ko}\n[EN] ${s.titles.en}\n[JA] ${s.titles.ja}${stylePrompt ? `\n\n--- Style Prompt ---\n${stylePrompt}` : ''}${excludeStyles.length > 0 ? `\n\n--- Exclude Styles ---\n${excludeStyles.join(', ')}` : ''}${s.sliderHint ? `\n\n--- Slider ---\nWeirdness ${s.sliderHint.weirdness} / Style Influence ${s.sliderHint.styleInfluence}\n${s.sliderHint.note}` : ''}\n\n${s.lyrics}`}
                    />
```

- [ ] **Step 6: 가사 섹션 뒤에 Extend 후반부 + 증상 재생성 섹션 추가**

old:

```tsx
                  <section className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">🎤 가사 (Suno 입력란용)</span>
                      <CopyButton text={s.lyrics} />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-800">{s.lyrics}</pre>
                  </section>
                </div>
```

new:

```tsx
                  <section className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">🎤 가사 (Suno 입력란용)</span>
                      <CopyButton text={s.lyrics} />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 font-mono text-sm leading-relaxed text-zinc-800">{s.lyrics}</pre>
                  </section>

                  {extendChunk && (
                    <section className="mt-3 rounded-lg border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-2">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-500">➕ Extend용 후반부 ([Verse 3]부터)</span>
                        <CopyButton text={extendChunk} />
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-600">
                        Suno 초기 생성은 보통 4~8분에서 끊깁니다. 곡이 끝까지 나오지 않으면 마지막 안정 구간에서
                        Extend를 누르고 이 후반부만 붙여넣으세요.
                      </p>
                    </section>
                  )}

                  {onRegenerate && (
                    <section className="mt-3">
                      <div className="mb-1 text-xs font-medium text-zinc-500">🔄 문제가 있나요? 증상을 골라 이 곡만 다시 생성</div>
                      <div className="flex flex-wrap gap-1.5">
                        {RETRY_PRESCRIPTIONS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            disabled={regenerating !== null && regenerating !== undefined}
                            onClick={() => onRegenerate(i, p.hint)}
                            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
```

- [ ] **Step 7: page.tsx — regenerateSong에 retryHint 파라미터**

old:

```tsx
  const regenerateSong = useCallback(async (index: number) => {
```

new:

```tsx
  const regenerateSong = useCallback(async (index: number, retryHint?: string) => {
```

fetch body old:

```tsx
        body: JSON.stringify({
          selections: baseSelections,
          mode: 'single',
          model: modelId,
          excludeTitles,
        }),
```

new:

```tsx
        body: JSON.stringify({
          selections: baseSelections,
          mode: 'single',
          model: modelId,
          excludeTitles,
          ...(retryHint ? { retryHint } : {}),
        }),
```

- [ ] **Step 8: LengthSlider — 6분+ 안내 한 줄**

old:

```tsx
        <p className="mt-1 text-xs text-zinc-500">가사 분량과 생성 프롬프트에 반영됩니다</p>
```

new:

```tsx
        <p className="mt-1 text-xs text-zinc-500">가사 분량과 생성 프롬프트에 반영됩니다 · 6분 이상은 Suno에서 한 번에 생성되지 않을 수 있어 Extend용 후반부 복사가 함께 제공됩니다</p>
```

- [ ] **Step 9: lint + build 확인**

Run: `npm run lint && npm run build`
Expected: 둘 다 통과.

- [ ] **Step 10: 커밋**

```bash
git add components/ResultPanel.tsx app/page.tsx components/LengthSlider.tsx
git commit -m "feat: 역할 배지·Extend 후반부·증상 재생성·슬라이더 복사 UI"
```

---

### Task 7: 통합 검증 (컨트롤러 직접 수행 — 실 Gemini)

서브에이전트가 아니라 컨트롤러가 dev 서버 + `.env.local`의 GOOGLE_API_KEY로 직접 수행한다.

- [ ] **Step 1:** `npm run lint && npm run build` 최종 통과 확인.
- [ ] **Step 2:** dev 서버 기동 후 4개 시나리오 생성:
  1. **연주곡 1곡** (장르 명상/치유 + 보컬 '가사없는 연주곡', 3분): lyrics가 정확히 `[Instrumental]`, stylePrompt에 `instrumental`·`no vocals` 포함 + 보컬 묘사 없음, excludeStyles ⊇ {vocals, singing, chanting, vocal samples}, trackRole null.
  2. **10곡 full** (시티팝 + 여성 보컬, 3분): trackRole 분포(opener=1번째, closer=10번째, climax 7~9번째, 합계 규칙), 전곡 stylePrompt 상이하되 장르 패밀리·핵심 악기 공유(앵커), 여성 보컬 곡의 excludeStyles에 `male vocals`, lyrics 첫 줄 `[Female Vocals]` 확인.
  3. **듀엣 1곡** (여성 보컬 + 남성 보컬 동시 선택, 3분): stylePrompt에 `Duet`, 모든 가사 줄 `[Male]`/`[Female]` 라벨, 전환 4~6회, `[Both]` ≤ 1줄.
  4. **retryHint 재생성**: 시나리오 2 결과에 excludeTitles + retryHint('보컬이 웅얼거림' 처방문)로 single 재생성 → 200 응답 + 새 곡 반환.
- [ ] **Step 3:** 검증 스크립트는 스크래치패드에 작성(이전 라운드 `validate-gen.py` 확장). 실패 항목은 원인 분류(코드 결함 vs LLM 확률적 미준수) 후 코드 결함만 수정.
- [ ] **Step 4:** dev 서버 종료, 진행 원장 갱신.

---

## Self-Review

**1. Spec coverage:**
- D1 인스트루멘털 3중 차단 → Task 2(Step 1·4·8·10·11) + Task 5(mock) + Task 7 검증 ✓
- D2 정밀도 3건(루프 유발어·muddy·음절/respelling) → Task 2(Step 2·3·6·9) ✓
- D3 보컬 고정·듀엣 → Task 2(Step 4·5·7·9·10) + Task 7 시나리오 2·3 ✓
- D4 플레이리스트 일관성+trackRole → Task 1(타입) + Task 3(프롬프트·스키마) + Task 4(프로바이더·정규화) + Task 5(mock) + Task 6(배지) + Task 7 시나리오 2 ✓
- D5 Extend → Task 6(Step 1·3·6·8) ✓
- D6 증상 재생성 → Task 1(retryHint 타입) + Task 4(route) + Task 6(칩 UI·page 배관) + Task 7 시나리오 4 ✓
- D7 슬라이더 복사·mock → Task 6(Step 5), Task 5 ✓
- 하위 호환 → trackRole 옵셔널(Task 1), ResultPanel 조건부 렌더(Task 6 Step 4), 구 히스토리 마이그레이션 불필요 ✓

**2. Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 old→new 실제 코드 포함 ✓

**3. Type consistency:** `TRACK_ROLES`/`TrackRole`(Task 1) ← Task 3(promptBuilder import), Task 4(gemini·anthropic·route import), Task 5(mock `TrackRole[]`) 일치. `onRegenerate(index, retryHint?)`(Task 6 Step 2) ↔ page.tsx `regenerateSong(index, retryHint?)`(Step 7) 일치. `ApiRequest.retryHint`(Task 1) ↔ route `body.retryHint`(Task 4) ↔ page fetch body(Task 6 Step 7) 일치 ✓
