# 수노 제너레이터 커리큘럼 기반 업그레이드 — 설계

- 날짜: 2026-07-24
- 참고 자료: 「Suno 심화 커리큘럼 — 의도대로 만드는 법」 (claude.ai 아티팩트, 2026-07 v5.5 기준, 8모듈 + 부록 5종)
- 상태: 사용자 설계 승인 완료

## 배경과 목적

현재 수노 제너레이터는 옵션 선택 → LLM이 곡별 stylePrompt·타이틀(ko/en/ja)·콘셉트·가사를 생성하는 구조다. 참고 커리큘럼과 대조한 결과 생성 규칙에 개선 여지가 확인됐다:

- stylePrompt에 순서 공식·디스크립터 개수 제한·보컬 3계층 규칙이 없음 (태그 과적 유발)
- 가사 구조에 `[Intro]`·`[End]`가 없음 (커리큘럼: 곡 뚝 끊김의 주원인이 엔딩 태그 누락 — `[Outro]`+`[End]` 페어링 권장)
- 한/영 혼용을 "후렴 안에 영어 한두 줄"로 지시 (커리큘럼: 섹션당 한 언어 원칙)
- Exclude Styles·슬라이더 추천 출력이 없음

## 확정 결정사항

| 항목 | 결정 |
|---|---|
| 범위 | 생성 품질(프롬프트 개편) + 신규 출력 필드 |
| 신규 출력 | Exclude Styles 추천, 슬라이더 추천값, 섹션별 편곡 태그, 보컬 연출·포매팅 기호 (4종 모두) |
| 대상 요금제 | Suno Pro/Premier (Exclude 전용 필드 사용, 인라인 부정문 불필요) |
| 가사 구조 | 커리큘럼 권장안 전체 적용 (`[Intro]` + `[Outro]` 1~2줄 + `[End]`) |
| 구현 접근 | LLM 스키마 확장 + responseSchema enum/maxItems 제약 (곡별 맞춤 추천, 값 형식은 스키마가 보장) |

## 1. 데이터 모델 & 스키마

`types.ts`:

```ts
export type SliderHint = {
  weirdness: '0-20%' | '20-40%' | '40-60%' | '60-80%'
  styleInfluence: '30-50%' | '50-70%' | '70-100%'
  note: string          // 추천 이유 한국어 한 줄
}

export type SongConcept = {
  // ...기존 필드 유지...
  excludeStyles?: string[]   // 2~5개, 영문 구체 명사
  sliderHint?: SliderHint
}
```

- TS 타입은 **optional**: localStorage 구 히스토리 항목에 필드가 없으므로 UI는 없으면 숨긴다.
- 응답 스키마에서는 **required**:
  - `lib/ai/gemini.ts` `SONG_SCHEMA`에 `excludeStyles`(ARRAY, minItems 2 / maxItems 5), `sliderHint`(weirdness·styleInfluence는 enum 강제, note는 STRING) 추가.
  - `lib/promptBuilder.ts` `RESPONSE_SCHEMA` 동기화 (openai/anthropic 경로 대비).
  - `lib/ai/mock.ts` 목업 곡에 신규 필드 + 신규 가사 구조 반영.
- `app/api/generate/route.ts`: `excludeStyles`를 최대 5개로 자르는 정규화 한 줄 추가. 카운트 재시도·에러 처리 로직 불변.

## 2. SYSTEM_PROMPT 개편 (`lib/promptBuilder.ts`)

### 2-a. stylePrompt 규칙 교체

현행 "콤마 구분 키워드, 모든 옵션 반영" 방식을 표준 공식으로 대체한다.

- 순서 고정: `[장르/서브장르] → [템포/에너지] → [핵심 악기] → [보컬] → [프로덕션] → [무드]`. 주 장르 맨 앞 (첫 태그 가중치 최대).
- **디스크립터 4~7개 상한.** 옵션이 많아도 나열하지 않고 우선순위를 정해 번역한다. 현행 "모든 옵션 반영" 규칙은 폐기.
- 차별화 4레버: 마이크로장르 구체화, 악기 고유명사(Rhodes, TR-808 등), 시대 앵커(80s 등), 프로덕션 질감 어휘 최소 1개.
- 보컬 3계층(Character/Delivery/Effects) 중 최소 Character+Delivery 지정, 가사 언어 명시(`…vocals singing in Korean`).
- 금지: 추상어(epic, beautiful 등), 명령문, 무드 상충 병치. 무드 대비는 태그가 아닌 가사 구조로 만든다.
- 한국어 가사면 `Clear Korean Pronunciation` 포함.
- `Target duration about N minutes` 문구 제거 (소리로 번역되지 않는 지시어 — 길이는 가사 구조가 담당).
- full 모드: 곡마다 4레버 중 최소 1개 이상을 다르게 써서 10곡을 차별화.
- prompt-only 모드(레거시)의 prompt 필드 규칙은 현행 유지 — 이번 개편 대상은 single/full 모드의 곡별 출력이다.

### 2-b. excludeStyles 규칙 (신규)

- 곡 콘셉트에서 새기 쉬운 원치 않는 요소를 2~5개 영문 구체 명사로 생성.
- 예: 명상곡 → `drums, edm drops, distorted guitar` / 여성 보컬 고정 → `male vocals`.
- stylePrompt와 모순 금지 (exclude에 넣은 요소를 style에 쓰지 않는다). 추상어 금지.

### 2-c. sliderHint 규칙 (신규)

- Weirdness: 극도로 보수적·교과서적 사운드만 필요하면 0-20%, 상업적·안전 지향 20-40%, 기본 40-60%, 실험적 장르만 60-80%.
- Style Influence: 태그를 느슨한 참고로만 쓰게 하려면 30-50%, 보통 50-70%, 디스크립터가 적고 뾰족할수록 70-100%.
- note: 추천 이유 한국어 한 줄.

### 2-d. 가사 구조 테이블 개편

전 길이에 `[Intro]`(태그만, 가사 없음) + `[Outro]`(1~2줄) + `[End]`(태그만) 적용:

| 길이 | 구성 | 본문 섹션당 줄수 / Outro 줄수 |
|---|---|---|
| 1~2분 | [Intro] → V1 → C → V2 → [Outro] → [End] | 3줄 / 1줄 |
| 3~5분 | [Intro] → V1 → C → V2 → B → C → [Outro] → [End] | 4줄 / 2줄 |
| 6~8분 | [Intro] → V1 → C → V2 → B → V3 → C → [Outro] → [End] | 5줄 / 2줄 |
| 9~10분 | [Intro] → V1 → C → V2 → B → V3 → C → B2 → [Outro] → [End] | 5줄 / 2줄 |

기존 규칙 유지: 반복 [Chorus]는 한 글자도 다르지 않게 동일, 섹션 사이 빈 줄 1개, 줄 끝 마침표 금지, 인스트루멘털 옵션 시 `(Instrumental)` 한 줄.

### 2-e. 섹션별 편곡 태그 (파라미터 문법)

- 곡당 1~2개 섹션에만 사용: `[Verse 1: whispered vocals, acoustic guitar only]`, `[Chorus: full band, soaring vocals]`.
- 태그당 연출 1~2개 상한. 대비가 필요한 지점(조용한 벌스 → 터지는 후렴)에만.
- 반복되는 [Chorus]는 헤더·가사 모두 완전 동일 유지 (파라미터가 붙었으면 반복에도 동일하게).

### 2-f. 보컬 연출·포매팅 기호

- 소괄호 배킹보컬: 1~3단어, 후렴 위주 곡당 2~4회. 예: `Rise up (rise up)`.
- ALL CAPS 강조: 섹션당 최대 1회, 1~3단어.
- `~` 비브라토, `-` 음절 늘이기(멜리스마), `…` 드라마틱 포즈.
- 기호 사용은 곡 전체 합계 3~6회로 절제 (과잉은 노이즈).
- 숫자는 발음대로 풀어쓰기: 한국어 가사는 한글로(3월→삼월), 영어는 단어로(3am→three A-M). 약어는 철자 분리(AI→A-I).

### 2-g. 혼용 언어 규칙 변경

- "한국어+영어 섞어서": [Chorus] 또는 [Bridge] 중 하나를 통째로 영어, 나머지 섹션은 한국어 (섹션당 한 언어).
- "일본어+영어 섞어서": 동일 원리 (영어 섹션 1개 + 나머지 일본어). 일본어 문자 표기 규칙(로마자 금지)은 기존 유지.

### 2-h. 자체 검토 체크리스트 확장

기존 문법·표기 검토에 추가: `[Intro]`/`[End]` 존재, Outro 줄수(1~2줄), stylePrompt 디스크립터 4~7개, 추상어 검출, excludeStyles↔stylePrompt 모순, 편곡 태그·기호 개수 상한 준수.

## 3. UI 변경 (`components/ResultPanel.tsx`)

곡 카드의 Style Prompt 섹션 아래 두 섹션 추가:

- **🚫 Exclude Styles (Suno Exclude 입력란용)**: 키워드 칩 나열 + 콤마 조인 문자열 CopyButton.
- **🎚️ 슬라이더 추천**: `Weirdness 40-60%` / `Style Influence 50-70%` 배지 + note 한 줄. 복사 버튼 없음 (손으로 조절하는 값).

곡 카드 상단 전체 복사 텍스트에 `--- Exclude Styles ---` 블록 추가. 두 섹션 모두 필드가 없으면(구 히스토리) 렌더하지 않는다. ResultSkeleton 불변.

## 4. 하위 호환 & 프로바이더 정합

- 구 히스토리: 신규 필드 optional이므로 마이그레이션 불필요.
- Gemini 두 모델 모두 responseSchema 지원 — 추가 분기 없음.
- openai/anthropic은 SYSTEM_PROMPT 공유로 자동 적용 + RESPONSE_SCHEMA 동기화.
- mock은 신규 필드·구조를 포함해 API 키 없이 UI 검증 가능.

## 5. 검증 계획

1. `npm run build` + lint 통과.
2. mock 프로바이더로 신규 UI 섹션 렌더 및 구 히스토리(필드 없음) 미표시 확인.
3. playwriter로 localhost:3000 실화면·하이드레이션 에러 확인.
4. 실제 Gemini로 1곡·10곡 각 1회 생성 — 스키마 준수(enum, exclude 2~5개), 가사 구조([Intro]/[Outro]/[End]), stylePrompt 공식(4~7개, 주 장르 선두) 육안 검증.

## 변경 파일 요약

| 파일 | 변경 |
|---|---|
| `types.ts` | `SliderHint` 신설, `SongConcept`에 optional 필드 2개 |
| `lib/promptBuilder.ts` | SYSTEM_PROMPT 전면 개편, RESPONSE_SCHEMA 확장 |
| `lib/ai/gemini.ts` | SONG_SCHEMA 확장 (enum/minItems/maxItems) |
| `lib/ai/mock.ts` | 신규 필드·가사 구조 반영 |
| `app/api/generate/route.ts` | excludeStyles 5개 상한 정규화 |
| `components/ResultPanel.tsx` | Exclude Styles·슬라이더 추천 섹션 추가, 전체 복사 텍스트 갱신 |
