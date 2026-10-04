// app/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  clearApiKey,
  clearYoutubeApiKey,
  loadApiKey,
  loadYoutubeApiKey,
  saveApiKey,
  saveYoutubeApiKey,
} from '@/lib/apiKey'

type TabType = 'youtube' | 'gemini' | 'security'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('youtube')

  const [ytKey, setYtKey] = useState('')
  const [ytInput, setYtInput] = useState('')
  const [ytEditing, setYtEditing] = useState(false)

  const [geminiKey, setGeminiKey] = useState('')
  const [geminiInput, setGeminiInput] = useState('')
  const [geminiEditing, setGeminiEditing] = useState(false)

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Hydration-safe: load keys after mount (localStorage unavailable on server)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYtKey(loadYoutubeApiKey())
    setGeminiKey(loadApiKey())
  }, [])

  function mask(key: string): string {
    if (!key) return ''
    if (key.length <= 8) return '••••'
    return `${key.slice(0, 4)}…${key.slice(-4)}`
  }

  function handleSaveYt(e: React.FormEvent) {
    e.preventDefault()
    const val = ytInput.trim()
    if (!val) return
    saveYoutubeApiKey(val)
    setYtKey(val)
    setYtInput('')
    setYtEditing(false)
    triggerToast('YouTube API 키가 저장되었습니다! 좌측 사이드바 표시가 초록색으로 변경됩니다.')
  }

  function handleClearYt() {
    clearYoutubeApiKey()
    setYtKey('')
    triggerToast('YouTube API 키가 삭제되었습니다.')
  }

  function handleSaveGemini(e: React.FormEvent) {
    e.preventDefault()
    const val = geminiInput.trim()
    if (!val) return
    saveApiKey(val)
    setGeminiKey(val)
    setGeminiInput('')
    setGeminiEditing(false)
    triggerToast('Gemini API 키가 저장되었습니다! 좌측 사이드바 표시가 초록색으로 변경됩니다.')
  }

  function handleClearGemini() {
    clearApiKey()
    setGeminiKey('')
    triggerToast('Gemini API 키가 삭제되었습니다.')
  }

  function triggerToast(msg: string) {
    setSaveSuccessMsg(msg)
    setTimeout(() => {
      setSaveSuccessMsg(null)
    }, 4000)
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-6">
      {/* Toast 알림 */}
      {saveSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-zinc-900 text-white px-5 py-3 shadow-xl text-sm flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <span>발급 방법</span> <span className="text-violet-600">안내</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          YouTube Data API v3와 Google Gemini API 키를 브라우저에 등록하고 관리할 수 있습니다.
        </p>
      </div>

      {/* API 키 등록 카드 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YouTube API 키 박스 */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  ytKey ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-zinc-300'
                }`}
              />
              YouTube Data API v3 키
            </span>
            <span className="text-xs text-zinc-400">
              {ytKey ? '연결됨 (localStorage)' : '미등록 (기본 키 폴백)'}
            </span>
          </div>

          {ytEditing ? (
            <form onSubmit={handleSaveYt} className="flex gap-2">
              <input
                type="password"
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                placeholder="AIzaSy... YouTube API 키 입력"
                autoFocus
                className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!ytInput.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setYtInput('')
                  setYtEditing(false)
                }}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                취소
              </button>
            </form>
          ) : ytKey ? (
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono font-medium text-emerald-800">
                🔑 {mask(ytKey)}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setYtInput(ytKey)
                    setYtEditing(true)
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                >
                  변경
                </button>
                <button
                  type="button"
                  onClick={handleClearYt}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setYtEditing(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-zinc-300 text-xs font-medium text-zinc-600 bg-zinc-50/60 hover:bg-zinc-100 hover:border-violet-300 hover:text-violet-700 transition"
            >
              + YouTube API 키 등록하기
            </button>
          )}
          <p className="mt-2 text-[11px] text-zinc-400">
            * 핫플리 트렌드 탐색 및 채널 상세 데이터 수집에 사용됩니다.
          </p>
        </div>

        {/* Gemini API 키 박스 */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  geminiKey ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-zinc-300'
                }`}
              />
              Google Gemini API 키
            </span>
            <span className="text-xs text-zinc-400">
              {geminiKey ? '연결됨 (localStorage)' : '미등록 (기본 키 폴백)'}
            </span>
          </div>

          {geminiEditing ? (
            <form onSubmit={handleSaveGemini} className="flex gap-2">
              <input
                type="password"
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                placeholder="AIzaSy... Gemini API 키 입력"
                autoFocus
                className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!geminiInput.trim()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeminiInput('')
                  setGeminiEditing(false)
                }}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                취소
              </button>
            </form>
          ) : geminiKey ? (
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono font-medium text-emerald-800">
                🔑 {mask(geminiKey)}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setGeminiInput(geminiKey)
                    setGeminiEditing(true)
                  }}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                >
                  변경
                </button>
                <button
                  type="button"
                  onClick={handleClearGemini}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGeminiEditing(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-zinc-300 text-xs font-medium text-zinc-600 bg-zinc-50/60 hover:bg-zinc-100 hover:border-violet-300 hover:text-violet-700 transition"
            >
              + Gemini API 키 등록하기
            </button>
          )}
          <p className="mt-2 text-[11px] text-zinc-400">
            * 2025 YouTube 정책 기반 채널 5대 영역 채점 및 AI 가사 생성에 사용됩니다.
          </p>
        </div>
      </div>

      {/* 상단 탭 네비게이션 */}
      <div className="flex border-b border-zinc-200 pt-2">
        <button
          onClick={() => setActiveTab('youtube')}
          className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
            activeTab === 'youtube'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          ① YouTube API 발급
        </button>
        <button
          onClick={() => setActiveTab('gemini')}
          className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
            activeTab === 'gemini'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          ② Gemini API 발급
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-5 text-sm font-semibold transition border-b-2 ${
            activeTab === 'security'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          참고 · 보안
        </button>
      </div>

      {/* 탭 1: YouTube API 발급 */}
      {activeTab === 'youtube' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 mb-4">
            YouTube Data API v3는 채널·영상의 메타데이터를 가져오는 데 사용돼요. <strong>무료</strong>이며 일일 10,000 쿼터가 기본 제공돼요(채널 1회 분석 ≈ 약 8~12 쿼터).
          </p>

          {/* 단계 1 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              1
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">Google Cloud Console에 접속</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                크롬으로 Google Cloud Console에 접속한 뒤 평소 사용하는 Google 계정으로 로그인해 주세요. 처음이라면 약관 동의 화면이 한 번 나옵니다.
              </p>
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                Google Cloud Console 열기 ↗
              </a>
            </div>
          </div>

          {/* 단계 2 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              2
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">새 프로젝트 만들기</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                상단 좌측의 프로젝트 선택 드롭다운( <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">프로젝트 선택</span> )을 누르고 우측 상단의 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">새 프로젝트</span>를 클릭해요.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                프로젝트 이름은 자유롭게( <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-mono text-xs">annie-playlist-guide</span> 등) 적고 <strong>만들기</strong>를 누른 뒤 잠시 기다려요. 알림창에서 만든 프로젝트로 전환해 주세요.
              </p>
            </div>
          </div>

          {/* 단계 3 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              3
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">YouTube Data API v3 사용 설정</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                왼쪽 햄버거 메뉴 → <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">API 및 서비스</span> → <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">라이브러리</span>로 이동해서 검색창에 <strong>YouTube Data API v3</strong>를 입력해요.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                검색 결과를 클릭한 뒤 파란색 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">사용</span> (또는 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">ENABLE</span>) 버튼을 눌러 활성화해요.
              </p>
              <a
                href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                바로 활성화 페이지로 ↗
              </a>
            </div>
          </div>

          {/* 단계 4 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              4
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">API 키 만들기</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                왼쪽 메뉴에서 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">API 및 서비스</span> → <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">사용자 인증 정보(Credentials)</span>로 이동해요.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                상단의 <strong>+ 사용자 인증 정보 만들기</strong> → <strong>API 키</strong>를 클릭하면 잠시 후 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">AIzaSy</span>로 시작하는 키가 생성돼요. <strong>복사</strong> 버튼을 눌러 클립보드에 담아두세요.
              </p>
            </div>
          </div>

          {/* 단계 5 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              5
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">(권장) 키 사용 범위 제한</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                방금 만든 키 옆 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">키 수정</span> 또는 연필 아이콘을 눌러요. <strong>API 제한사항</strong>에서 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">키 제한</span> → <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">YouTube Data API v3</span>만 선택하고 저장하면 다른 API로 오·남용되는 것을 막을 수 있어요.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                참고로 <strong>애플리케이션 제한사항</strong>은 이 도구가 브라우저에서 직접 호출하므로 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 font-mono text-xs">없음</span> 또는 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">HTTP 리퍼러</span>로 두면 돼요.
              </p>
            </div>
          </div>

          {/* 단계 6 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              6
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">키를 위쪽 입력칸에 붙여 넣기</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                복사한 키를 페이지 맨 위 <strong>YouTube Data API v3 키</strong> 칸에 붙여 넣고, 아래쪽의 <strong>저장</strong>을 누르면 좌측 사이드바의 점이 초록색으로 바뀌어요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: Gemini API 발급 */}
      {activeTab === 'gemini' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 mb-4">
            Gemini API는 수집된 채널 데이터를 5개 영역으로 채점하는 분석 엔진이에요. Google AI Studio에서 무료 키를 발급받을 수 있고, 무료 한도 안에서 빠르게 시작할 수 있어요.
          </p>

          {/* 단계 1 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              1
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">Google AI Studio에 접속</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                Google AI Studio는 Gemini API 키를 발급하고 모델을 시험해볼 수 있는 공식 도구예요. Google 계정으로 로그인하면 바로 사용할 수 있어요.
              </p>
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                Google AI Studio 열기 ↗
              </a>
            </div>
          </div>

          {/* 단계 2 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              2
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">&quot;Get API key&quot; 메뉴로 이동</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                왼쪽 메뉴 가장 아래 또는 오른쪽 상단의 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">Get API key</span> 버튼을 눌러요. 약관 동의 안내가 나오면 체크 후 진행해 주세요.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                API Key 페이지로 바로가기 ↗
              </a>
            </div>
          </div>

          {/* 단계 3 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              3
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">&quot;Create API key&quot; 클릭</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                파란색 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">Create API key</span> (또는 <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">+ API 키 만들기</span>) 버튼을 누르면 사용할 Google Cloud 프로젝트를 묻는 창이 뜹니다.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                아무 프로젝트나 선택해도 되고, 위 <strong>① YouTube</strong> 단계에서 만든 같은 프로젝트를 골라도 좋아요. 두 키를 같은 프로젝트에 두면 관리가 편해집니다.
              </p>
            </div>
          </div>

          {/* 단계 4 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              4
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">생성된 키 복사</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 font-mono text-xs">AIzaSy</span>로 시작하는 키가 나오면 <strong>Copy</strong> 아이콘을 눌러 복사하세요. 키는 이 화면에서만 전체가 보이고, 다음에 들어오면 일부만 표시되니 안전한 곳에 따로 저장해 두는 것도 좋아요.
              </p>
            </div>
          </div>

          {/* 단계 5 */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-xs flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-violet-200">
              5
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">키를 위쪽 입력칸에 붙여 넣기</h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                복사한 키를 페이지 맨 위 <strong>Gemini API 키</strong> 칸에 붙여 넣고 <strong>저장</strong>을 누르면 좌측 사이드바의 두 번째 점이 초록색으로 바뀌어요.
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                이제 <strong>채널·영상 분석</strong> 메뉴에서 URL을 입력하고 분석을 시작할 수 있어요!
              </p>
            </div>
          </div>

          {/* 무료 한도 알림 콜아웃 */}
          <div className="rounded-3xl bg-amber-50/70 border border-amber-200/80 p-6 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <strong className="font-semibold">무료 한도</strong> · Gemini 모델은 분당 요청 수와 일일 요청 수에 무료 한도가 적용돼요. 한도를 넘으면 RESOURCE_EXHAUSTED 오류가 발생하고, 잠시 기다리면 다시 사용할 수 있어요. 더 빠른 한도가 필요하면 결제 정보 등록 후 유료 등급으로 전환할 수 있어요. 모델은 계정에서 사용 가능한 것을 자동으로 선택해요 (gemini-2.5-flash 우선).
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 참고 · 보안 */}
      {activeTab === 'security' && (
        <div className="space-y-6 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
          {/* 개인정보·보안 */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">개인정보·보안</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 list-disc list-inside">
              <li>입력한 API 키는 <strong>이 브라우저의 localStorage</strong>에만 저장돼요. 외부 서버 데이터베이스에 영구 전송·저장되지 않습니다.</li>
              <li>분석 요청은 사용자의 키 또는 서버 보안 프록시를 통해 Google API로 안전하게 전송됩니다.</li>
              <li>다른 PC·다른 브라우저·시크릿 모드에서는 키를 다시 입력해야 해요.</li>
              <li>공용 컴퓨터에서 사용한 뒤에는 <strong>키 삭제</strong>를 꼭 눌러 주세요.</li>
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* 자주 발생하는 오류 */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">자주 발생하는 오류</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 list-disc list-inside">
              <li><code className="text-violet-700 font-mono font-semibold">API key not valid</code> — 키를 잘못 복사한 경우. 앞뒤 공백·줄바꿈을 지우고 다시 저장해 주세요.</li>
              <li><code className="text-violet-700 font-mono font-semibold">quotaExceeded</code> — YouTube 일일 한도 초과. 하루 기다리거나 새 프로젝트에서 키를 발급해 주세요.</li>
              <li><code className="text-violet-700 font-mono font-semibold">RESOURCE_EXHAUSTED</code> — Gemini 한도 초과. 1~2분 후 재시도해 주세요.</li>
              <li><code className="text-violet-700 font-mono font-semibold">YouTube Data API v3 has not been used</code> — 라이브러리에서 API를 활성화하지 않은 경우. <strong>① 단계 3</strong>을 다시 확인해 주세요.</li>
              <li><code className="text-violet-700 font-mono font-semibold">채널을 찾지 못했어요</code> — URL 형식을 다시 확인해 주세요. @핸들 또는 youtu.be/영상ID가 가장 안전해요.</li>
            </ul>
          </div>

          <hr className="border-zinc-100" />

          {/* 분석 한계 */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-3">분석 한계</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-600 list-disc list-inside">
              <li>이 도구는 채널 메타데이터·최근 업로드 통계·썸네일 정보를 기반으로 추정해요. 실제 오디오를 청취하거나 영상 프레임을 OCR하지는 않습니다.</li>
              <li>결과는 <strong>참고용</strong>이며, YouTube의 공식 정책 판단을 대체하지 않아요.</li>
              <li>같은 채널이라도 영상 구성에 따라 점수가 다르게 나올 수 있어요. 가능한 여러 번 분석해 보고 평균을 봐 주세요.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
