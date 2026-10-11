// app/lyrics-album/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadApiKey } from '@/lib/apiKey'
import { loadHistory } from '@/lib/history'
import { LYRICS_PRESETS, LyricsPreset } from '@/lib/lyrics-album/presets'
import { SunoLyricsPickerModal } from '@/components/SunoLyricsPickerModal'
import type { AlbumType, LyricsAlbumResult } from '@/lib/lyrics-album/types'

interface SongInput {
  id: string
  title: string
  lyrics: string
}

const DEFAULT_SONGS: SongInput[] = [
  { id: '1', title: '', lyrics: '' },
  { id: '2', title: '', lyrics: '' },
  { id: '3', title: '', lyrics: '' },
]

const QUICK_MOODS = [
  '🌸 리센느 느낌 × 노이(neu) 한·일 감성 딥하우스',
  '🫧 리센느 느낌 & 향기 딥하우스',
  '🎧 감성 J-POP 밴드',
  '🌙 새벽 감성 & 위로',
  '🌧️ 비 오는 날 & 센치함',
  '🚗 퇴근길 & 벅차오르는 마음',
  '☕ 따뜻한 카페 & 힐링',
  '🌆 레트로 시티팝 & 낭만',
  '💔 짝사랑의 기억과 아련함',
  '🌿 포근한 주말 휴식',
]

const ALBUM_TYPES: { type: AlbumType; ko: string; ja: string; desc: string }[] = [
  { type: 'single', ko: '싱글', ja: 'シングル', desc: '1~2곡 중심의 단일 테마' },
  { type: 'mini', ko: '미니앨범 (EP)', ja: 'ミニアルバム', desc: '3~5곡 중심의 완성형 스토리 (기본)' },
  { type: 'regular', ko: '정규 앨범', ja: 'アルバム', desc: '풍성한 세계관의 종합 앨범' },
]

export default function LyricsAlbumPage() {
  const [songs, setSongs] = useState<SongInput[]>(DEFAULT_SONGS)
  const [albumType, setAlbumType] = useState<AlbumType>('mini')
  const [targetMood, setTargetMood] = useState<string>('감성 J-POP 밴드, 짝사랑의 기억과 위로')
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingStep, setLoadingStep] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LyricsAlbumResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [descLangTab, setDescLangTab] = useState<'ja' | 'ko'>('ja')

  // 타이틀곡 및 서브타이틀곡 지정 인덱스 (기본: 0번 메인타이틀, 1번 서브타이틀)
  const [titleTrackIndex, setTitleTrackIndex] = useState<number>(0)
  const [subTitleTrackIndex, setSubTitleTrackIndex] = useState<number>(1)

  // 수노 히스토리 모달 관련 상태
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)
  const [targetTrackForModal, setTargetTrackForModal] = useState<number | null>(null)
  const [historyCount, setHistoryCount] = useState<number>(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function handleSetTitleTrack(idx: number) {
    setTitleTrackIndex(idx)
    if (subTitleTrackIndex === idx) {
      const nextSub = songs.findIndex((_, i) => i !== idx)
      setSubTitleTrackIndex(nextSub >= 0 ? nextSub : (idx + 1) % songs.length)
    }
  }

  function handleSetSubTitleTrack(idx: number) {
    if (titleTrackIndex === idx) {
      const prevSub = subTitleTrackIndex
      setSubTitleTrackIndex(idx)
      setTitleTrackIndex(prevSub)
    } else {
      setSubTitleTrackIndex(idx)
    }
  }

  useEffect(() => {
    function checkStatus() {
      setHasGeminiKey(Boolean(loadApiKey()))
      setHistoryCount(loadHistory().length)
    }
    checkStatus()
    window.addEventListener('api-keys-updated', checkStatus)
    return () => window.removeEventListener('api-keys-updated', checkStatus)
  }, [])

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 3500)
  }

  function handleImportFromHistory(
    importedSongs: { title: string; lyrics: string }[],
    suggestedMood?: string
  ) {
    setSongs(
      importedSongs.map((s, idx) => ({
        id: String(idx + 1),
        title: s.title,
        lyrics: s.lyrics,
      }))
    )
    if (suggestedMood) {
      setTargetMood(suggestedMood)
    }
    showToast(`📜 수노 히스토리에서 ${importedSongs.length}곡의 가사를 불러왔습니다! ✨`)
  }

  function handleInsertSingleSong(
    trackIdx: number,
    song: { title: string; lyrics: string }
  ) {
    setSongs((prev) => {
      const next = [...prev]
      if (next[trackIdx]) {
        next[trackIdx] = { ...next[trackIdx], title: song.title, lyrics: song.lyrics }
      }
      return next
    })
    showToast(`Track 0${trackIdx + 1}에 '${song.title || '곡'}' 가사를 가져왔습니다!`)
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }

  function handleLoadPreset(preset: LyricsPreset) {
    setSongs(
      preset.songs.map((s, idx) => ({
        id: String(idx + 1),
        title: s.title,
        lyrics: s.lyrics,
      }))
    )
    setTargetMood(preset.mood)
  }

  function handleAddSong() {
    if (songs.length >= 6) return
    setSongs((prev) => [
      ...prev,
      { id: String(Date.now()), title: '', lyrics: '' },
    ])
  }

  function handleRemoveSong(index: number) {
    if (songs.length <= 1) return
    setSongs((prev) => prev.filter((_, i) => i !== index))
    if (titleTrackIndex === index) {
      setTitleTrackIndex(0)
    } else if (titleTrackIndex > index) {
      setTitleTrackIndex((prev) => prev - 1)
    }
    if (subTitleTrackIndex === index) {
      setSubTitleTrackIndex(Math.max(0, Math.min(1, songs.length - 2)))
    } else if (subTitleTrackIndex > index) {
      setSubTitleTrackIndex((prev) => prev - 1)
    }
  }

  function handleSongChange(index: number, field: 'title' | 'lyrics', value: string) {
    setSongs((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function handleClear() {
    if (window.confirm('입력한 가사와 결과물을 모두 초기화할까요?')) {
      setSongs(DEFAULT_SONGS)
      setTitleTrackIndex(0)
      setSubTitleTrackIndex(1)
      setTargetMood('')
      setResult(null)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validSongs = songs.filter((s) => s.lyrics.trim().length > 0)
    if (validSongs.length === 0) {
      setError('최소 1개 이상의 노래 가사를 입력해주세요.')
      return
    }

    setLoading(true)
    setLoadingStep(1)
    setError(null)

    const timer1 = setTimeout(() => setLoadingStep(2), 1500)
    const timer2 = setTimeout(() => setLoadingStep(3), 3200)

    try {
      const geminiKey = loadApiKey()
      const res = await fetch('/api/lyrics-album', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(geminiKey ? { 'x-gemini-api-key': geminiKey } : {}),
        },
        body: JSON.stringify({
          songs: validSongs.map((s, idx) => ({
            ...s,
            isTitle: idx === titleTrackIndex,
            isSubTitle: idx === subTitleTrackIndex,
          })),
          targetMood: targetMood.trim() || undefined,
          albumType,
          titleTrackIndex,
          subTitleTrackIndex,
          geminiApiKey: geminiKey,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || '앨범 패키지 생성에 실패했습니다.')
      }

      setResult(data.data)
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setLoading(false)
    }
  }

  function handleDownloadMarkdown() {
    if (!result) return

    const mdContent = `# 💿 ${result.albumTitle.korean} / ${result.albumTitle.japanese} (${result.albumTitle.english})
> [${result.albumTypeLabel.ko} / ${result.albumTypeLabel.ja}] ${result.albumTitle.subtitle}

---

## 1. 앨범 정보 & 주제
- **앨범 구분:** ${result.albumTypeLabel.ko} (${result.albumTypeLabel.ja})
- **앨범명 (KO):** ${result.albumTitle.korean}
- **앨범명 (JA):** ${result.albumTitle.japanese}
- **앨범명 (EN):** ${result.albumTitle.english}
- **부제:** ${result.albumTitle.subtitle}
- **핵심 컨셉:** ${result.albumTheme.coreConcept}
- **키워드:** ${result.albumTheme.keywords.join(', ')}
- **추천 장르/무드:** ${result.albumTheme.genreMood}
- **서사 아크:** ${result.albumTheme.narrativeArc}

---

## 2. 앨범 설명글 (Liner Notes)

### [일본어 원문 포맷]
${result.albumDescription.japanese}

${result.credits}

### [한국어 번역 버전]
${result.albumDescription.korean}

${result.credits}

---

## 3. 유튜브 타이틀
- **대표 타이틀:** ${result.youtubeTitles.main}
- **패턴 1 (감성 소망형):** ${result.youtubeTitles.pattern1}
- **패턴 2 (퇴근길 몰입형):** ${result.youtubeTitles.pattern2}
- **패턴 3 (하루 끝 위로형):** ${result.youtubeTitles.pattern3}
${result.youtubeTitles.alternatives.map((a) => `- [${a.style}] ${a.title}`).join('\n')}

---

## 4. 유튜브 썸네일 아이디어
- **비주얼 구도:** ${result.thumbnailIdea.visualSummary}
- **조명 & 분위기:** ${result.thumbnailIdea.atmosphere}
- **컬러 팔레트:**
${result.thumbnailIdea.colorPalette.map((c) => `  * ${c.name} (${c.hex})`).join('\n')}
- **추천 썸네일 카피:**
${result.thumbnailIdea.recommendedCopy.map((copy) => `  * "${copy}"`).join('\n')}
- **AI 이미지 생성 프롬프트 (Midjourney / Imagen):**
\`\`\`
${result.thumbnailIdea.aiImagePrompt}
\`\`\`

---

## 5. 유튜브 설명글 전문
\`\`\`
${result.youtubeDescription.fullFormattedText}
\`\`\`

---

## 6. 유튜브 고정 댓글
\`\`\`
${result.pinnedComment.fullCommentText}
\`\`\`

---
*생성 시각: ${new Date(result.generatedAt).toLocaleString('ko-KR')} | Sound Anything*
`

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${result.albumTitle.korean.replace(/\s+/g, '_')}_패키지.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      {/* 상단 헤더 */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-violet-100 p-2 text-2xl">💿</span>
            <h1 className="text-2xl font-bold text-zinc-900 md:text-3xl">
              가사 ➔ 앨범 & 유튜브 패키지
            </h1>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            노래 가사 3곡을 올리면 지정하신 규격 포맷에 맞춘{' '}
            <strong className="font-semibold text-zinc-700">
              앨범명, 앨범주제, 앨범설명글, 썸네일 아이디어, 유튜브 타이틀, 설명글, 고정댓글
            </strong>
            을 완벽하게 완성합니다.
          </p>
        </div>

        {/* API 키 상태 뱃지 */}
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 px-3 text-xs shadow-xs">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              hasGeminiKey ? 'bg-emerald-500 shadow-xs shadow-emerald-400' : 'bg-amber-400'
            }`}
          />
          <div className="flex flex-col">
            <span className="font-medium text-zinc-700">
              {hasGeminiKey ? 'Gemini AI 연결됨' : 'Gemini 키 미등록 (데모 모드)'}
            </span>
            <Link href="/settings" className="text-[11px] text-violet-600 hover:underline">
              {hasGeminiKey ? '키 관리하기 →' : '무료 키 등록하고 고도화하기 →'}
            </Link>
          </div>
        </div>
      </div>

      {/* 앨범 구분 선택 섹션 (싱글 / 미니앨범 / 정규 앨범) */}
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <label className="block text-xs font-semibold text-zinc-800 mb-2.5">
          💿 앨범 구분 선택 (설명글 및 콘셉트에 자동 반영)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ALBUM_TYPES.map((item) => {
            const active = albumType === item.type
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setAlbumType(item.type)}
                className={`flex flex-col rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-violet-600 bg-violet-50/70 shadow-xs ring-1 ring-violet-500'
                    : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${active ? 'text-violet-800' : 'text-zinc-800'}`}>
                    {item.ko}
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 border border-zinc-200">
                    {item.ja}
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-zinc-500">{item.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 수노 히스토리 연동 배너 */}
      <div className="mb-6 rounded-2xl border border-indigo-200/80 bg-linear-to-r from-indigo-50/80 via-violet-50/60 to-purple-50/30 p-4.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xl text-white shadow-xs">
              📜
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">
                  수노 제너레이터 히스토리 연동
                </h3>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                  {historyCount > 0 ? `${historyCount}회차 보관 중` : '기록 없음'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {historyCount > 0
                  ? '수노에서 생성했던 곡들의 제목과 가사를 확인하고, 3곡을 한 번에 가져와 붙여넣을 수 있습니다.'
                  : '수노 제너레이터(/)에서 생성한 가사는 브라우저에 자동 저장되어 여기서 바로 불러올 수 있습니다.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {historyCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTargetTrackForModal(null)
                  setIsHistoryModalOpen(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-violet-700 transition active:scale-[0.99]"
              >
                <span>📜</span>
                <span>수노 히스토리에서 가사 가져오기</span>
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
              >
                <span>🎵</span>
                <span>수노에서 가사 생성하기 →</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 가사 샘플 프리셋 */}
      <div className="mb-6 rounded-2xl border border-violet-100 bg-linear-to-r from-violet-50/70 via-indigo-50/40 to-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-900">
            <span>✨</span> 샘플 가사 원클릭 채우기 (테스트용)
          </span>
          <span className="text-[11px] text-zinc-400">가사가 없을 때 바로 체험해보세요</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {LYRICS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="flex flex-col rounded-xl border border-violet-200/80 bg-white p-3 text-left shadow-2xs transition hover:border-violet-400 hover:bg-violet-50/40 hover:shadow-xs active:scale-[0.99]"
            >
              <span className="text-xs font-bold text-violet-700">{preset.name}</span>
              <span className="mt-1 text-[11px] text-zinc-500">{preset.tag}</span>
              <span className="mt-2 line-clamp-1 text-[11px] text-zinc-400">
                {preset.songs.map((s) => s.title).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 곡 목록 카드 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-800 flex items-center gap-2">
                <span>🎵</span> 수록곡 가사 입력 ({songs.length}곡)
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                💡 원하는 곡의 <span className="text-amber-600 font-bold">👑 메인 타이틀</span> / <span className="text-indigo-600 font-bold">🥈 서브 타이틀</span> 버튼을 누르면 앨범 설명글에 그대로 반영됩니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetTrackForModal(null)
                  setIsHistoryModalOpen(true)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition"
              >
                <span>📜</span>
                <span>히스토리 불러오기</span>
              </button>
              {songs.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddSong}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <span>+ 곡 추가</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {songs.map((song, index) => {
              const isTitle = index === titleTrackIndex
              const isSub = index === subTitleTrackIndex

              return (
                <div
                  key={song.id}
                  className={`flex flex-col rounded-2xl border p-4 shadow-xs transition ${
                    isTitle
                      ? 'border-amber-400 bg-linear-to-b from-amber-50/60 to-white ring-2 ring-amber-300/80'
                      : isSub
                      ? 'border-indigo-300 bg-linear-to-b from-indigo-50/50 to-white ring-1 ring-indigo-300'
                      : 'border-zinc-200 bg-white focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100'
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          isTitle
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : isSub
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-800">
                        Track 0{index + 1}
                      </span>
                    </div>

                    {/* 역할 지정 버튼 그룹 (👑 메인 / 🥈 서브) */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetTitleTrack(index)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition flex items-center gap-0.5 ${
                          isTitle
                            ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-400'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                        title="이 곡을 앨범 메인 타이틀곡으로 지정"
                      >
                        <span>👑</span>
                        <span>{isTitle ? '메인' : '타이틀'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetSubTitleTrack(index)}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition flex items-center gap-0.5 ${
                          isSub
                            ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-indigo-100 hover:text-indigo-800'
                        }`}
                        title="이 곡을 서브 타이틀곡으로 지정"
                      >
                        <span>🥈</span>
                        <span>{isSub ? '서브' : '서브'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetTrackForModal(index)
                          setIsHistoryModalOpen(true)
                        }}
                        className="text-[11px] text-violet-600 hover:text-violet-800 flex items-center gap-0.5"
                        title="수노 히스토리에서 이 트랙에 넣을 곡 선택"
                      >
                        <span>📜</span>
                      </button>
                      {songs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSong(index)}
                          className="text-xs text-zinc-400 hover:text-rose-500 px-1"
                          title="이 곡 삭제"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                <input
                  type="text"
                  placeholder={`곡 제목 (선택, 비워두면 AI가 추천)`}
                  value={song.title}
                  onChange={(e) => handleSongChange(index, 'title', e.target.value)}
                  className="mb-2 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs placeholder:text-zinc-400 focus:border-violet-500 focus:outline-hidden"
                />

                <textarea
                  rows={8}
                  placeholder={`곡 ${index + 1}의 가사를 입력하거나 붙여넣으세요...\n\n(예: 창문 틈으로 스며든 밤공기...)`}
                  value={song.lyrics}
                  onChange={(e) => handleSongChange(index, 'lyrics', e.target.value)}
                  required
                  className="w-full resize-y rounded-lg border border-zinc-200 p-3 text-xs leading-relaxed placeholder:text-zinc-400 focus:border-violet-500 focus:outline-hidden font-sans"
                />
                <div className="mt-1.5 text-right text-[10px] text-zinc-400">
                  {song.lyrics.length}자
                </div>
              </div>
            )
          })}
        </div>
        </div>

        {/* 분위기 / 타깃 무드 선택 */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <label className="block text-xs font-semibold text-zinc-800 mb-2">
            🎨 원하는 앨범 & 플레이리스트 분위기
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_MOODS.map((mood) => {
              const active = targetMood.includes(mood.slice(2).trim())
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setTargetMood(mood.slice(2).trim())}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${
                    active
                      ? 'bg-violet-600 text-white font-medium shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {mood}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            placeholder="직접 분위기나 테마를 적어도 좋아요 (예: 퇴근길에 듣기 좋은 벅차오르는 감성 J-POP 밴드)"
            value={targetMood}
            onChange={(e) => setTargetMood(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs placeholder:text-zinc-400 focus:border-violet-500 focus:outline-hidden"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            ⚠️ {error}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
          >
            전체 지우기
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>
                  {loadingStep === 1 && '가사 서사 및 키워드 분석 중...'}
                  {loadingStep === 2 && '지정 포맷 맞춤 앨범 라이너 노트 작성 중...'}
                  {loadingStep === 3 && '유튜브 타이틀·설명글·고정댓글 완성 중...'}
                </span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>앨범 & 유튜브 패키지 완성하기</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 결과 섹션 */}
      {result && (
        <div id="result-section" className="mt-12 space-y-8 pt-6 border-t border-zinc-200">
          {/* 상단 액션 바 */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  포맷 완성됨
                </span>
                <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                  {result.albumTypeLabel.ko} ({result.albumTypeLabel.ja})
                </span>
                <h2 className="text-xl font-bold text-zinc-900">
                  제작된 앨범 & 유튜브 패키지
                </h2>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                전달해주신 포맷 규칙에 맞춰 가사 맞춤형으로 100% 최적화되었습니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
              >
                <span>💾</span>
                <span>마크다운(.md) 저장</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `# ${result.albumTitle.korean} / ${result.albumTitle.japanese} (${result.albumTitle.english})\n[${result.albumTypeLabel.ko} / ${result.albumTypeLabel.ja}]\n\n[앨범 설명글]\n${result.albumDescription.japanese}\n\n${result.credits}\n\n[유튜브 타이틀]\n${result.youtubeTitles.main}\n\n[유튜브 설명글]\n${result.youtubeDescription.fullFormattedText}\n\n[유튜브 고정 댓글]\n${result.pinnedComment.fullCommentText}`,
                    'all'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-violet-700"
              >
                <span>{copiedKey === 'all' ? '✓' : '📋'}</span>
                <span>{copiedKey === 'all' ? '전체 복사 완료!' : '전체 패키지 복사'}</span>
              </button>
            </div>
          </div>

          {/* 1. 앨범명 & 2. 앨범 주제 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                01 & 02 · 앨범명 및 앨범 주제
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `[${result.albumTypeLabel.ko} / ${result.albumTypeLabel.ja}]\n앨범명(KO): ${result.albumTitle.korean}\n앨범명(JA): ${result.albumTitle.japanese}\n앨범명(EN): ${result.albumTitle.english}\n부제: ${result.albumTitle.subtitle}\n\n주제: ${result.albumTheme.coreConcept}\n장르: ${result.albumTheme.genreMood}\n서사: ${result.albumTheme.narrativeArc}`,
                    'album-basic'
                  )
                }
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                {copiedKey === 'album-basic' ? '✓ 복사됨' : '정보 복사'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                    {result.albumTypeLabel.ja}
                  </span>
                  <span className="text-sm font-semibold text-zinc-500">
                    {result.albumTitle.japanese} ({result.albumTitle.english})
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {result.albumTitle.korean}
                </h3>
                <p className="mt-2 text-sm italic text-violet-700 font-medium">
                  &ldquo;{result.albumTitle.subtitle}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-zinc-500">핵심 컨셉</div>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {result.albumTheme.coreConcept}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-zinc-500">추천 장르 & 사운드 무드</div>
                  <p className="text-xs text-zinc-700 leading-relaxed">
                    {result.albumTheme.genreMood}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-zinc-500 mb-1.5">감정의 서사 흐름</div>
                <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed">
                  {result.albumTheme.narrativeArc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.albumTheme.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 border border-violet-100"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 앨범 설명글 (전달해주신 포맷 적용) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                  03 · 앨범 설명글 (지정 포맷)
                </span>
                <div className="flex rounded-lg bg-zinc-100 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDescLangTab('ja')}
                    className={`rounded-md px-2 py-0.5 font-medium transition ${
                      descLangTab === 'ja'
                        ? 'bg-white text-violet-700 shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    일본어 원문 ({result.albumTypeLabel.ja})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescLangTab('ko')}
                    className={`rounded-md px-2 py-0.5 font-medium transition ${
                      descLangTab === 'ko'
                        ? 'bg-white text-violet-700 shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    한국어 번역 ({result.albumTypeLabel.ko})
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `${
                      descLangTab === 'ja'
                        ? result.albumDescription.japanese
                        : result.albumDescription.korean
                    }\n\n${result.credits}`,
                    'album-desc'
                  )
                }
                className="rounded-lg bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {copiedKey === 'album-desc' ? '✓ 설명글+크레딧 복사됨' : '설명글+크레딧 복사'}
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-zinc-800 whitespace-pre-line leading-relaxed text-xs sm:text-sm bg-zinc-50 p-4 sm:p-5 rounded-xl border border-zinc-200/80 font-sans">
              {descLangTab === 'ja'
                ? result.albumDescription.japanese
                : result.albumDescription.korean}
            </div>

            {/* 앨범 설명글 하단 고정 크레딧 */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                  <span>🎼</span> Production & Personnel Credits
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.credits, 'credits')}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  {copiedKey === 'credits' ? '✓ 크레딧 복사됨' : '크레딧만 복사'}
                </button>
              </div>
              <pre className="font-mono text-xs text-zinc-700 bg-zinc-100/70 p-3.5 rounded-xl border border-zinc-200 leading-relaxed whitespace-pre-wrap">
                {result.credits}
              </pre>
            </div>
          </div>

          {/* 4. 유튜브 썸네일 아이디어 */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                04 · 유튜브 썸네일 아이디어
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `[썸네일 비주얼]\n구도: ${result.thumbnailIdea.visualSummary}\n조명/분위기: ${result.thumbnailIdea.atmosphere}\n\n[추천 카피]\n${result.thumbnailIdea.recommendedCopy.join('\n')}\n\n[AI 이미지 프롬프트]\n${result.thumbnailIdea.aiImagePrompt}`,
                    'thumb'
                  )
                }
                className="text-xs text-zinc-400 hover:text-zinc-700"
              >
                {copiedKey === 'thumb' ? '✓ 복사됨' : '썸네일 정보 복사'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-1">비주얼 구도 & 피사체</div>
                  <p className="text-xs text-zinc-800 leading-relaxed">
                    {result.thumbnailIdea.visualSummary}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-1">조명 & 무드</div>
                  <p className="text-xs text-zinc-800 leading-relaxed">
                    {result.thumbnailIdea.atmosphere}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-1.5">추천 컬러 팔레트</div>
                  <div className="flex flex-wrap gap-2">
                    {result.thumbnailIdea.colorPalette.map((col, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCopy(col.hex, `hex-${idx}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] hover:bg-zinc-100"
                        title="클릭하여 HEX 복사"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="font-mono text-zinc-700">{col.hex}</span>
                        <span className="text-zinc-400 text-[10px]">({col.name})</span>
                        {copiedKey === `hex-${idx}` && (
                          <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-zinc-500 mb-1.5">
                    썸네일 텍스트 카피 문구 추천
                  </div>
                  <ul className="space-y-1">
                    {result.thumbnailIdea.recommendedCopy.map((copy, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-amber-50/60 border border-amber-200/50 px-3 py-1.5 text-xs text-amber-900"
                      >
                        <span className="font-medium">&ldquo;{copy}&rdquo;</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(copy, `copy-${i}`)}
                          className="text-[11px] text-amber-700 hover:underline"
                        >
                          {copiedKey === `copy-${i}` ? '✓' : '복사'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI 이미지 프롬프트 박스 */}
              <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-white">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-violet-400 tracking-wider">
                      🎨 AI IMAGE PROMPT (Midjourney / Imagen / Flux)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(result.thumbnailIdea.aiImagePrompt, 'prompt')}
                      className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-700"
                    >
                      {copiedKey === 'prompt' ? '✓ 복사됨' : '프롬프트 복사'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed text-zinc-300 break-words">
                    {result.thumbnailIdea.aiImagePrompt}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>16:9 유튜브 썸네일 규격 최적화</span>
                  <span>이미지 생성 도구에 붙여넣기만 하세요</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 유튜브 타이틀 (전달해주신 3대 패턴 적용) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                05 · 유튜브 타이틀 (지정 3대 패턴 맞춤)
              </span>
            </div>

            <div className="space-y-3">
              {/* 패턴 1: 감성 소망형 */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 hover:bg-zinc-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-violet-700 flex items-center gap-1.5">
                    <span className="rounded bg-violet-100 px-1.5 py-0.5">패턴 1</span>
                    감성 소망형 (노래 모음)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.youtubeTitles.pattern1, 'yt-title-1')}
                    className="rounded-md bg-white border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {copiedKey === 'yt-title-1' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-900 break-words">
                  {result.youtubeTitles.pattern1}
                </div>
              </div>

              {/* 패턴 2: 퇴근길 몰입형 */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 hover:bg-zinc-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5">패턴 2</span>
                    퇴근길 & 상황 몰입형
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.youtubeTitles.pattern2, 'yt-title-2')}
                    className="rounded-md bg-white border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {copiedKey === 'yt-title-2' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-900 break-words">
                  {result.youtubeTitles.pattern2}
                </div>
              </div>

              {/* 패턴 3: 지친 하루 끝 위로형 */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 hover:bg-zinc-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5">패턴 3</span>
                    지친 하루 끝 & 벅차오르는 마음
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.youtubeTitles.pattern3, 'yt-title-3')}
                    className="rounded-md bg-white border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    {copiedKey === 'yt-title-3' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-900 break-words">
                  {result.youtubeTitles.pattern3}
                </div>
              </div>

              {/* 추가 대체 타이틀 */}
              {result.youtubeTitles.alternatives.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">추가 대체 옵션</div>
                  <div className="space-y-1.5">
                    {result.youtubeTitles.alternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-2.5 hover:bg-zinc-50"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            {alt.style}
                          </span>
                          <span className="text-xs text-zinc-700 break-words font-medium">
                            {alt.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(alt.title, `yt-alt-${idx}`)}
                          className="shrink-0 text-xs text-zinc-400 hover:text-zinc-700 ml-2"
                        >
                          {copiedKey === `yt-alt-${idx}` ? '✓' : '복사'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. 유튜브 설명글 (전달해주신 4단락 + Tracklist + 해시태그 포맷) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                  06 · 유튜브 설명글 (지정 포맷)
                </span>
                <span className="block text-[11px] text-zinc-400">
                  한·영·일 4단락 소개 + [Tracklist] 00:00 일/한 병기 + SEO 해시태그
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(result.youtubeDescription.fullFormattedText, 'yt-desc-full')
                }
                className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-violet-700"
              >
                {copiedKey === 'yt-desc-full' ? '✓ 설명란 전체 복사됨!' : '설명란 전체 복사'}
              </button>
            </div>

            {/* 본문 미리보기 */}
            <div className="relative">
              <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-900 p-4 sm:p-5 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-96">
                {result.youtubeDescription.fullFormattedText}
              </pre>
            </div>
          </div>

          {/* 7. 유튜브 고정 댓글 (전달해주신 인사 + 강추 트랙 + 질문 포맷) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-violet-600 tracking-wider uppercase">
                  07 · 유튜브 고정 댓글 (지정 포맷)
                </span>
                <span className="block text-[11px] text-zinc-400">
                  하루의 수고 위로 + 개인 강추 트랙리스트 + 시청자 최애곡 질문
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(result.pinnedComment.fullCommentText, 'pinned-comment')
                }
                className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-violet-700"
              >
                {copiedKey === 'pinned-comment' ? '✓ 고정 댓글 복사됨!' : '고정 댓글 복사'}
              </button>
            </div>

            {/* 유튜브 실제 댓글 UI 시뮬레이션 */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  DJ
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">@PlaylistMaster</span>
                    <span className="rounded bg-zinc-200 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-700">
                      작성자
                    </span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <span>📌</span> 고정됨
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-zinc-800 bg-white p-4 rounded-lg border border-zinc-200/70 font-sans">
                    {result.pinnedComment.fullCommentText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수노 히스토리 가사 선택 모달 */}
      <SunoLyricsPickerModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          setTargetTrackForModal(null)
        }}
        onImportSongs={handleImportFromHistory}
        onInsertSingleSong={handleInsertSingleSong}
        targetTrackIndex={targetTrackForModal}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-xs font-medium text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
