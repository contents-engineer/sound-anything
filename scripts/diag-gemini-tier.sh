#!/usr/bin/env bash
# 무료 티어 vs 유료 티어 진단: 앱과 동일한 형태의 단일곡 요청 1건을 상류 API에 직접 보내고
# 소요시간 · serviceTier · finishReason · 토큰수 · 429 상세를 출력한다.
# 사용법: ./scripts/diag-gemini-tier.sh <API_KEY> [MODEL]
set -u
KEY="${1:?API 키를 인자로 넘겨주세요}"
MODEL="${2:-gemini-3.8-flash}"
OUT=$(mktemp)

BODY=$(cat <<'JSON'
{
  "contents": [{"role":"user","parts":[{"text":"장르: 시티팝 / 무드: 몽환적 / 언어: 한국어 / 주제: 첫사랑 / 길이: 3분. 이 조건으로 Suno 스타일 프롬프트 1개와 곡 1개(제목·콘셉트·stylePrompt·가사)를 JSON으로 만들어라."}]}],
  "generationConfig": {
    "responseMimeType": "application/json",
    "maxOutputTokens": 8192,
    "thinkingConfig": {"thinkingLevel": "LOW"}
  }
}
JSON
)

echo "model=$MODEL"
START=$(date +%s.%N)
CODE=$(curl -s -m 300 -o "$OUT" -w '%{http_code}' \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent?key=$KEY" \
  -H 'Content-Type: application/json' -d "$BODY")
END=$(date +%s.%N)

printf 'http=%s elapsed=%.1fs\n' "$CODE" "$(echo "$END - $START" | bc)"
if [ "$CODE" = "200" ]; then
  grep -o '"serviceTier": *"[^"]*"' "$OUT"
  grep -o '"finishReason": *"[^"]*"' "$OUT"
  grep -o '"candidatesTokenCount": *[0-9]*\|"thoughtsTokenCount": *[0-9]*\|"totalTokenCount": *[0-9]*' "$OUT"
else
  echo "--- error body ---"
  cat "$OUT"
fi
rm -f "$OUT"
