// app/rescene/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { GenerationMode, GenerationResult, Selections, SongConcept } from '@/types'
import { RESCENE_MEMBERS, type ResceneMemberVocal } from '@/lib/rescene-vocal'
import { ResceneVocalSelector } from '@/components/ResceneVocalSelector'
import { ResultPanel } from '@/components/ResultPanel'
import { ResultSkeleton } from '@/components/ResultSkeleton'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { ApiKeySettings } from '@/components/ApiKeySettings'
import { loadHistory, pushHistory, clearHistory } from '@/lib/history'
import { loadApiKey, saveApiKey, clearApiKey } from '@/lib/apiKey'
import { DEFAULT_MODEL_ID, MODELS, formatPricing, formatPromo } from '@/lib/models'
import { CLIENT_TIMEOUT_MS as TIMEOUT_MS } from '@/lib/timeouts'

// 리센느 시그니처 향기 테마
interface ScentTheme {
  id: string
  emoji: string
  name: string
  subname: string
  bpm: string
  description: string
  vocalRecommend: string
  genre: string
  topic: string
  instruments: string[]
}

const SCENT_THEMES: ScentTheme[] = [
  {
    id: 'amber',
    emoji: '✨',
    name: '용연향 (앰버그리스) 딥하우스',
    subname: '미니 1집 테마 — 몽환적 감각',
    bpm: '약간 빠름 (110-130 BPM)',
    description: '깊고 은은하게 번지는 앰버그리스 잔향, 묵직하고 둥근 버블링 서브 베이스와 세련된 딥하우스 그루브',
    vocalRecommend: '리센느 완전체 (5인 에테리얼 하모니)',
    genre: 'K-Pop 딥하우스 (RESCENE Deep House)',
    topic: '기억의 문을 여는 앰버그리스 잔향, 몽환적인 밤의 드라이브, 귓가에 남은 속삭임',
    instruments: ['베이스', '신디사이저', '808 비트'],
  },
  {
    id: 'bubble',
    emoji: '🫧',
    name: '스파클링 탄산 2-Step (128 BPM)',
    subname: 'LOVE ATTACK 무드 — 톡 쏘는 설렘',
    bpm: '빠름 (130-150 BPM)',
    description: '128 BPM 질주감 넘치는 2-Step Garage 셔플, 톡 터지는 탄산 기포 사운드와 산뜻한 에너제틱 훅',
    vocalRecommend: '리센느 원이 (리더·산뜻한 그루브·에너지)',
    genre: 'K-Pop 2-Step Garage (128 BPM)',
    topic: '심장이 128 BPM으로 뛰는 러브어택, 탄산 기포처럼 팡 터지는 설렘, 멈출 수 없는 셔플',
    instruments: ['808 비트', '신디사이저', '베이스'],
  },
  {
    id: 'floral',
    emoji: '🌸',
    name: '화이트 플로럴 & 잔향',
    subname: '데뷔 앨범 테마 — 순수 크리스탈',
    bpm: '약간 빠름 (110-130 BPM)',
    description: '청초하고 우아한 생화 꽃잎의 향기, 유리구슬처럼 투명한 플럭 신스와 맑고 서정적인 감성 하우스',
    vocalRecommend: '리센느 리브 (리드보컬·맑은 크리스탈톤·안정된 중고음)',
    genre: 'K-Pop 플로럴 딥하우스',
    topic: '바람결에 스쳐간 플로럴 노트, 잊혀지지 않는 첫사랑의 잔향, 투명한 봄날의 기억',
    instruments: ['신디사이저', '그랜드 피아노', '베이스'],
  },
  {
    id: 'petrichor',
    emoji: '🌧️',
    name: '비 갠 뒤 풀잎 (페트리코)',
    subname: 'Deja Vu 무드 — 싱그러운 촉촉함',
    bpm: '보통 (90-110 BPM)',
    description: '소나기가 그친 뒤 피어나는 흙과 풀잎의 냄새(페트리코), 따뜻한 아날로그 신스 패드와 그루비 베이스',
    vocalRecommend: '리센느 메이 (서브보컬·몽환적 브레시·섬세한 잔향)',
    genre: 'K-Pop 베드룸 신스팝 & 칠 팝',
    topic: '비 갠 뒤 맑아진 하늘, 촉촉한 풀잎에 맺힌 작은 물방울, 아련하게 스며드는 위로',
    instruments: ['신디사이저', '어쿠스틱 기타', '베이스'],
  },
  {
    id: 'soap',
    emoji: '🧼',
    name: '포근한 비누(Soap) 린넨 팝',
    subname: '미니 2집 Glow Up 테마 — 깨끗한 일상',
    bpm: '약간 빠름 (110-130 BPM)',
    description: '방금 씻고 나온 듯한 순백의 비누 향과 보송보송한 코튼 질감, 편안하게 귀를 감싸는 이지리스닝 댄스 팝',
    vocalRecommend: '리센느 미나미 (메인보컬·탄탄한 고음·명확한 딕션)',
    genre: 'K-Pop 이지리스닝 댄스 팝',
    topic: '따뜻한 햇살에 말린 하얀 셔츠, 깨끗한 비누 거품처럼 산뜻한 하루의 시작, 맑은 미소',
    instruments: ['신디사이저', '일렉 피아노', '드럼/퍼커션'],
  },
  {
    id: 'berry',
    emoji: '🍓',
    name: '라즈베리 & 시크 드롭',
    subname: 'Lip Bomb 테마 — 달콤 쌉싸름한 반전',
    bpm: '약간 빠름 (110-130 BPM)',
    description: '달콤한 베리 향 뒤에 숨겨진 묵직한 베이스 드롭, 트렌디한 어반 비트와 도회적이고 쿨한 엣지',
    vocalRecommend: '리센느 제나 (막내·트렌디 중저음·시크한 엣지)',
    genre: 'K-Pop 딥하우스 & 클럽 믹스',
    topic: '달콤한 유혹과 시크한 시선, 네온사인이 번지는 밤거리, 쫀득하게 귀를 사로잡는 훅',
    instruments: ['베이스', '808 비트', '신디사이저'],
  },
]

export default function RescenePage() {
  const router = useRouter()
  const [selectedThemeId, setSelectedThemeId] = useState<string>('amber')
  const [selectedVocals, setSelectedVocals] = useState<string[]>([
    '리센느 완전체 (5인 에테리얼 하모니)',
  ])
  const [songCount, setSongCount] = useState<number>(3)
  const [loadingCount, setLoadingCount] = useState<number>(3)
  const [customTopic, setCustomTopic] = useState<string>('')
  const [language, setLanguage] = useState<string>(
    '한·일 감성 혼용 (노이 neu 스타일: 한국어 80% + 일본어 20%)'
  )
  const [tempo, setTempo] = useState<string>('125-130 BPM (딥하우스/2-Step)')
  const [lengthMin, setLengthMin] = useState<number>(3)

  const [loading, setLoading] = useState<GenerationMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [history, setHistory] = useState<GenerationResult[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)
  const selectedModel = MODELS.find((m) => m.id === modelId)
  const [apiKey, setApiKey] = useState('')
  const [regenIndex, setRegenIndex] = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const currentTheme = useMemo(
    () => SCENT_THEMES.find((t) => t.id === selectedThemeId) || SCENT_THEMES[0],
    [selectedThemeId]
  )

  useEffect(() => {
    setHistory(loadHistory())
    setApiKey(loadApiKey())
  }, [])

  useEffect(() => {
    if (!result) return
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [result])

  function handleSelectTheme(theme: ScentTheme) {
    setSelectedThemeId(theme.id)
    if (selectedVocals.length === 0 || selectedVocals.includes('리센느 완전체 (5인 에테리얼 하모니)')) {
      setSelectedVocals([theme.vocalRecommend])
    }
  }

  function handleToggleVocal(label: string) {
    setSelectedVocals((prev) => {
      if (prev.includes(label)) {
        const next = prev.filter((v) => v !== label)
        return next.length > 0 ? next : [RESCENE_MEMBERS[0].label]
      }
      return [...prev, label]
    })
  }

  function handleSelectExclusiveMember(label: string) {
    setSelectedVocals([label])
  }

  function cancelInFlight() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  function buildSelections(): Selections {
    const combinedTopic = [
      currentTheme.topic,
      customTopic.trim() ? customTopic.trim() : null,
    ]
      .filter(Boolean)
      .join(', ')

    return {
      genre: 'K-pop',
      era: '2020s 현대',
      mood: ['로맨틱 감성', '설레는 봄날'],
      vocal: selectedVocals,
      usage: '유튜브 브이로그 BGM',
      instrument: currentTheme.instruments,
      production: '깨끗한 현대 믹스',
      bpm: tempo.includes('125') ? '약간 빠름 (110-130 BPM)' : '빠름 (130-150 BPM)',
      age: '10대 (청소년)',
      form: '후렴 선행 (90년대식)',
      language: language,
      topic: ['첫사랑', '향수'],
      lengthMin: lengthMin,
      customInputs: {
        genre: currentTheme.genre,
        topic: combinedTopic,
        vocal: selectedVocals.join(', '),
      },
    }
  }

  async function generate(count: number = songCount) {
    cancelInFlight()
    const controller = new AbortController()
    abortRef.current = controller
    const mode: GenerationMode = count === 1 ? 'single' : 'full'
    const timeoutMs = TIMEOUT_MS[mode]
    const timer = window.setTimeout(() => controller.abort(), timeoutMs)

    setError(null)
    setLoading(mode)
    setLoadingCount(count)

    const selections = buildSelections()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selections, mode, songCount: count, model: modelId, apiKey }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message ?? '알 수 없는 오류')
        return
      }
      const enriched: GenerationResult = { ...(data as GenerationResult), selections, songCount: count }
      setResult(enriched)
      setHistory(pushHistory(enriched))
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError(`요청이 취소되었거나 시간 초과(${timeoutMs / 1000}초)되었습니다`)
      } else {
        setError(e instanceof Error ? e.message : '네트워크 오류')
      }
    } finally {
      window.clearTimeout(timer)
      if (abortRef.current === controller) abortRef.current = null
      setLoading(null)
    }
  }

  const regenerateSong = useCallback(
    async (index: number, retryHint?: string) => {
      if (!result?.songs) return
      if (!apiKey) {
        setError('먼저 우측 상단에서 Gemini API 키를 등록해주세요')
        return
      }
      cancelInFlight()
      const controller = new AbortController()
      abortRef.current = controller
      const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS.single)

      setError(null)
      setRegenIndex(index)
      const excludeTitles = result.songs.map((s, i) => (i === index ? null : s.title)).filter(Boolean) as string[]

      try {
        const selections = result.selections ?? buildSelections()
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            selections,
            mode: 'single',
            songCount: 1,
            model: modelId,
            apiKey,
            extras: { excludeTitles, retryHint },
          }),
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error?.message ?? '재생성 실패')
          return
        }
        const newSong: SongConcept | undefined = data?.songs?.[0]
        if (!newSong) {
          setError('새 곡 정보를 받아오지 못했습니다')
          return
        }
        const updatedSongs = [...result.songs]
        updatedSongs[index] = newSong
        const nextResult: GenerationResult = { ...result, songs: updatedSongs }
        setResult(nextResult)
        setHistory(pushHistory(nextResult))
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          setError(`재생성 요청이 취소되었거나 시간 초과(${TIMEOUT_MS.single / 1000}초)되었습니다`)
        } else {
          setError(e instanceof Error ? e.message : '네트워크 오류')
        }
      } finally {
        window.clearTimeout(timer)
        if (abortRef.current === controller) abortRef.current = null
        setRegenIndex(null)
      }
    },
    [apiKey, modelId, result]
  )

  function handleSendToLyricsAlbum() {
    if (!result?.songs || result.songs.length === 0) return
    router.push('/lyrics-album')
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* 헤더 */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-pink-500 text-lg shadow-xs">
              🫧
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              리센느낌 제너레이터
            </h1>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
              RESCENE Studio
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            유튜브 채널 &quot;리센느낌&quot; 전용 — 리센느에게 선물하고 싶은 음악, 리센느에게 팔고 싶은 감각적인 향기 & 딥하우스 트랙 생성
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            ← 일반 수노 제너레이터
          </Link>
          <ApiKeySettings
            apiKey={apiKey}
            onSave={(k) => { saveApiKey(k); setApiKey(k) }}
            onClear={() => { clearApiKey(); setApiKey('') }}
          />
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            히스토리 {history.length}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 채널 비전 소개 배너 */}
        <div className="mb-6 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 p-6 text-white shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-xs">
                YouTube &quot;리센느낌&quot; 공식 제작 스튜디오
              </span>
              <h2 className="mt-2 text-lg sm:text-xl font-bold leading-snug">
                향기로 기억을 깨우는 프루스트 효과 &amp; 128 BPM 딥하우스
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-violet-100 leading-relaxed max-w-2xl">
                리센느 멤버 각자의 음색(미나미의 고음·리브의 크리스탈톤·원의 그루브·메이의 몽환 브레시·제나의 시크 엣지)을 선택하고,
                시그니처 향기 테마를 지정하여 팬들의 마음을 사로잡을 완성도 높은 곡과 가사를 만들어보세요.
              </p>
            </div>
            <Link
              href="/lyrics-album"
              className="shrink-0 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-violet-700 shadow-sm hover:bg-violet-50 transition"
            >
              💿 앨범·유튜브 패키지 생성 →
            </Link>
          </div>
        </div>

        {/* 1. 멤버별 보컬 분석 & 선택기 */}
        <ResceneVocalSelector
          selectedVocals={selectedVocals}
          onToggleVocal={handleToggleVocal}
          onSelectExclusiveMember={handleSelectExclusiveMember}
        />

        {/* 2. 시그니처 향기 & 사운드 테마 선택 */}
        <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">
                🌸
              </span>
              <h3 className="text-sm font-bold text-zinc-900">시그니처 향기 &amp; 무드 테마</h3>
              <span className="hidden sm:inline-block text-xs text-zinc-400">
                리센느 앨범 및 음악 콘셉트 기반
              </span>
            </div>
            <span className="text-xs font-semibold text-violet-600">
              현재: {currentTheme.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCENT_THEMES.map((theme) => {
              const active = selectedThemeId === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme)}
                  className={[
                    'flex flex-col items-start rounded-2xl border p-3.5 text-left transition',
                    active
                      ? 'border-violet-500 bg-violet-50/80 shadow-xs ring-2 ring-violet-400/40'
                      : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{theme.emoji}</span>
                      <span className="text-sm font-bold text-zinc-900">{theme.name}</span>
                    </div>
                    {active && <span className="text-xs font-bold text-violet-600">선택됨</span>}
                  </div>
                  <span className="mt-1 text-[11px] font-semibold text-violet-700">
                    {theme.subname}
                  </span>
                  <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed line-clamp-2">
                    {theme.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {theme.instruments.map((inst) => (
                      <span
                        key={inst}
                        className="rounded bg-white/90 border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-600"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. 세부 사운드 조율 및 가사 요청 */}
        <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs">
          <h3 className="mb-4 text-sm font-bold text-zinc-900 flex items-center gap-2">
            <span>🎛️</span> 세부 사운드 &amp; 가사 요청 설정
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                속도 및 리듬감 (BPM)
              </label>
              <select
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none"
              >
                <option value="125-130 BPM (딥하우스/2-Step)">125-130 BPM (리센느 시그니처 2-Step & 딥하우스)</option>
                <option value="115-124 BPM (그루비 미디엄 댄스)">115-124 BPM (그루비 미디엄 댄스 팝)</option>
                <option value="95-110 BPM (나른한 베드룸 팝)">95-110 BPM (나른한 몽환 베드룸 신스팝)</option>
                <option value="130-140 BPM (에너제틱 클럽 믹스)">130-140 BPM (질주감 넘치는 클럽 믹스)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                가사 언어 스타일
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none"
              >
                <option value="한·일 감성 혼용 (노이 neu 스타일: 한국어 80% + 일본어 20%)">
                  🌸 한·일 감성 혼용 (노이 neu 스타일 — 리센느 추천)
                </option>
                <option value="한국어+영어 섞어서">한국어 + 영어 섞어서 (글로벌 K-Pop 스타일)</option>
                <option value="한국어">순수 한국어 중심</option>
                <option value="일본어">일본어 전용 (J-Pop 헌정 스타일)</option>
                <option value="영어">영어 전용 (글로벌 팝)</option>
              </select>
              {language.includes('노이') && (
                <p className="mt-1.5 text-[11px] text-violet-600 leading-snug">
                  💡 <strong>노이(neu) 스타일:</strong> 한국어로 메인 서사를 이끌고, 인트로·프리코러스·브릿지에 미나미·메이의 감성적인 일본어 속삭임(Whisper)을 블렌딩합니다.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                곡당 목표 길이
              </label>
              <select
                value={lengthMin}
                onChange={(e) => setLengthMin(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none"
              >
                <option value={2}>2분 (숏폼/바이럴 특화)</option>
                <option value={3}>3분 (라디오 싱글 표준)</option>
                <option value={4}>4분 (서사 완결형 딥하우스)</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              사용자 지정 가사 테마 또는 추가 요청 (선택)
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="예: 비 오는 압구정 거리에서 우연히 마주친 옛사랑, 귓가를 스치는 복숭아 향기"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 생성 실행 컨트롤 바 (하단 스티키) */}
        <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-600">생성 곡 수:</span>
              <div className="inline-flex rounded-xl border border-zinc-300 bg-zinc-50 p-0.5">
                {[1, 3, 5, 10].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSongCount(c)}
                    className={[
                      'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                      songCount === c
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900',
                    ].join(' ')}
                  >
                    {c}곡
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">모델:</span>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {selectedModel?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading !== null && (
              <button
                type="button"
                onClick={cancelInFlight}
                className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                취소
              </button>
            )}

            <button
              type="button"
              disabled={loading !== null}
              onClick={() => generate(songCount)}
              className={[
                'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition',
                'bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 hover:opacity-95',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            >
              <span>🫧</span>
              <span>
                {loading !== null
                  ? `리센느 감성 곡 생성 중 (${loadingCount}곡)...`
                  : `리센느낌 ${songCount}곡 생성하기`}
              </span>
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* 생성 진행 스켈레톤 */}
        {loading && (
          <div className="mt-8">
            <ResultSkeleton count={loadingCount} />
          </div>
        )}

        {/* 생성 결과 패널 */}
        {result && (
          <div ref={resultRef} className="mt-8 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-100 to-pink-100 px-5 py-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-violet-900">
                <span>✨</span>
                <span>리센느 느낌 플레이리스트가 성공적으로 완성되었습니다!</span>
              </div>
              <button
                type="button"
                onClick={handleSendToLyricsAlbum}
                className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
              >
                💿 유튜브 설명/타이틀 패키지 만들기 →
              </button>
            </div>

            <ResultPanel
              result={result}
              onRegenerate={regenerateSong}
              regenerating={regenIndex}
            />
          </div>
        )}
      </main>

      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={() => setHistoryOpen(false)}
        onSelect={(h) => {
          setResult(h)
          setHistoryOpen(false)
        }}
        onClear={() => {
          clearHistory()
          setHistory([])
        }}
      />
    </div>
  )
}
