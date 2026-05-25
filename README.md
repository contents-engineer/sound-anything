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
| `gemini`  | `GOOGLE_API_KEY`, optional `GEMINI_MODEL`      |

The API key never leaves the server — all LLM calls go through `/api/generate`.

## What this app generates

- A single composite music-generation prompt.
- 10 song concepts (each: short original title + 2–3 sentence description of mood, imagery, and hook idea). The concepts are creative metadata, not lyric text.

## Design / Plan

See `docs/superpowers/specs/` and `docs/superpowers/plans/`.
