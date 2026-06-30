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

function getPreview(entry: GenerationResult): string {
  const firstSong = entry.songs?.[0]
  return firstSong?.stylePrompt || firstSong?.title || entry.prompt || '생성 결과'
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
                <p className="mt-1 truncate text-sm text-zinc-800">{getPreview(e)}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
