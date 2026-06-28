// components/CompareSlider.tsx
'use client'

import { useCallback, useRef, useState } from 'react'

interface CompareSliderProps {
  beforeSrc: string
  afterSrc: string
  /** Intrinsic image dimensions, used to preserve aspect ratio. */
  width: number
  height: number
  className?: string
}

/**
 * Draggable before/after reveal. The cleaned ("after") image is the base
 * layer; the original ("before") is clipped to the slider position on top.
 */
export function CompareSlider({ beforeSrc, afterSrc, width, height, className }: CompareSliderProps) {
  const [pos, setPos] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)))
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
      updateFromClientX(e.clientX)
    },
    [updateFromClientX],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) updateFromClientX(e.clientX)
    },
    [updateFromClientX],
  )

  const stop = useCallback(() => {
    dragging.current = false
  }, [])

  const pct = pos * 100

  return (
    <div
      ref={containerRef}
      className={['relative select-none overflow-hidden rounded-xl bg-zinc-100', className]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio: `${width} / ${height}`, touchAction: 'none', cursor: 'ew-resize' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      {/* Base layer: cleaned result */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt="제거 후"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {/* Top layer: original, clipped to the slider position */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeSrc}
        alt="제거 전"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      />

      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        제거 전
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-violet-600/90 px-2 py-0.5 text-xs font-medium text-white">
        제거 후
      </span>

      {/* Divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow"
        style={{ left: `${pct}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-zinc-300">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 6 4 12 9 18" />
            <polyline points="15 6 20 12 15 18" />
          </svg>
        </span>
      </div>
    </div>
  )
}
