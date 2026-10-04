// app/guidelines/page.tsx
'use client'

import Link from 'next/link'

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span>평가</span> <span className="text-violet-600">가이드라인</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            총 100점 만점, 5개 영역의 위반 정도를 감점하여 산출합니다. 점수가 낮을수록 정책 위반·채널 삭제 위험이 높아요.
          </p>
        </div>
        <Link
          href="/channel-analyze"
          className="self-start rounded-xl bg-violet-600 text-white px-4 py-2 text-xs font-semibold hover:bg-violet-700 transition shadow-sm"
        >
          채널 분석하러 가기 →
        </Link>
      </div>

      {/* A. 점수 등급표 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <span className="text-violet-600">A.</span> 점수 등급표
        </h2>

        <div className="space-y-4">
          {/* 매우 안전 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-zinc-100">
            <div className="flex items-center gap-4">
              <span className="w-20 text-center rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold py-1.5 px-3">
                매우 안전
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono w-16">90–100</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 flex-1 sm:text-right">
              우등생. 가이드라인을 완벽히 준수하는 고품질 채널이에요. 그대로 쭉 가요!
            </p>
          </div>

          {/* 안전 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-zinc-100">
            <div className="flex items-center gap-4">
              <span className="w-20 text-center rounded-xl bg-lime-100 text-lime-800 text-xs font-bold py-1.5 px-3">
                안전
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono w-16">70–89</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 flex-1 sm:text-right">
              무난하지만 썸네일·메타데이터에 약간의 과장이 섞여 있어요. 다듬으면 더 좋아요.
            </p>
          </div>

          {/* 주의 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-zinc-100">
            <div className="flex items-center gap-4">
              <span className="w-20 text-center rounded-xl bg-amber-100 text-amber-800 text-xs font-bold py-1.5 px-3">
                주의
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono w-16">40–69</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 flex-1 sm:text-right">
              AI 고지 누락이나 반복 콘텐츠 징후가 발견됐어요. 조금만 더 깎이면 위험해요.
            </p>
          </div>

          {/* 위험 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-zinc-100">
            <div className="flex items-center gap-4">
              <span className="w-20 text-center rounded-xl bg-orange-100 text-orange-800 text-xs font-bold py-1.5 px-3">
                위험
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono w-16">20–39</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 flex-1 sm:text-right">
              레드카드 직전. 심각한 낚시성 제목·가치 부재로 알고리즘 노출이 이미 제한되었을 수 있어요.
            </p>
          </div>

          {/* 심각 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="w-20 text-center rounded-xl bg-red-100 text-red-800 text-xs font-bold py-1.5 px-3">
                심각
              </span>
              <span className="text-sm font-bold text-zinc-900 font-mono w-16">0–19</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 flex-1 sm:text-right">
              퇴출 대상. 가짜 라이브·사칭·기만이 다수 발견됐어요. 당장 수정하지 않으면 채널 삭제 위험이 커요.
            </p>
          </div>
        </div>
      </div>

      {/* 2025년 7월 정책 업데이트 반영 콜아웃 */}
      <div className="rounded-3xl bg-violet-50/60 border border-violet-200/80 p-6 shadow-xs flex items-start gap-4">
        <span className="text-xl text-violet-600 flex-shrink-0">ⓘ</span>
        <div className="space-y-1.5 text-xs sm:text-sm text-zinc-700">
          <h3 className="font-bold text-zinc-900">2025년 7월 정책 업데이트 반영</h3>
          <p className="leading-relaxed">
            YouTube가 2025년 7월 15일부터 <strong>&quot;repetitious content&quot;</strong>를 <strong>&quot;inauthentic content&quot;</strong>로 명칭 변경하면서 AI 음악 양산 채널을 정조준하기 시작했어요. 본 도구의 점수 배분도 이를 반영해 <strong>인증성 저하(35점)</strong>를 1순위 위험으로 두고, 자기 채널 내 중복 재업로드를 별도의 <strong>콘텐츠 재사용(20점)</strong> 영역으로 분리했습니다. 또한 AI 디스클로저는 <strong>실존 인물 모방</strong>에 한정 적용해 일반 AI 음악 창작 자체는 위반으로 잡지 않습니다.
          </p>
        </div>
      </div>

      {/* 1. Inauthentic Content · 인증성 저하 · 35점 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
            <span className="text-violet-600 font-mono">1.</span> Inauthentic Content · 인증성 저하 · 35점
          </h2>
          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            최우선 위험
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500">
          2025-07 정책 업데이트의 핵심. AI 음악 채널 단속의 1차 사유예요. 단, 판정 기준은 오직 음악(트랙)의 반복입니다.
        </p>

        {/* 정상 패턴 박스 */}
        <div className="rounded-2xl bg-emerald-50/70 border border-dashed border-emerald-300 p-4 sm:p-5 text-xs sm:text-sm text-emerald-950 space-y-2">
          <h4 className="font-bold text-emerald-800 flex items-center gap-1.5">
            <span>✦</span> 정상 패턴 (위반 아님 · 오히려 강점)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-emerald-900/90 pl-1">
            <li>비슷한 제목 시리즈 — &quot;비 오는 날 lo-fi #1, #2, #3&quot;</li>
            <li>일관된 썸네일 디자인 (브랜딩)</li>
            <li>같은 장르·무드·스타일 반복 ← 채널 정체성 그 자체</li>
            <li>동일한 인트로·아웃트로</li>
            <li>비슷한 영상 길이 (1시간 플리 시리즈 등)</li>
          </ul>
          <p className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-700 font-medium">
            음악 다양성이 낮은 것은 약점이 아니에요. 시청자가 lo-fi 채널을 구독하는 이유는 항상 lo-fi가 있을 거라는 신뢰 때문이에요. 일관성이 곧 정체성입니다.
          </p>
        </div>

        {/* 진짜 위반 박스 */}
        <div className="rounded-2xl bg-red-50/70 border border-dashed border-red-300 p-4 sm:p-5 text-xs sm:text-sm text-red-950 space-y-2">
          <h4 className="font-bold text-red-800 flex items-center gap-1.5">
            <span>✦</span> 진짜 위반 (감점 대상)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-red-900/90 pl-1">
            <li>같은 노래(트랙)가 다른 영상에 다시 등장</li>
            <li>영상 길이가 1-2초 이내로 정확히 일치하는 영상이 다수</li>
            <li>설명란 트랙리스트가 거의 동일한 영상들</li>
            <li>한 영상 안에서 짧은 클립이 무의미하게 무한 루프</li>
          </ul>
        </div>

        {/* 감점 세부 항목 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  대량 양산형 템플릿 (Mass Production)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                시각 일관성 + 음악도 거의 동일한 영상 양산 (시각 일관성 자체는 정상 브랜딩)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -15
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  저퀄리티 단순 반복 (Low-Effort Loop)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                한 영상 안에서 짧은 클립이 의미 없이 무한 루프 (1장 이미지 + 1시간 음악은 정상 lo-fi 형식)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  트랙 반복 (Low Variation)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                같은 곡이나 거의 동일한 곡 구성이 여러 영상에 반복 등장 (제목·썸네일이 비슷한 것만으론 적용 안 함)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>
        </div>
      </div>

      {/* 2. Reused Content · 콘텐츠 재사용 · 20점 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span className="text-violet-600 font-mono">2.</span> Reused Content · 콘텐츠 재사용 · 20점
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          자기 채널 내 트랙 재사용과 타 채널 큐레이션 복제를 따로 봅니다. 핵심은 &quot;같은 노래가 다시 등장하는가&quot;입니다.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  자기 채널 트랙 재사용 (Self-Duplicate)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                이미 올린 음악(트랙)을 썸네일·제목만 바꿔 다시 올림 (비슷한 컨셉으로 새 곡을 만드는 건 정상)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  큐레이션 복제 (Copy-Paste Curation)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                타 채널 AI 음악 플리의 곡 구성·순서를 90%+ 그대로 차용
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>
        </div>
      </div>

      {/* 3. 메타데이터·정체성 기만 · 20점 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span className="text-violet-600 font-mono">3.</span> 메타데이터·정체성 기만 · 20점
        </h2>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  가짜 실시간(Fake LIVE) 위장
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                실제 라이브 송출 기록이 없는 일반 영상인데 제목·태그·썸네일에 LIVE·실시간·생방송 표기 (진짜 라이브 영상은 해당 없음)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  키워드 낚시·사칭
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                미수록 유명 아티스트·&quot;최신곡&quot; 키워드 남발
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -5
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  카테고리 오설정·우회
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                음악인데 &quot;교육&quot;·&quot;노하우&quot; 등으로 등록
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -5
            </span>
          </div>
        </div>
      </div>

      {/* 4. AI 라이선스 및 실존 인물 보호 · 15점 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span className="text-violet-600 font-mono">4.</span> AI 라이선스 및 실존 인물 보호 · 15점
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          YouTube의 AI 디스클로저 의무는 &quot;사실적인 합성 콘텐츠&quot;에 한정돼요. 실존 인물·장소·사건을 진짜처럼 보이게 만든 경우만 적용. 일반 AI 음악 창작은 위반이 아닙니다.
        </p>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  실존 인물 모방 (Real Person Impersonation)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                실존 아티스트의 목소리·얼굴·정체성을 AI로 모방해 신곡처럼 배포 (AI Voice Cloning)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -10
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  상업 라이선스 미증빙 <span className="text-violet-600 text-xs font-medium">[자가진단]</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                Suno/Udio 등 AI 음악 도구의 유료 플랜 가입과 라이선스 증빙을 영상 설명란에 명시하지 않음. 무료 플랜은 상업 이용 불가
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -5
            </span>
          </div>
        </div>
      </div>

      {/* 5. 시각·청취 기만 및 비정상 트래픽 · 10점 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
          <span className="text-violet-600 font-mono">5.</span> 시각·청취 기만 및 비정상 트래픽 · 10점
        </h2>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  썸네일·음악 부조화 (Thumb-Music Mismatch)
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                자극적 썸네일 vs 평범한 음악, 또는 서정 썸네일 vs 락·EDM 등 강한 음악
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -5
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">ⓧ</span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                  인위적 트래픽 징후
                </span>
              </div>
              <p className="text-xs text-zinc-500 pl-6 mt-0.5">
                일부 영상만 조회수 대비 댓글·좋아요 비율이 비정상 (채널 전체 비공개·비활성화는 제외)
              </p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
              -5
            </span>
          </div>
        </div>
      </div>

      {/* 자가진단으로 보완하는 영역 */}
      <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-zinc-900">
          자가진단으로 보완하는 영역
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          아래 항목은 YouTube API로 직접 확인이 어려워서 분석 페이지의 <strong>고급 자가진단</strong>에서 입력 받습니다. 입력하면 점수 정확도가 올라가고, 특히 Content ID 분쟁 이력은 채널 신뢰도 등급에 직접 영향을 줘요.
        </p>

        <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 list-disc list-inside pl-1">
          <li>
            <strong>Content ID 분쟁 이력</strong> — 분쟁 누적 시 위험 등급을 한 단계 보수적으로 평가
          </li>
          <li>
            <strong>Suno/Udio 상업 라이선스</strong> — 무료 플랜으로 수익화 시 핵심 위험. 분쟁 발생하면 가장 먼저 검토되는 항목
          </li>
          <li>
            <strong>설명란 라이선스 명시</strong> — 매 영상에 라이선스 증빙(플랜·약관 링크)을 적어두면 분쟁 시 강력한 방어 자료
          </li>
        </ul>
      </div>
    </div>
  )
}
