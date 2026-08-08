#!/usr/bin/env bash
# 启用仓库内 .githooks（不依赖 husky / npm）
# 用法：./scripts/setup-hooks.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .githooks ]]; then
  echo "找不到 .githooks/" >&2
  exit 1
fi

chmod +x .githooks/pre-commit .githooks/pre-push 2>/dev/null || true
git config core.hooksPath .githooks

echo "已设置 core.hooksPath=.githooks"
echo ""
echo "生效内容："
echo "  pre-commit  — 密钥扫描 + 前端 eslint（仅暂存文件）"
echo "  pre-push    — 前端有改动则 npm run build；后端有改动则 mvn compile"
echo ""
echo "临时跳过：SKIP_HOOKS=1 git commit|push ..."
echo "仅跳过前端构建：SKIP_FRONTEND_CHECK=1 git push ..."
