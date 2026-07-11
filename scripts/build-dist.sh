#!/usr/bin/env bash
# 모든 앱을 정적 빌드해 단일 GitHub Pages 아티팩트(dist/)로 조립한다.
# - apps/portal → dist/            (사이트 루트)
# - apps/<기타> → dist/<이름>/     (라이브러리 데모 서브패스)
# 새 라이브러리를 추가해도 이 스크립트와 워크플로우는 수정할 필요가 없다.
set -euo pipefail

BASE_PATH="${BASE_PATH:-/leader_ai_training/}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

for dir in "$ROOT"/apps/*/; do
  name=$(basename "$dir")
  if [ "$name" = "portal" ]; then
    base="$BASE_PATH"
    out="$DIST"
  else
    base="${BASE_PATH}${name}/"
    out="$DIST/$name"
  fi

  echo "── Building $name (base: $base)"
  NUXT_APP_BASE_URL="$base" npm run generate --workspace "apps/$name"
  mkdir -p "$out"
  cp -R "$dir.output/public/." "$out/"
done

# 언더스코어 프리픽스 디렉터리(_nuxt)가 Jekyll에 의해 무시되지 않도록
touch "$DIST/.nojekyll"

echo "── dist assembled at $DIST"
