# 플레이리스트 유튜브 제너레이터 — 멀티 도구 셸 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 Suno 생성기 앱을 "플레이리스트 유튜브 제너레이터" 상위 셸 아래 좌측 사이드바로 도구를 전환하는 멀티 도구 구조로 바꾸고, 두 번째 메뉴(제미나이 워터마크 제거)를 플레이스홀더 슬롯으로 추가한다.

**Architecture:** Next.js App Router 라우트로 도구를 분리한다. 루트 레이아웃(`app/layout.tsx`)이 공유 사이드바 셸을 렌더하고 `{children}`에 각 페이지를 끼운다. 수노 생성기는 `/`, 워터마크 제거 플레이스홀더는 `/watermark`. 사이드바는 `usePathname`으로 활성 메뉴를 강조하는 클라이언트 컴포넌트.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript, Tailwind CSS v4. `@/*` 경로 별칭은 `./*`로 매핑됨(tsconfig 확인 완료).

## Global Constraints

- Next.js 16.2.6 App Router 규칙 준수: 루트 레이아웃은 `html`/`body`를 포함해야 함. 네비게이션은 `next/link`의 `<Link>`, 현재 경로는 `next/navigation`의 `usePathname` 사용.
- `'use client'`가 필요한 컴포넌트(훅/이벤트 사용)는 파일 첫 줄에 명시. 서버 컴포넌트만 `metadata`를 export 할 수 있음(클라이언트 페이지는 불가).
- 스타일: 기존 zinc/violet 팔레트와 `rounded-xl`/`rounded-2xl` 톤 재사용. 새 색·폰트·의존성 도입 금지.
- 기존 수노 생성 로직(`app/page.tsx`의 생성/재생성/히스토리), `lib/`, `app/api/`, 기존 컴포넌트는 변경하지 않음.
- 이 프로젝트는 테스트 러너가 없음. 각 태스크 검증은 `npm run lint`와 `npm run build` 통과 + 브라우저 수동 확인으로 한다.
- 텍스트(한국어) 문구는 spec에 명시된 그대로 사용: 앱 대제목 `🎵 플레이리스트 유튜브 제너레이터`, 메뉴 `수노 제너레이터` / `제미나이 워터마크 제거`, 플레이스홀더 안내 `준비 중입니다`.

---

### Task 1: 워터마크 플레이스홀더 페이지

`/watermark` 라우트를 먼저 만들어, 이후 사이드바 링크가 깨진 경로를 가리키지 않도록 한다.

**Files:**
- Create: `app/watermark/page.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `/watermark` 경로(라우트). 사이드바(Task 2)가 이 경로로 링크함.

- [ ] **Step 1: 플레이스홀더 페이지 작성**

`app/watermark/page.tsx` 생성:

```tsx
// app/watermark/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '제미나이 워터마크 제거',
}

export default function WatermarkPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-12 shadow-sm">
        <div className="mb-4 text-4xl">🪄</div>
        <h2 className="text-xl font-bold text-zinc-900">제미나이 워터마크 제거</h2>
        <p className="mt-2 text-sm text-zinc-500">준비 중입니다</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: lint 통과 확인**

Run: `npm run lint`
Expected: 새 파일 관련 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add app/watermark/page.tsx
git commit -m "feat: add Gemini watermark removal placeholder page"
```

---

### Task 2: 사이드바 컴포넌트 + 루트 레이아웃 셸

사이드바 클라이언트 컴포넌트를 만들고 루트 레이아웃에 끼워 앱 셸을 완성한다. 메타 타이틀도 변경.

**Files:**
- Create: `components/Sidebar.tsx`
- Modify: `app/layout.tsx` (전체 교체)

**Interfaces:**
- Consumes: `/`(수노, 기존 `app/page.tsx`), `/watermark`(Task 1) 라우트.
- Produces: `export function Sidebar()` — 인자 없음, JSX 반환. `app/layout.tsx`가 `@/components/Sidebar`에서 import.

- [ ] **Step 1: 사이드바 컴포넌트 작성**

`components/Sidebar.tsx` 생성:

```tsx
// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { label: '수노 제너레이터', href: '/' },
  { label: '제미나이 워터마크 제거', href: '/watermark' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="shrink-0 border-b border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-4">
        <h1 className="mb-3 px-2 text-base font-bold leading-tight text-zinc-900">
          🎵 플레이리스트 유튜브 제너레이터
        </h1>
        <nav className="flex gap-1 md:flex-col">
          {MENU.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-zinc-700 hover:bg-zinc-100',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: 루트 레이아웃에 셸 적용**

`app/layout.tsx` 전체를 다음으로 교체:

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: '플레이리스트 유튜브 제너레이터',
  description: '유튜브 플레이리스트 제작을 위한 도구 모음 — Suno 가사 생성기, 제미나이 워터마크 제거',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: lint 통과 확인**

Run: `npm run lint`
Expected: 에러 없음.

- [ ] **Step 4: 브라우저 수동 확인**

Run: `npm run dev` 후 브라우저에서 `http://localhost:3000` 접속.
Expected:
- 좌측에 `🎵 플레이리스트 유튜브 제너레이터` 타이틀과 메뉴 2개가 보인다.
- `/`에서 `수노 제너레이터` 메뉴가 violet으로 강조된다.
- `제미나이 워터마크 제거` 클릭 시 `/watermark`로 이동, "준비 중입니다" 카드가 보이고 해당 메뉴가 강조된다.
- 기존 수노 생성기 UI가 콘텐츠 영역에 정상 렌더된다.

- [ ] **Step 5: 커밋**

```bash
git add components/Sidebar.tsx app/layout.tsx
git commit -m "feat: add sidebar shell + rebrand to playlist-youtube-generator"
```

---

### Task 3: 수노 페이지 헤더 강등

앱 대제목이 사이드바로 이동했으므로, 수노 페이지의 `<h1>`을 섹션 제목으로 바꾼다. 그 외 로직은 변경 없음.

**Files:**
- Modify: `app/page.tsx:166` (헤더 `<h1>`)

**Interfaces:**
- Consumes: 없음(텍스트/태그만 변경).
- Produces: 없음.

- [ ] **Step 1: 헤더 제목 교체**

`app/page.tsx`에서 다음 줄을:

```tsx
          <h1 className="text-2xl font-bold">Suno.ai Lyrics Generator</h1>
```

다음으로 교체:

```tsx
          <h2 className="text-2xl font-bold">수노 제너레이터</h2>
```

(바로 아래 부제 `<p>프롬프트 + 1곡 또는 10곡 콘셉트를 생성합니다</p>`와 히스토리 버튼은 그대로 유지.)

- [ ] **Step 2: lint + build 통과 확인**

Run: `npm run lint && npm run build`
Expected: 둘 다 통과(에러 없음).

- [ ] **Step 3: 브라우저 수동 확인**

Run: `npm run dev` 후 `/` 접속.
Expected: 콘텐츠 상단에 `수노 제너레이터` 제목이 보이고, 앱 대제목은 사이드바에만 1번 나타난다(중복 없음). 생성/히스토리 동작은 이전과 동일.

- [ ] **Step 4: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: demote Suno page title to section heading under shell"
```

---

## Self-Review

**1. Spec coverage:**
- 멀티 도구 셸 + 대제목 → Task 2 (layout + Sidebar). ✓
- 사이드바 좌측 네비 + 활성 강조 → Task 2 (Sidebar). ✓
- 수노 = `/`, 로직 불변, 헤더 강등 → Task 3. ✓
- 워터마크 = `/watermark` 플레이스홀더 "준비 중", 자체 metadata, 서버 컴포넌트 → Task 1. ✓
- 반응형(모바일 사이드바가 콘텐츠 안 가림) → Task 2 Sidebar의 `flex-col md:flex-row` + `border-b md:border-r`로 모바일에서 상단 가로 바 전환. ✓
- metadata 타이틀 변경 → Task 2. ✓
- 빌드/lint 통과 → 각 태스크 검증 단계. ✓

**2. Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함. ✓

**3. Type consistency:** `Sidebar` (named export) — Task 2에서 정의하고 같은 Task에서 `@/components/Sidebar`로 import. `MENU` href(`/`, `/watermark`)가 Task 1·Task 3의 실제 라우트와 일치. ✓
