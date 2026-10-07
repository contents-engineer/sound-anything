// components/SunoLyricsPickerModal.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadHistory } from '@/lib/history'
import type { GenerationResult, SongConcept } from '@/types'

interface SunoLyricsPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSongs: (songs: { title: string; lyrics: string }[], suggestedMood?: string) => void
  onInsertSingleSong?: (targetIndex: number, song: { title: string; lyrics: string }) => void
  targetTrackIndex?: number | null // 특정 트랙에만 넣고 싶을 때 (0, 1, 2 등)
}

export function SunoLyricsPickerModal({
  isOpen,
  onClose,
  onImportSongs,
  onInsertSingleSong,
  targetTrackIndex,
}: SunoLyricsPickerModalProps) {
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [selectedSongIndices, setSelectedSongIndices] = useState<number[]>([0, 1, 2])
  const [previewSong, setPreviewSong] = useState<SongConcept | null>(null)
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false)
  const [titleNamingStyle, setTitleNamingStyle] = useState<'ko_ja' | 'ja_ko' | 'ko' | 'ja' | 'en'>('ko_ja')

  useEffect(() => {
    if (isOpen) {
      const list = loadHistory()
      setHistory(list)
      if (list.length > 0) {
        setSelectedIndex(0)
        const firstEntrySongs = list[0]?.songs || []
        setSelectedSongIndices(firstEntrySongs.slice(0, 3).map((_, i) => i))
        setPreviewSong(firstEntrySongs[0] || null)
      } else {
        setPreviewSong(null)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentEntry: GenerationResult | undefined = history[selectedIndex]
  const currentSongs: SongConcept[] = currentEntry?.songs || []

  function handleSelectEntry(idx: number) {
    setSelectedIndex(idx)
    const songs = history[idx]?.songs || []
    setSelectedSongIndices(songs.slice(0, 3).map((_, i) => i))
    setPreviewSong(songs[0] || null)
  }

  function toggleSongSelection(songIdx: number) {
    if (selectedSongIndices.includes(songIdx)) {
      if (selectedSongIndices.length === 1) return
      setSelectedSongIndices((prev) => prev.filter((i) => i !== songIdx))
    } else {
      if (selectedSongIndices.length >= 6) {
        alert('최대 6곡까지 선택할 수 있습니다.')
        return
      }
      setSelectedSongIndices((prev) => [...prev, songIdx].sort((a, b) => a - b))
    }
  }

  function formatTitleByStyle(song: SongConcept): string {
    const ko = song.titles?.ko || song.title || ''
    const ja = song.titles?.ja || ''
    const en = song.titles?.en || ''

    switch (titleNamingStyle) {
      case 'ja_ko':
        return ja && ko && ja !== ko ? `${ja} (${ko})` : ja || ko || en
      case 'ko':
        return ko || ja || en
      case 'ja':
        return ja || ko || en
      case 'en':
        return en || ko || ja
      case 'ko_ja':
      default:
        return ko && ja && ko !== ja ? `${ko} (${ja})` : ko || ja || en
    }
  }

  function handleApplySelected() {
    if (!currentEntry || currentSongs.length === 0) return

    // 특정 1곡만 단일 트랙에 넣는 모드
    if (targetTrackIndex !== null && targetTrackIndex !== undefined && previewSong) {
      if (onInsertSingleSong) {
        onInsertSingleSong(targetTrackIndex, {
          title: formatTitleByStyle(previewSong),
          lyrics: previewSong.lyrics || '',
        })
        onClose()
        return
      }
    }

    const chosen = selectedSongIndices
      .map((idx) => currentSongs[idx])
      .filter((s): s is SongConcept => Boolean(s && s.lyrics))
      .map((s) => ({
        title: formatTitleByStyle(s),
        lyrics: s.lyrics,
      }))

    if (chosen.length === 0) {
      alert('가사가 있는 곡을 선택해주세요.')
      return
    }

    const selections = currentEntry.selections
    const moods = selections?.mood || []
    const genre = selections?.genre || ''
    const suggestedMood = [genre, ...moods].filter(Boolean).join(', ')

    onImportSongs(chosen, suggestedMood || undefined)
    onClose()
  }

  function handleInsertDirect(song: SongConcept, trackIdx: number) {
    if (onInsertSingleSong) {
      onInsertSingleSong(trackIdx, {
        title: formatTitleByStyle(song),
        lyrics: song.lyrics || '',
      })
      onClose()
    }
  }

  function handleCopyLyricsText(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedLyrics(true)
    setTimeout(() => setCopiedLyrics(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="flex h-[92vh] max-h-[820px] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 bg-zinc-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-lg text-white shadow-xs">
              📜
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  수노 히스토리 가사 불러오기
                </h2>
                {targetTrackIndex !== null && targetTrackIndex !== undefined && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                    Track 0{targetTrackIndex + 1}에 넣기 모드
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                한글·일어·영어 타이틀을 한눈에 확인하고 가사를 선택해 붙여넣으세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition"
          >
            ✕
          </button>
        </div>

        {/* 본문 영역 */}
        {history.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 text-4xl">🎵</div>
            <h3 className="text-base font-semibold text-zinc-800">
              저장된 수노 생성 기록이 없습니다
            </h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-500 leading-relaxed">
              수노 제너레이터에서 음악 콘셉트와 가사를 생성하면 브라우저에 히스토리가 자동으로 저장됩니다.
            </p>
            <Link
              href="/"
              onClick={onClose}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
            >
              수노 제너레이터로 가사 생성하러 가기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col">
            {/* 회차 선택 바 (상단 가로 바 형태) */}
            <div className="border-b border-zinc-200 bg-zinc-50/50 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-600 shrink-0">생성 회차:</span>
                <select
                  value={selectedIndex}
                  onChange={(e) => handleSelectEntry(Number(e.target.value))}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-2xs focus:border-violet-500 focus:outline-hidden"
                >
                  {history.map((entry, idx) => {
                    const date = new Date(entry.generatedAt).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const genre = entry.selections?.genre || '장르'
                    const count = entry.songs?.length || 0
                    const lead = entry.songs?.[0]?.title || entry.songs?.[0]?.titles?.ko || ''
                    return (
                      <option key={`${entry.generatedAt}-${idx}`} value={idx}>
                        [{idx + 1}회차] {date} · {genre} ({count}곡) {lead ? `— ${lead}` : ''}
                      </option>
                    )
                  })}
                </select>
                <span className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                  {currentSongs.length}곡 보관됨
                </span>
              </div>

              {/* 제목 삽입 시 명명 스타일 선택 */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>가져올 제목 양식:</span>
                <select
                  value={titleNamingStyle}
                  onChange={(e) => setTitleNamingStyle(e.target.value as any)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 shadow-2xs focus:border-violet-500 focus:outline-hidden"
                >
                  <option value="ko_ja">한글 (일어)</option>
                  <option value="ja_ko">일어 (한글)</option>
                  <option value="ko">한글만</option>
                  <option value="ja">일어만</option>
                  <option value="en">영어만</option>
                </select>
              </div>
            </div>

            {/* 메인 2열 분할 영역 */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* 좌측: 수록곡 리스트 (체크박스 & 3개 국어 타이틀) */}
              <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 overflow-y-auto p-3.5 space-y-2.5 bg-zinc-50/30">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-zinc-700">
                    수록곡 목록 ({currentSongs.length}곡)
                  </span>
                  <span className="text-[11px] text-violet-600 font-semibold">
                    {selectedSongIndices.length}곡 선택 중
                  </span>
                </div>

                <div className="space-y-2">
                  {currentSongs.map((song, sIdx) => {
                    const isChecked = selectedSongIndices.includes(sIdx)
                    const isPreviewing = previewSong === song

                    const titleKo = song.titles?.ko || song.title || ''
                    const titleJa = song.titles?.ja || ''
                    const titleEn = song.titles?.en || ''

                    return (
                      <div
                        key={sIdx}
                        onClick={() => setPreviewSong(song)}
                        className={`cursor-pointer rounded-2xl border p-3 transition shadow-2xs ${
                          isPreviewing
                            ? 'border-violet-500 bg-violet-50/40 ring-1 ring-violet-400'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSongSelection(sIdx)
                            }}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            {/* 트랙 번호 & 대표 제목 */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-bold text-zinc-600">
                                Track 0{sIdx + 1}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {song.lyrics?.length || 0}자
                              </span>
                            </div>

                            {/* 3개 국어 타이틀 카드 */}
                            <div className="space-y-1">
                              {/* 한국어 */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="shrink-0 rounded bg-red-50 text-red-700 font-bold px-1 py-0.2 text-[9px] border border-red-100">
                                  KO
                                </span>
                                <span className="text-xs font-bold text-zinc-900 truncate">
                                  {titleKo || '—'}
                                </span>
                              </div>

                              {/* 일본어 */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="shrink-0 rounded bg-indigo-50 text-indigo-700 font-bold px-1 py-0.2 text-[9px] border border-indigo-100">
                                  JA
                                </span>
                                <span className="text-[11px] font-medium text-zinc-700 font-sans truncate">
                                  {titleJa || '—'}
                                </span>
                              </div>

                              {/* 영어 */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="shrink-0 rounded bg-emerald-50 text-emerald-700 font-bold px-1 py-0.2 text-[9px] border border-emerald-100">
                                  EN
                                </span>
                                <span className="text-[11px] text-zinc-500 font-mono truncate">
                                  {titleEn || '—'}
                                </span>
                              </div>
                            </div>

                            {/* 트랙 삽입 퀵 버튼 */}
                            <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400">특정 트랙 삽입:</span>
                              <div className="flex items-center gap-1">
                                {[0, 1, 2].map((tIdx) => (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInsertDirect(song, tIdx)
                                    }}
                                    className="rounded border border-zinc-200 bg-white hover:bg-violet-600 hover:text-white hover:border-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 transition"
                                    title={`Track 0${tIdx + 1}에 '${titleKo}' 가사만 바로 넣기`}
                                  >
                                    Track {tIdx + 1}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 우측: 선택한 곡의 3개 국어 타이틀 & 전체 가사 프리뷰 */}
              <div className="flex-1 min-w-0 flex flex-col p-4 bg-zinc-50/60 overflow-hidden">
                {previewSong ? (
                  <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    {/* 상단: 3개 국어 타이틀 상세 박스 */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xs mb-3 shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-violet-700 flex items-center gap-1">
                          <span>🎵</span> 선택된 곡 타이틀 정보
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLyricsText(previewSong.lyrics)}
                          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 transition"
                        >
                          {copiedLyrics ? '✓ 가사 복사됨' : '가사 텍스트 복사'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl bg-zinc-50 p-2 border border-zinc-100">
                          <span className="text-[10px] font-bold text-red-600 block mb-0.5">
                            🇰🇷 한국어 제목
                          </span>
                          <span className="text-xs font-bold text-zinc-800 break-words block">
                            {previewSong.titles?.ko || previewSong.title || '—'}
                          </span>
                        </div>
                        <div className="rounded-xl bg-zinc-50 p-2 border border-zinc-100">
                          <span className="text-[10px] font-bold text-indigo-600 block mb-0.5">
                            🇯🇵 日本語 タイトル
                          </span>
                          <span className="text-xs font-bold text-zinc-800 break-words block font-sans">
                            {previewSong.titles?.ja || '—'}
                          </span>
                        </div>
                        <div className="rounded-xl bg-zinc-50 p-2 border border-zinc-100">
                          <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">
                            🇺🇸 English Title
                          </span>
                          <span className="text-xs font-bold text-zinc-800 break-words block font-mono">
                            {previewSong.titles?.en || '—'}
                          </span>
                        </div>
                      </div>

                      {previewSong.concept && (
                        <p className="mt-2 text-[11px] text-zinc-500 italic bg-violet-50/50 p-2 rounded-lg border border-violet-100/50">
                          &ldquo;{previewSong.concept}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* 하단: 가사 본문 뷰어 (절대 깨지지 않는 스크롤 박스) */}
                    <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 text-xs font-semibold text-zinc-500 shrink-0">
                        <span>전체 가사 (Lyrics)</span>
                        <span>{previewSong.lyrics.length}자</span>
                      </div>

                      <div className="flex-1 min-w-0 overflow-y-auto font-sans text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap pr-1 select-text">
                        {previewSong.lyrics}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-xs text-zinc-400">
                    좌측 목록에서 곡을 선택하면 3개 국어 타이틀과 가사가 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 모달 하단 액션 바 */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 bg-white shrink-0">
          <div className="text-xs text-zinc-500">
            {history.length > 0 && (
              <>
                선택된 곡: <strong className="text-violet-700 font-bold">{selectedSongIndices.length}곡</strong>
                <span className="text-zinc-400 ml-1">
                  (가사 입력란 Track 01, Track 02... 로 자동 배치)
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              닫기
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleApplySelected}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition active:scale-[0.99]"
              >
                선택한 {selectedSongIndices.length}곡 가사 붙여넣기 ✨
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
