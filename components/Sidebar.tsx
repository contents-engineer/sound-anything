// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { loadApiKey, loadYoutubeApiKey } from '@/lib/apiKey'

const MENU = [
  { label: '수노 제너레이터', href: '/', icon: '🎵' },
  { label: '리센느낌 제너레이터', href: '/rescene', icon: '🫧' },
  { label: '가사 ➔ 앨범·유튜브 패키지', href: '/lyrics-album', icon: '💿' },
  { label: '제미나이 워터마크 제거', href: '/watermark', icon: '✨' },
  { label: '유튜브 채널 분석', href: '/channel-analyze', icon: '📊' },
  { label: '핫플리 트렌드', href: '/trends', icon: '🔥' },
  { label: '채널 수익 분석', href: '/revenue', icon: '💰' },
  { label: '평가 가이드라인', href: '/guidelines', icon: '📋' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [hasYoutubeKey, setHasYoutubeKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)

  useEffect(() => {
    function checkKeys() {
      setHasYoutubeKey(Boolean(loadYoutubeApiKey()))
      setHasGeminiKey(Boolean(loadApiKey()))
    }
    checkKeys()
    window.addEventListener('api-keys-updated', checkKeys)
    return () => window.removeEventListener('api-keys-updated', checkKeys)
  }, [])

  return (
    <aside className="shrink-0 border-b border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r flex flex-col justify-between">
      <div className="flex flex-col gap-1 p-4">
        <Link href="/" className="mb-4 px-2 block">
          <h1 className="text-base font-bold leading-tight text-zinc-900 flex items-center gap-1.5">
            <span>🎵</span>
            <span>플레이리스트 유튜브 제너레이터</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">올인원 음악 채널 제작 솔루션</p>
        </Link>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {MENU.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'text-zinc-700 hover:bg-zinc-100',
                ].join(' ')}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 하단 API 연결 상태 & 설정 링크 */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50/70 mt-auto">
        <Link
          href="/settings"
          className={[
            'block rounded-xl p-3 border transition text-xs',
            pathname === '/settings'
              ? 'border-violet-400 bg-violet-50/60 shadow-xs'
              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
          ].join(' ')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
              <span>🔌</span> API 연결
            </span>
            <span className="text-[11px] text-zinc-400">설정 & 발급안내 →</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    hasYoutubeKey ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-zinc-300'
                  }`}
                  title={hasYoutubeKey ? 'YouTube API 연결됨' : '미등록 (기본 키 폴백)'}
                />
                YouTube Data API
              </span>
              <span className={`text-[11px] font-medium ${hasYoutubeKey ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {hasYoutubeKey ? '연결됨' : '미등록'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    hasGeminiKey ? 'bg-emerald-500 shadow-sm shadow-emerald-300' : 'bg-zinc-300'
                  }`}
                  title={hasGeminiKey ? 'Gemini API 연결됨' : '미등록'}
                />
                Gemini API
              </span>
              <span className={`text-[11px] font-medium ${hasGeminiKey ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {hasGeminiKey ? '연결됨' : '미등록'}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  )
}

