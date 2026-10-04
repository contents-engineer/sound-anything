// lib/youtube/revenue.ts
import { YouTubeChannelInfo, YouTubeVideoItem } from './api'

export interface RevenueEstimation {
  type: 'channel' | 'video'
  period: '30d' | '1y' | 'all'
  title: string
  targetViews: number
  estimatedDurationAvgSec: number
  hasMidrollBonus: boolean
  rpmKrw: number
  rpmUsd: number

  // 유튜브 광고 예상 수익
  youtubeAdRevenueKrw: number
  youtubeAdRevenueUsd: number

  // 음원 유통 스트리밍 예상 수익
  streamingRoyaltyKrw: number
  streamingRoyaltyUsd: number

  // 합산 총 예상 수익
  totalRevenueKrw: number
  totalRevenueUsd: number

  // 단일 영상일 때 1회성 vs 일일
  dailyRevenueKrw?: number

  // 상위 영상별 예상 수익
  topVideos?: Array<{
    id: string
    title: string
    thumbnailUrl: string
    viewCount: number
    estimatedRevenueKrw: number
    isLongForm: boolean
  }>
}

const KRW_PER_USD = 1350 // 기준 환율

export function calculateRevenue(
  channel: YouTubeChannelInfo,
  videos: YouTubeVideoItem[],
  period: '30d' | '1y' | 'all',
  singleVideo?: YouTubeVideoItem
): RevenueEstimation {
  if (singleVideo) {
    // 단일 영상 분석 모드
    const isLongForm = singleVideo.durationSec >= 480 // 8분 이상 미드롤 가능
    const baseRpm = 2200 // 1,000회당 2,200원
    const effectiveRpm = isLongForm ? Math.round(baseRpm * 1.5) : baseRpm

    const adRevenueKrw = Math.round((singleVideo.viewCount / 1000) * effectiveRpm)
    // 음원 스트리밍 전환 추정 (조회수의 약 4%가 스트리밍 청취, 스트리밍당 4원)
    const streamingKrw = Math.round(singleVideo.viewCount * 0.04 * 4.2)

    return {
      type: 'video',
      period,
      title: singleVideo.title,
      targetViews: singleVideo.viewCount,
      estimatedDurationAvgSec: singleVideo.durationSec,
      hasMidrollBonus: isLongForm,
      rpmKrw: effectiveRpm,
      rpmUsd: Number((effectiveRpm / KRW_PER_USD).toFixed(2)),
      youtubeAdRevenueKrw: adRevenueKrw,
      youtubeAdRevenueUsd: Math.round(adRevenueKrw / KRW_PER_USD),
      streamingRoyaltyKrw: streamingKrw,
      streamingRoyaltyUsd: Math.round(streamingKrw / KRW_PER_USD),
      totalRevenueKrw: adRevenueKrw + streamingKrw,
      totalRevenueUsd: Math.round((adRevenueKrw + streamingKrw) / KRW_PER_USD),
    }
  }

  // 채널 전체 분석 모드
  const longFormCount = videos.filter((v) => v.durationSec >= 480).length
  const longFormRatio = videos.length > 0 ? longFormCount / videos.length : 0.6
  const hasMidrollBonus = longFormRatio >= 0.5

  const avgDuration =
    videos.length > 0
      ? Math.round(videos.reduce((acc, v) => acc + v.durationSec, 0) / videos.length)
      : 3600

  // RPM 기본 2,400원, 8분 이상 영상 비율에 따라 가중
  const effectiveRpm = Math.round(2200 * (1 + longFormRatio * 0.6)) // 2,200 ~ 3,500원

  // 최근 업로드 영상들의 일일 뷰 증가율 추산
  const now = Date.now()
  let totalRecentDailyViews = 0
  videos.slice(0, 10).forEach((v) => {
    const ageDays = Math.max(0.5, (now - new Date(v.publishedAt).getTime()) / (1000 * 3600 * 24))
    totalRecentDailyViews += v.viewCount / ageDays
  })

  // 채널의 활성 일일 예상 조회수
  const estimatedDailyChannelViews = Math.max(
    100,
    Math.round(totalRecentDailyViews * 1.3)
  )

  let targetViews = 0
  if (period === '30d') {
    targetViews = estimatedDailyChannelViews * 30
  } else if (period === '1y') {
    targetViews = estimatedDailyChannelViews * 365
  } else {
    // 전체 누적
    targetViews = channel.statistics.viewCount
  }

  const adRevenueKrw = Math.round((targetViews / 1000) * effectiveRpm)
  // 음원 스트리밍 유통 수익 (약 4% 청취자 전환 * 회당 4.2원)
  const streamingKrw = Math.round(targetViews * 0.035 * 4.2)

  const topVideos = videos.slice(0, 8).map((v) => {
    const isLong = v.durationSec >= 480
    const videoRpm = isLong ? Math.round(2200 * 1.5) : 2200
    const rev = Math.round((v.viewCount / 1000) * videoRpm)
    return {
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      viewCount: v.viewCount,
      estimatedRevenueKrw: rev,
      isLongForm: isLong,
    }
  })

  return {
    type: 'channel',
    period,
    title: channel.title,
    targetViews,
    estimatedDurationAvgSec: avgDuration,
    hasMidrollBonus,
    rpmKrw: effectiveRpm,
    rpmUsd: Number((effectiveRpm / KRW_PER_USD).toFixed(2)),
    youtubeAdRevenueKrw: adRevenueKrw,
    youtubeAdRevenueUsd: Math.round(adRevenueKrw / KRW_PER_USD),
    streamingRoyaltyKrw: streamingKrw,
    streamingRoyaltyUsd: Math.round(streamingKrw / KRW_PER_USD),
    totalRevenueKrw: adRevenueKrw + streamingKrw,
    totalRevenueUsd: Math.round((adRevenueKrw + streamingKrw) / KRW_PER_USD),
    dailyRevenueKrw: Math.round((estimatedDailyChannelViews / 1000) * effectiveRpm),
    topVideos,
  }
}
