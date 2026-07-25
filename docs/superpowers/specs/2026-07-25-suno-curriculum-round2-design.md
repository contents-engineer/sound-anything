# 수노 제너레이터 커리큘럼 2차 개선 — 설계 스펙

날짜: 2026-07-25
근거: Suno 심화 커리큘럼(claude.ai artifact, 스크래치패드 수집본) vs 현재 구현 대조 평가.
1차 업그레이드(2026-07-24, ffd4885..6f232a0)에서 M1·M2·M3·M4 핵심은 반영 완료.
이번 라운드는 평가에서 확인된 잔여 격차를 다룬다. 사용자가 우선순위(①→④)를 승인함.

## 결정 사항

### D1. 인스트루멘털 3중 차단 (커리큘럼 M3-1, M4-1) — 규칙 위반 수정

- lyrics는 정확히 `[Instrumental]` 한 줄 (기존 `(Instrumental)` 폐기 — 소괄호는 가사로 불릴 위험, M4-1 명시).
- stylePrompt: 보컬 3계층 예외 — 보컬 디스크립터 금지, 대신 `instrumental`, `no vocals` 두 디스크립터 필수.
- excludeStyles: `vocals`, `singing`, `chanting`, `vocal samples` 4개 필수(+콘셉트별 1개까지 허용).
- "no vocals"(style) ↔ "vocals"(exclude)는 모순 검사의 예외(의도된 이중 차단).
- 하위 호환: 히스토리의 구 `(Instrumental)` 엔트리는 표시만 되므로 마이그레이션 불필요.

### D2. 프롬프트 정밀도 3건

- **루프 유발어 금지** (M4-2): stylePrompt 금지 목록에 `hypnotic`, `looping`, `endless` 추가.
- **Muddy 예방** (M5): 저중역 질감 계열(dark, warm, lush, heavy, thick, reverb-heavy) 곡당 최대 2개.
  초과 시 하나를 `clean mix` 또는 `hi-fi production`으로 대체.
- **음절 가이드·발음** (M4-5, M4-6): Verse 줄 8~10음절 / Chorus 줄 10~12음절, 줄 간 일관성 우선,
  상한 영어 12단어·한국어 18자. 영어 동철이음어 phonetic respelling(live→laiv, read→red, bass→bayss) 추가.

### D3. 보컬 고정·듀엣 규약 (M3-1, M4-4)

- **보컬 고정**: 단일 성별 보컬 곡은 lyrics 첫 줄에 `[Female Vocals]` / `[Male Vocals]` 태그(그 다음 줄부터 [Intro]).
  excludeStyles에 반대 성별(`male vocals` / `female vocals`) 포함을 규칙으로 승격. 연주곡·듀엣·성별 미지정 곡 제외.
- **듀엣** (남+여 보컬 프리셋 동시 선택 또는 듀엣 명시): stylePrompt에 `Duet` 필수.
  모든 가사 줄 앞에 `[Male]` / `[Female]` 라벨(맨 위 1회만 쓰면 붕괴 — 커리큘럼 명시), `[Both]`는 훅 한 줄만,
  목소리 전환 곡당 4~6회 이내(블록 단위).
- 허용 태그 규칙 완화: `[Female Vocals]` `[Male Vocals]`(첫 줄 전용), `[Male]` `[Female]` `[Both]`(듀엣 줄 라벨 전용).

### D4. 플레이리스트 일관성 + trackRole (M8) — 최대 레버

- full 모드(10곡)는 "하나의 플레이리스트": **앵커 고정**(장르 패밀리·핵심 악기 1~2개·보컬 캐릭터 공유) +
  **변수 분리**(템포·에너지·편곡 밀도·마이크로장르 변형으로만 차별화).
- `trackRole` 필드 신설 — enum `['opener', 'depth', 'energy lift', 'interlude', 'climax', 'closer']`:
  opener 1곡(1번째 고정), closer 1곡(10번째 고정), climax 1곡(7~9번째), interlude 1~2곡, energy lift 2~3곡, depth 2~3곡.
- songs 배열 순서 = 재생 순서, 3막 구조(1~3 arrival / 4~7 journey / 8~10 resolution).
- single 모드는 `trackRole: null`. TS 타입은 옵셔널(`trackRole?: TrackRole | null`) — 구 히스토리 하위 호환.
- UI: 곡 카드 제목 옆 역할 배지(한국어 라벨 매핑).

### D5. Extend 지원 (M1-4, M6)

- Suno 초기 생성 상한(약 4~8분, 변동) 대응: lyrics에 `[Verse 3]`가 있으면(6분+ 구조에서만 등장)
  ResultPanel에 "Extend용 후반부" 섹션 표시 — `[Verse 3]`부터 끝까지를 복사 버튼으로 제공
  (커리큘럼: 확장 프롬프트는 섹션 라벨+실제 가사만).
- LengthSlider 캡션에 6분+ 안내 한 줄 추가. 길이 슬라이더 범위(1~10분)는 유지.

### D6. 증상 기반 재생성 (M5)

- `ApiRequest.retryHint?: string` 신설, route가 `GenerationExtras.retryHint`로 전달(기존 배관 재사용).
- 곡 수 불일치 재시도 힌트와 사용자 힌트는 join으로 병합(클로버 방지).
- UI: 곡 카드 하단에 증상 칩 4종(웅얼거림/장르 튐/탁한 믹스/훅 약함) — 클릭 시 M5 매핑표 기반 처방문을
  retryHint로 실어 해당 곡만 재생성. 기존 "이 곡 다시" 버튼은 힌트 없는 재생성으로 유지.

### D7. 소소한 개선

- 곡 전체 복사 텍스트에 sliderHint 블록 포함.
- mock 프로바이더: 연주곡 분기 + trackRole 부여(키 없는 E2E 검증용).

### D8. 범위 제외

- Audio Influence(오디오 업로드 없음), Cover/Persona/Remaster/Stems(M7·M8 후반 — 생성기 범위 밖),
  키(key) 명시(디스크립터 예산 부족), [Pre-Chorus]·마디 수 태그(구조 단순성 유지, 실험적 ⚗️),
  Output Scorecard UI(워크플로 도구 — 추후 검토).

## 검증 방식

테스트 러너 없음 → `npm run lint` + `npm run build` + 실 Gemini 생성 검증(연주곡 1곡 / 10곡 trackRole 분포 /
듀엣 1곡 / retryHint 재생성)을 스크래치패드 검증 스크립트로 수행.
