// components/OptionButton.tsx
'use client'

type Props = {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}

export function OptionButton({ emoji, label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected}
      className={[
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition',
        'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400',
        'data-[selected=true]:border-violet-500 data-[selected=true]:bg-violet-500 data-[selected=true]:text-white',
      ].join(' ')}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}
