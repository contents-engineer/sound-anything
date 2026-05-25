// components/OptionSection.tsx
'use client'

import { OptionButton } from '@/components/OptionButton'
import type { Preset } from '@/lib/options'

type Props = {
  number: number
  emoji: string
  title: string
  subtitle: string
  presets: Preset[]
  selected: string[] | string | null
  onToggle: (label: string) => void
  multi: boolean
  customInput: string | undefined
  onCustomChange: (value: string) => void
  placeholder: string
}

export function OptionSection({
  number, emoji, title, subtitle, presets, selected, onToggle, multi, customInput, onCustomChange, placeholder,
}: Props) {
  const isSelected = (label: string) => {
    if (Array.isArray(selected)) return selected.includes(label)
    return selected === label
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold text-zinc-900">
          <span>{emoji}</span>
          <span>{number}. {title}</span>
          <span className="text-sm font-normal text-zinc-500">({subtitle})</span>
          {!multi && <span className="ml-auto text-xs text-zinc-500">단일 선택</span>}
        </h2>
      </header>
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <OptionButton
            key={`${p.label}-${i}`}
            emoji={p.emoji}
            label={p.label}
            selected={isSelected(p.label)}
            onClick={() => onToggle(p.label)}
          />
        ))}
      </div>
      <input
        type="text"
        value={customInput ?? ''}
        onChange={(e) => onCustomChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none"
      />
    </section>
  )
}
