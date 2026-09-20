# 1곡(single) 및 10곡(full) 프롬프트 아키텍처 평가 및 고도화 명세

- **작성일**: 2026-09-21
- **대상 파일**: [`lib/promptBuilder.ts`](file:///Users/yeonhokim/jadenspace/sound-anything/lib/promptBuilder.ts), [`components/ResultPanel.tsx`](file:///Users/yeonhokim/jadenspace/sound-anything/components/ResultPanel.tsx), [`types.ts`](file:///Users/yeonhokim/jadenspace/sound-anything/types.ts)
- **목적**: Suno v6(플래그십 v6, 탐색형 v6-wild, 경량 v6-mini) 및 신규 제어 파라미터(Variety 슬라이더, Max Mode 토글) 환경에서 1곡(`single`)과 10곡(`full`) 생성 프롬프트의 품질·정합성·일관성을 재평가하고 개선점을 기록한다.

---

## 1. 아키텍처 비교 요약 (Comparison Matrix)

| 평가 항목 | 1곡 모드 (`single`) | 10곡 모드 (`full`) |
| :--- | :--- | :--- |
| **핵심 목표** | **단일 상업 음원의 완성도 및 뾰족한 타게팅** | **유기적 흐름의 완성형 앨범/플레이리스트 큐레이션** |
| **스타일 전략** | 선택 옵션 중 1개의 지배적 무드로 압축 (충돌 제거) | **앵커 고정**(장르·악기·보컬) + **변수 분리**(템포·에너지·마이크로장르) |
| **태그 예산** | 4~7개 디스크립터 엄격 제한 (Muddy 방지) | 10곡 각각 4~7개이되 곡마다 차별화 레버 최소 1개 이상 적용 |
| **구조 제어** | 곡 길이(1~10분)별 엄격한 섹션 줄 수 및 완전 반복 후렴 | **3막 구조**(도입→여정→해소) + 6종 `trackRole` 엄격 배분 |
| **BPM 제어** | 사용자가 선택한 단일 템포 구간 반영 | 앵커 BPM 기준 **BPM 곡선**(±15 BPM 범위, 곡 간 격차 ≤20) |
| **Suno v6 설정** | 곡의 특성에 최적화된 단일 슬라이더·모델 세팅 | 트랙 역할별 슬라이더 차등화 + **1~2곡 `v6-wild` 변화구** 배정 |
| **`trackRole`** | `null` | `opener`(1번), `closer`(10번), `climax`(7~9번), `interlude`, `energy lift`, `depth` |

---

## 2. 모드별 심층 평가

### 2-1. 1곡 모드 (`single`)

#### 강점 (Strengths)
1. **디스크립터 과잉 억제 및 우선순위 정렬 (M2-1)**:
   - `장르/서브장르 → 템포/BPM → 핵심 악기 → 보컬 → 프로덕션 → 무드`의 6단계 위계 구조를 적용하여 최대 7개 디스크립터로 압축.
   - 8개 이상의 태그 나열로 인한 주파수 대역 간섭과 소리 뭉개짐을 예방.
2. **무드 충돌 방지 (Single Dominant Mood)**:
   - 사용자가 상반된 무드를 다수 선택하더라도 단일 대표 무드 하나만 선별하여 프롬프트의 모순을 원천 차단.
3. **가사 구조의 기계적 무결성 (M4)**:
   - `[Intro]` 무가사 인트로 시작 및 `[Outro] + [End]` 종결 구조 강제.
   - 곡 길이(1~2분, 3~5분, 6~8분, 9~10분)에 맞춘 엄격한 섹션 수 및 줄 수 제어로 무한 루프 유발 방지.
   - 반복 후렴(`[Chorus]`)의 100% 동일 가사 규칙으로 Suno 가사 렌더링 안정성 확보.
4. **v6 신기능 슬라이더 추천**:
   - `Weirdness`, `Style Influence`, `Variety`, `Max Mode`, `Duration Slider` 수치를 곡의 성격(스템, 팝 싱글, 실험곡 등)에 맞춰 1:1로 제안.

#### 개선점 (Improvements)
- **커스텀 입력 가중치 명시**: 사용자가 프리셋 외에 직접 입력한 텍스트가 있을 때, 4~7개 슬롯 중 커스텀 텍스트를 최우선으로 반영하도록 지시문 보강.

---

### 2-2. 10곡 모드 (`full`)

#### 강점 (Strengths)
1. **앵커(Anchor) vs 변수(Variables) 분리 원칙 (M8-1)**:
   - 플레이리스트로서 일체감을 주는 앵커 요소(시대 앵커, 프로덕션 믹스, 장르 패밀리, 보컬 캐릭터)는 10곡 공통으로 고정.
   - 곡 간 차이는 템포, 마이크로장르(예: shoegaze ↔ surf rock), 편곡 밀도, 무드의 스펙트럼으로만 유도하여 앨범 전체의 완성도 확보.
2. **3막 구조 및 수학적으로 닫힌 트랙 역할(`trackRole`) 배분 (M8-2)**:
   - 1번 `opener`(도입부 고정), 10번 `closer`(해소/여운 고정), 7~9번 `climax`(에너지 정점) 필수 배정.
   - `interlude`(1~2곡), `energy lift`(2~3곡), `depth`(2~3곡)의 합계를 10곡으로 완결하여 단조로움 탈피.
3. **연속 재생 친화적 BPM 곡선 (BPM Curve)**:
   - 앵커 BPM 기준 ±15 BPM 내에서 완만하게 곡선을 형성하며, 이웃한 곡 간 격차를 20 이내로 통제하여 플레이리스트 청취 피로도 완화.
4. **Suno v6 모델 및 Variety 분배 (M7, v6)**:
   - 플래그십 `v6`를 기본으로 하되 10곡 중 1~2곡에 탐색형 `v6-wild` 모델을 변화구로 배치.
   - Climax 곡에는 `Max Mode: On`, Interlude 트랙에는 `Variety: High/Extra`를 차등 제안하여 다채로움 극대화.

#### 개선점 (Improvements)
- **`buildUserPrompt` 내 `sliderHint` 명시 보강**: single 모드에는 `sliderHint`가 사용자 프롬프트에 명시되어 있으나 full 모드 라인에 누락되어 있어 보강.
- **가사 오브제/소재 분산 가이드**: 동일한 주제(topic) 안에서도 10곡의 가사가 같은 어휘나 배경 묘사(예: 네온사인, 빗방울 등)를 반복하지 않도록 시각적 오브제 분산 지침 추가.

---

## 3. 프롬프트 개선 반영 내역

1. **`lib/promptBuilder.ts` - `buildUserPrompt` 지시문 보강**:
   - `full` 모드 지시문에 `sliderHint`를 명시하여 10곡 각각의 트랙 역할에 맞는 v6 슬라이더 추천을 강제.
2. **`lib/promptBuilder.ts` - Custom Input 최우선 반영 지침 추가**:
   - 사용자가 직접 입력한 텍스트가 있을 경우, 프리셋 디스크립터보다 우선하여 4~7개 슬롯에 배정하도록 규칙 추가.
3. **`lib/promptBuilder.ts` - 10곡 가사 소재/오브제 분산 지침 추가**:
   - 10곡 연속 생성 시 가사 매너리즘을 방지하기 위해 중심 시각적 오브제·상황·심상을 분산하도록 규칙 추가.
