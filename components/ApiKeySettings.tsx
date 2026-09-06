// components/ApiKeySettings.tsx
'use client'

import { useState } from 'react'

type Props = {
  apiKey: string
  onSave: (key: string) => void
  onClear: () => void
}

function mask(key: string): string {
  if (key.length <= 8) return '••••'
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}

export function ApiKeySettings({ apiKey, onSave, onClear }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const key = draft.trim()
          if (!key) return
          onSave(key)
          setDraft('')
          setEditing(false)
        }}
        className="flex items-center gap-2"
      >
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Google AI Studio에서 발급한 키"
          autoFocus
          autoComplete="off"
          className="w-56 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => { setDraft(''); setEditing(false) }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          취소
        </button>
      </form>
    )
  }

  if (apiKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" title="브라우저에만 저장됩니다">
          🔑 {mask(apiKey)}
        </span>
        <button
          type="button"
          onClick={() => { setDraft(''); setEditing(true) }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          변경
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
    >
      🔑 Gemini API 키 등록
    </button>
  )
}
