#!/usr/bin/env bash
# 前端编译门禁：改完前端后、推送/开 PR 前执行，避免 Vercel type error。
# 用法：
#   ./scripts/check-frontend.sh
#   npm --prefix SWT-JOB-Frontend run check
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/SWT-JOB-Frontend"

if [[ ! -d "$FRONTEND" ]]; then
  echo "找不到前端目录: $FRONTEND" >&2
  exit 1
fi

cd "$FRONTEND"

if [[ ! -d node_modules ]]; then
  echo "==> npm install"
  npm install --no-audit --no-fund
fi

# 与 Vercel 一致：生产构建 + TypeScript 校验
# @ 别名只指向 ragent/，src 下类型请用相对路径（不要写 @/types/*）
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_RAGENT_API_BASE_URL="${NEXT_PUBLIC_RAGENT_API_BASE_URL:-https://example.com/api/ragent}"
export NEXT_PUBLIC_SANITY_PROJECT_ID="${NEXT_PUBLIC_SANITY_PROJECT_ID:-placeholder}"
export NEXT_PUBLIC_SANITY_DATASET="${NEXT_PUBLIC_SANITY_DATASET:-production}"

echo "==> npm run build (typecheck included)"
npm run build

echo ""
echo "✓ 前端编译通过（与 Vercel Failed to compile 同类错误应已拦住）"
