// components/WatermarkTool.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { processImageFile } from '@/lib/watermark/engine'
import { CompareSlider } from '@/components/CompareSlider'

type Status = 'processing' | 'done' | 'failed'

interface Item {
  id: number
  name: string
  originalUrl: string
  afterUrl: string | null
  width: number
  height: number
  status: Status
  confidence: number
  message: string
}

const STATS = [
  { value: '100%', label: '브라우저 처리' },
  { value: '~1초', label: '처리 시간' },
  { value: '0원', label: '완전 무료' },
  { value: '0건', label: '서버 업로드' },
] as const

export function WatermarkTool() {
  const [items, setItems] = useState<Item[]>([])
  const [compareId, setCompareId] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const idRef = useRef(0)
  const dragDepth = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = useCallback((id: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
      if (!files.length) return

      const pending: Item[] = files.map((f) => ({
        id: idRef.current++,
        name: f.name.replace(/\.[^/.]+$/, '') || 'image',
        originalUrl: '',
        afterUrl: null,
        width: 0,
        height: 0,
        status: 'processing',
        confidence: 0,
        message: '',
      }))
      setItems((prev) => [...prev, ...pending])

      files.forEach((file, i) => {
        const id = pending[i].id
        processImageFile(file)
          .then(({ originalUrl, canvas, result }) => {
            update(id, {
              originalUrl,
              afterUrl: result.success ? canvas.toDataURL('image/png') : null,
              width: canvas.width,
              height: canvas.height,
              status: result.success ? 'done' : 'failed',
              confidence: result.confidence,
              message: result.message,
            })
          })
          .catch((err: unknown) => {
            update(id, {
              status: 'failed',
              message: err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.',
            })
          })
      })
    },
    [update],
  )

  // Drag-and-drop anywhere on the page.
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      dragDepth.current++
      if (dragDepth.current === 1) setDragActive(true)
    }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragDepth.current--
      if (dragDepth.current <= 0) {
        dragDepth.current = 0
        setDragActive(false)
      }
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragActive(false)
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
    }
    const onPaste = (e: ClipboardEvent) => {
      const imgs: File[] = []
      for (const item of e.clipboardData?.items ?? []) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile()
          if (f) imgs.push(f)
        }
      }
      if (imgs.length) handleFiles(imgs)
    }

    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    document.addEventListener('paste', onPaste)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
      document.removeEventListener('paste', onPaste)
    }
  }, [handleFiles])

  // Close the compare modal on Escape.
  useEffect(() => {
    if (compareId === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCompareId(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [compareId])

  const openPicker = () => fileInputRef.current?.click()

  const downloadItem = useCallback((it: Item) => {
    if (!it.afterUrl) return
    const a = document.createElement('a')
    a.download = `${it.name}_clean.png`
    a.href = it.afterUrl
    a.click()
  }, [])

  const downloadAll = useCallback(() => {
    items
      .filter((it) => it.status === 'done')
      .forEach((it, i) => window.setTimeout(() => downloadItem(it), i * 200))
  }, [items, downloadItem])

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setCompareId((cur) => (cur === id ? null : cur))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
    setCompareId(null)
  }, [])

  const doneCount = items.filter((it) => it.status === 'done').length
  const compareItem = compareId !== null ? items.find((it) => it.id === compareId) : undefined

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold">제미나이 워터마크 제거</h2>
        <p className="mt-1 text-sm text-zinc-500">
          제미나이·나노바나나로 생성한 이미지의 스파클(✦) 로고를 약 1초 만에 제거합니다. 서버
          업로드 없이 브라우저 안에서만 처리됩니다.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Dropzone */}
      <button
        type="button"
        onClick={openPicker}
        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white px-6 py-14 text-center transition hover:border-violet-400 hover:bg-violet-50/40"
      >
        <span className="mb-3 text-4xl">🪄</span>
        <span className="text-base font-semibold text-zinc-800">
          이미지를 여기에 놓거나 클릭
        </span>
        <span className="mt-1 text-sm text-zinc-500">
          PNG, JPG, WebP · 여러 파일 가능 · ⌘V 붙여넣기
        </span>
      </button>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center"
          >
            <div className="text-lg font-bold text-violet-600">{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Results */}
      {items.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              <strong className="text-zinc-900">{doneCount}</strong> / {items.length} 완료
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                이미지 추가
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                전체 지우기
              </button>
              <button
                type="button"
                onClick={downloadAll}
                disabled={doneCount === 0}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                전체 다운로드
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <ResultCard
                key={it.id}
                item={it}
                onCompare={() => setCompareId(it.id)}
                onDownload={() => downloadItem(it)}
                onDelete={() => removeItem(it.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Compare modal */}
      {compareItem && compareItem.afterUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCompareId(null)
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="truncate text-sm font-semibold text-zinc-800">{compareItem.name}</h3>
              <button
                type="button"
                onClick={() => setCompareId(null)}
                aria-label="닫기"
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <CompareSlider
              beforeSrc={compareItem.originalUrl}
              afterSrc={compareItem.afterUrl}
              width={compareItem.width}
              height={compareItem.height}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                {compareItem.width}×{compareItem.height}px · 신뢰도{' '}
                {(compareItem.confidence * 100).toFixed(1)}%
              </span>
              <button
                type="button"
                onClick={() => downloadItem(compareItem)}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700"
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen drag overlay */}
      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-violet-600/20 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-violet-500 bg-white/90 px-10 py-8 text-center shadow-xl">
            <div className="text-3xl">🪄</div>
            <p className="mt-2 text-base font-semibold text-violet-700">
              아무 곳에나 이미지를 놓으세요
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({
  item,
  onCompare,
  onDownload,
  onDelete,
}: {
  item: Item
  onCompare: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const isDone = item.status === 'done'
  const thumb = isDone ? item.afterUrl! : item.originalUrl
  const meta = isDone ? `워터마크 제거됨 · ${item.width}×${item.height}` : item.message

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="group relative aspect-square bg-zinc-100">
        {item.status === 'processing' ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600" />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumb} alt={item.name} className="h-full w-full object-contain" />
        )}

        <span
          className={[
            'absolute left-2 top-2 rounded-md px-2 py-0.5 text-xs font-medium text-white',
            item.status === 'processing'
              ? 'bg-zinc-500'
              : isDone
                ? 'bg-violet-600'
                : 'bg-red-500',
          ].join(' ')}
        >
          {item.status === 'processing' ? '처리 중' : isDone ? '✓ 제거 완료' : '실패'}
        </span>

        {item.status !== 'processing' && (
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
            {isDone && (
              <IconButton title="비교" onClick={onCompare}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </IconButton>
            )}
            {isDone && (
              <IconButton title="저장" onClick={onDownload}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </IconButton>
            )}
            <IconButton title="삭제" onClick={onDelete}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </IconButton>
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <div className="truncate text-sm font-medium text-zinc-800">{item.name}</div>
        <div className="truncate text-xs text-zinc-500">{meta}</div>
      </div>
    </div>
  )
}

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-zinc-700 shadow hover:bg-white"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
        {children}
      </svg>
    </button>
  )
}
