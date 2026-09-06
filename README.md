# Sound Anything — Playlist Music Creator Clone

A Next.js 15 clone of TubeMaster's "플레이리스트 음악 만들기" page. Pick from 10 categories of musical attributes and an LLM generates a composite music-generation prompt plus 10 original song concepts (title + brief mood/imagery summary). Outputs are designed to be pasted into AI music services like Suno or Udio.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local — pick a provider and add its key, or leave AI_PROVIDER=mock
npm run dev
```

Open http://localhost:3000.

## Providers

Set `AI_PROVIDER` in `.env.local` to one of:

| Provider  | Env var(s)                                     |
| --------- | ---------------------------------------------- |
| `mock`    | none — deterministic dummy data, useful for UI work |
| `openai`  | `OPENAI_API_KEY`, optional `OPENAI_MODEL`      |
| `anthropic` | `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL` |
| `gemini`  | 브라우저에서 키 등록 (env 불필요), optional `GEMINI_MODEL` |

`gemini`는 서버에 API 키를 두지 않습니다. 화면 우측 상단의 "Gemini API 키 등록" 버튼으로 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급한 키를 입력하면 브라우저 `localStorage`에만 저장되고, 생성 요청마다 서버로 전달되어 해당 요청 처리에만 사용됩니다(서버 저장/로깅 없음). 무료 티어 키(결제 미연결 프로젝트)도 동작하며, 분당 한도 초과(429) 시 서버가 자동으로 잠시 대기 후 재시도하고 일일 한도 소진 시 에러 메시지로 안내합니다.

## What this app generates

- A single composite music-generation prompt.
- 10 song concepts (each: short original title + 2–3 sentence description of mood, imagery, and hook idea). The concepts are creative metadata, not lyric text.

## Design / Plan

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.
