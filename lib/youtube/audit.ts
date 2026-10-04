// lib/youtube/audit.ts
import { GoogleGenAI, Type } from '@google/genai'
import { YouTubeChannelInfo, YouTubeVideoItem } from './api'

export interface SelfAuditInput {
  contentIdDispute: 'none' | 'few' | 'many'
  sunoLicense: 'commercial_paid' | 'free_plan' | 'original_human' | 'not_applicable'
  licenseNotice: 'explicit' | 'missing'
}

export interface DeductionItem {
  id: string
  name: string
  points: number
  description: string
  reason: string
}

export interface CategoryEvaluation {
  id: string
  name: string
  maxPoints: number
  score: number
  isSafe: boolean
  deductions: DeductionItem[]
  passedChecks: string[]
  comment: string
}

export interface AuditResult {
  totalScore: number // 100점 만점
  grade: '매우 안전' | '안전' | '주의' | '위험' | '심각'
  gradeColor: 'emerald' | 'lime' | 'amber' | 'orange' | 'red'
  gradeSummary: string
  summaryReview: string
  strengths: string[]
  risks: string[]
  actionItems: string[]
  categories: {
    inauthentic: CategoryEvaluation // 35점
    reused: CategoryEvaluation // 20점
    metadata: CategoryEvaluation // 20점
    aiLicense: CategoryEvaluation // 15점
    traffic: CategoryEvaluation // 10점
  }
  analyzedAt: string
}

export function getGradeDetails(score: number): {
  grade: '매우 안전' | '안전' | '주의' | '위험' | '심각'
  gradeColor: 'emerald' | 'lime' | 'amber' | 'orange' | 'red'
  gradeSummary: string
} {
  if (score >= 90) {
    return {
      grade: '매우 안전',
      gradeColor: 'emerald',
      gradeSummary: '우등생. 가이드라인을 완벽히 준수하는 고품질 채널이에요. 그대로 쭉 가요!',
    }
  }
  if (score >= 70) {
    return {
      grade: '안전',
      gradeColor: 'lime',
      gradeSummary: '무난하지만 썸네일·메타데이터에 약간의 과장이 섞여 있어요. 다듬으면 더 좋아요.',
    }
  }
  if (score >= 40) {
    return {
      grade: '주의',
      gradeColor: 'amber',
      gradeSummary: 'AI 고지 누락이나 반복 콘텐츠 징후가 발견됐어요. 조금만 더 깎이면 위험해요.',
    }
  }
  if (score >= 20) {
    return {
      grade: '위험',
      gradeColor: 'orange',
      gradeSummary: '레드카드 직전. 심각한 낚시성 제목·가치 부재로 알고리즘 노출이 이미 제한되었을 수 있어요.',
    }
  }
  return {
    grade: '심각',
    gradeColor: 'red',
    gradeSummary: '퇴출 대상. 가짜 라이브·사칭·기만이 다수 발견됐어요. 당장 수정하지 않으면 채널 삭제 위험이 커요.',
  }
}

const AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    totalScore: { type: Type.NUMBER },
    summaryReview: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    categories: {
      type: Type.OBJECT,
      properties: {
        inauthentic: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isSafe: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
            passedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            deductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'name', 'points', 'description', 'reason'],
              },
            },
          },
          required: ['score', 'isSafe', 'comment', 'deductions', 'passedChecks'],
        },
        reused: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isSafe: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
            passedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            deductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'name', 'points', 'description', 'reason'],
              },
            },
          },
          required: ['score', 'isSafe', 'comment', 'deductions', 'passedChecks'],
        },
        metadata: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isSafe: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
            passedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            deductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'name', 'points', 'description', 'reason'],
              },
            },
          },
          required: ['score', 'isSafe', 'comment', 'deductions', 'passedChecks'],
        },
        aiLicense: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isSafe: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
            passedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            deductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'name', 'points', 'description', 'reason'],
              },
            },
          },
          required: ['score', 'isSafe', 'comment', 'deductions', 'passedChecks'],
        },
        traffic: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            isSafe: { type: Type.BOOLEAN },
            comment: { type: Type.STRING },
            passedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            deductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'name', 'points', 'description', 'reason'],
              },
            },
          },
          required: ['score', 'isSafe', 'comment', 'deductions', 'passedChecks'],
        },
      },
      required: ['inauthentic', 'reused', 'metadata', 'aiLicense', 'traffic'],
    },
  },
  required: ['totalScore', 'summaryReview', 'strengths', 'risks', 'actionItems', 'categories'],
}

export async function auditChannelWithGemini(
  channel: YouTubeChannelInfo,
  videos: YouTubeVideoItem[],
  selfAudit: SelfAuditInput,
  geminiApiKey: string
): Promise<AuditResult> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey })

  // 영상 통계 요약
  const videoSummaryList = videos.slice(0, 15).map((v, i) => ({
    no: i + 1,
    id: v.id,
    title: v.title,
    durationFormatted: v.durationFormatted,
    durationSec: v.durationSec,
    views: v.viewCount,
    likes: v.likeCount,
    comments: v.commentCount,
    tags: v.tags.slice(0, 8),
    descExcerpt: v.description.slice(0, 180),
  }))

  const prompt = `당신은 YouTube 정책 및 수익화 적격성 심사 전문 AI 심사관입니다.
2025년 7월 15일 개정된 YouTube "Inauthentic Content (기존 repetitious content)" 정책을 철저하게 기준으로 삼아 다음 음악/플레이리스트 채널을 분석하고 100점 만점으로 감점 평가해 주세요.

[채널 정보]
- 채널명: ${channel.title} (${channel.customUrl || channel.id})
- 채널 설명: ${channel.description || '(설명 없음)'}
- 구독자수: ${channel.statistics.subscriberCount.toLocaleString()}명
- 총 조회수: ${channel.statistics.viewCount.toLocaleString()}회
- 총 영상수: ${channel.statistics.videoCount}개

[자가진단 입력 정보]
- Content ID 분쟁 이력: ${
    selfAudit.contentIdDispute === 'none'
      ? '분쟁 없음'
      : selfAudit.contentIdDispute === 'few'
      ? '1~2회 경미한 분쟁'
      : '다수의 분쟁 이력 존재 (위험 등급 한단계 보수적용)'
  }
- Suno/Udio 상업 라이선스: ${
    selfAudit.sunoLicense === 'commercial_paid'
      ? '유료 플랜 상업 라이선스 보유'
      : selfAudit.sunoLicense === 'free_plan'
      ? '무료 플랜 사용 (수익화 시 핵심 위반 위험)'
      : '직접 연주 또는 해당 없음'
  }
- 설명란 라이선스 명시 여부: ${
    selfAudit.licenseNotice === 'explicit'
      ? '매 영상 설명란에 상업 라이선스 및 출처 명시함'
      : '설명란에 라이선스 미명시'
  }

[최근 업로드 영상 메타데이터 (최대 15개)]
${JSON.stringify(videoSummaryList, null, 2)}

[평가 기준 및 5개 영역 배점표]
총 100점 만점이며, 5개 영역의 위반 사항에 대해 정해진 감점을 적용하여 산출합니다.

1. Inauthentic Content · 인증성 저하 · 35점 (최우선 위험)
   - 정상 패턴(감점 아님): 시리즈 제목("비 오는 날 lo-fi #1, #2"), 일관된 썸네일 디자인(브랜딩), 같은 장르/무드 반복(채널 정체성), 비슷한 영상 길이(1시간 등).
   - 감점 대상:
     * 대량 양산형 템플릿(Mass Production) [-15점]: 시각 일관성 + 음악도 거의 동일한 영상 양산.
     * 저퀄리티 단순 반복(Low-Effort Loop) [-10점]: 한 영상 안에서 짧은 클립이 무의미하게 무한 루프.
     * 트랙 반복(Low Variation) [-10점]: 같은 곡이나 거의 동일한 곡 구성이 여러 영상에 반복 등장.

2. Reused Content · 콘텐츠 재사용 · 20점
   - 감점 대상:
     * 자기 채널 트랙 재사용(Self-Duplicate) [-10점]: 이미 올린 곡을 썸네일/제목만 바꿔 다시 올림.
     * 큐레이션 복제(Copy-Paste Curation) [-10점]: 타 채널 AI 음악 플리의 곡 구성/순서를 90%+ 그대로 차용.

3. 메타데이터 · 정체성 기만 · 20점
   - 감점 대상:
     * 가짜 실시간(Fake LIVE) 위장 [-10점]: 라이브 송출 기록 없는 일반 영상에 "LIVE/실시간/생방송" 표기.
     * 키워드 낚시·사칭 [-5점]: 미수록 유명 아티스트·"최신곡" 키워드 남발.
     * 카테고리 오설정·우회 [-5점]: 음악인데 교육/노하우 등으로 등록.

4. AI 라이선스 및 실존 인물 보호 · 15점
   - YouTube의 AI 디스클로저는 실존 인물 모방에 한정. 일반 AI 창작 자체는 정상.
   - 감점 대상:
     * 실존 인물 모방(Real Person Impersonation) [-10점]: 실존 아티스트 음성/정체성 AI 모방.
     * 상업 라이선스 미증빙 [자가진단 연계] [-5점]: Suno/Udio 무료 플랜을 쓰거나 설명란에 라이선스 증빙 미명시 시.

5. 시각·청취 기만 및 비정상 트래픽 · 10점
   - 감점 대상:
     * 썸네일·음악 부조화(Thumb-Music Mismatch) [-5점]: 자극적 썸네일 vs 평범한 음악.
     * 인위적 트래픽 징후 [-5점]: 조회수 대비 댓글/좋아요 비율 비정상.

모든 감점(deductions)은 근거 이유(reason)를 구체적으로 작성하세요.
통과된 정상 패턴(passedChecks)도 자세히 명시해주세요.
최종 총점(totalScore)은 5개 영역 점수의 합입니다. (0 ~ 100)`

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: AUDIT_SCHEMA,
    },
  })

  const text = resp.text || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error('Gemini 분석 결과를 파싱하는데 실패했습니다: ' + (e instanceof Error ? e.message : ''))
  }

  // 자가진단 보정 (Content ID 분쟁 누적 시 보수적 감점 또는 등급 조정)
  let totalScore = Math.max(0, Math.min(100, Math.round(Number(parsed.totalScore || 85))))
  if (selfAudit.contentIdDispute === 'many' && totalScore > 39) {
    totalScore = Math.min(totalScore, 39) // 분쟁 다수 시 위험 등급 이하로 보수 평가
  }

  const gradeDetails = getGradeDetails(totalScore)

  return {
    totalScore,
    grade: gradeDetails.grade,
    gradeColor: gradeDetails.gradeColor,
    gradeSummary: gradeDetails.gradeSummary,
    summaryReview: parsed.summaryReview || '',
    strengths: parsed.strengths || [],
    risks: parsed.risks || [],
    actionItems: parsed.actionItems || [],
    categories: {
      inauthentic: {
        id: 'inauthentic',
        name: 'Inauthentic Content · 인증성 저하',
        maxPoints: 35,
        score: Math.min(35, Math.max(0, Number(parsed.categories?.inauthentic?.score ?? 35))),
        isSafe: Boolean(parsed.categories?.inauthentic?.isSafe),
        deductions: parsed.categories?.inauthentic?.deductions || [],
        passedChecks: parsed.categories?.inauthentic?.passedChecks || [],
        comment: parsed.categories?.inauthentic?.comment || '',
      },
      reused: {
        id: 'reused',
        name: 'Reused Content · 콘텐츠 재사용',
        maxPoints: 20,
        score: Math.min(20, Math.max(0, Number(parsed.categories?.reused?.score ?? 20))),
        isSafe: Boolean(parsed.categories?.reused?.isSafe),
        deductions: parsed.categories?.reused?.deductions || [],
        passedChecks: parsed.categories?.reused?.passedChecks || [],
        comment: parsed.categories?.reused?.comment || '',
      },
      metadata: {
        id: 'metadata',
        name: '메타데이터 · 정체성 기만',
        maxPoints: 20,
        score: Math.min(20, Math.max(0, Number(parsed.categories?.metadata?.score ?? 20))),
        isSafe: Boolean(parsed.categories?.metadata?.isSafe),
        deductions: parsed.categories?.metadata?.deductions || [],
        passedChecks: parsed.categories?.metadata?.passedChecks || [],
        comment: parsed.categories?.metadata?.comment || '',
      },
      aiLicense: {
        id: 'aiLicense',
        name: 'AI 라이선스 및 실존 인물 보호',
        maxPoints: 15,
        score: Math.min(15, Math.max(0, Number(parsed.categories?.aiLicense?.score ?? 15))),
        isSafe: Boolean(parsed.categories?.aiLicense?.isSafe),
        deductions: parsed.categories?.aiLicense?.deductions || [],
        passedChecks: parsed.categories?.aiLicense?.passedChecks || [],
        comment: parsed.categories?.aiLicense?.comment || '',
      },
      traffic: {
        id: 'traffic',
        name: '시각 · 청취 기만 및 비정상 트래픽',
        maxPoints: 10,
        score: Math.min(10, Math.max(0, Number(parsed.categories?.traffic?.score ?? 10))),
        isSafe: Boolean(parsed.categories?.traffic?.isSafe),
        deductions: parsed.categories?.traffic?.deductions || [],
        passedChecks: parsed.categories?.traffic?.passedChecks || [],
        comment: parsed.categories?.traffic?.comment || '',
      },
    },
    analyzedAt: new Date().toISOString(),
  }
}
