// app/watermark/page.tsx
import type { Metadata } from 'next'
import { WatermarkTool } from '@/components/WatermarkTool'

export const metadata: Metadata = {
  title: '제미나이 워터마크 제거',
  description:
    '제미나이·나노바나나로 생성한 이미지의 스파클 로고를 브라우저에서 바로 제거합니다. 서버 업로드 없음.',
}

export default function WatermarkPage() {
  return <WatermarkTool />
}
