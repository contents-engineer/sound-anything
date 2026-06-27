// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { label: '수노 제너레이터', href: '/' },
  { label: '제미나이 워터마크 제거', href: '/watermark' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="shrink-0 border-b border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-4">
        <h1 className="mb-3 px-2 text-base font-bold leading-tight text-zinc-900">
          🎵 플레이리스트 유튜브 제너레이터
        </h1>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {MENU.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-700 hover:bg-zinc-100',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
