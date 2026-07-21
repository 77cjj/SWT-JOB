#!/usr/bin/env bash
# 供 cron 调用的后端自动更新脚本：
# - 每分钟 git fetch，仅在远程有 SWT-JOB-Backend 变更时 pull + 编译 + 重启
# - 若仅有前端变更，只 git pull，不重启后端
# - 使用 flock 避免并发执行
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_SH="$ROOT/server.sh"
STATE_DIR="$ROOT/.server"
LOCK_FILE="$STATE_DIR/auto-pull.lock"
LOG_FILE="$STATE_DIR/logs/auto-pull.log"

mkdir -p "$STATE_DIR/logs"

exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  exit 0
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >>"$LOG_FILE"
}

if [[ ! -x "$SERVER_SH" ]]; then
  log "ERROR: 未找到可执行的 server.sh: $SERVER_SH"
  exit 1
fi

if ! git -C "$ROOT" rev-parse HEAD >/dev/null 2>&1; then
  log "ERROR: $ROOT 不是 Git 仓库，无法自动拉取"
  exit 1
fi

if ! git -C "$ROOT" fetch origin --quiet 2>>"$LOG_FILE"; then
  log "ERROR: git fetch 失败，请检查网络或 GitHub 凭据"
  exit 1
fi

upstream="$(git -C "$ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "origin/master")"
behind="$(git -C "$ROOT" rev-list --count "HEAD..${upstream}" 2>/dev/null || echo 0)"

if [[ "$behind" -eq 0 ]]; then
  exit 0
fi

backend_changes="$(git -C "$ROOT" diff --name-only "HEAD..${upstream}" -- SWT-JOB-Backend/ 2>/dev/null || true)"

if [[ -n "$backend_changes" ]]; then
  log "INFO: 检测到 ${behind} 个新提交且包含后端变更，开始 pull + 编译 + 重启"
  if ! "$SERVER_SH" restart backend --pull --skip-update-check --force >>"$LOG_FILE" 2>&1; then
    log "ERROR: 后端自动更新失败，详见 $LOG_FILE"
    exit 1
  fi
  log "OK: 后端已更新并重启"
  exit 0
fi

log "INFO: 检测到 ${behind} 个新提交（仅非后端文件），执行 git reset 同步"
if ! git -C "$ROOT" reset --hard "${upstream}" >>"$LOG_FILE" 2>&1; then
  log "ERROR: git reset --hard 失败"
  exit 1
fi
log "OK: 代码已同步，跳过后端重启"
