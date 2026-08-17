#!/usr/bin/env bash
# 本机 Cursor / AI Agent 通过阿里云 Workbench CLI 操作 SWT-JOB 所在 ECS。
# 交互式 `workbench connect` 会卡住 Agent；一律用 exec / upload / download。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SWT_ECS_ENV_FILE:-$ROOT/.env.ecs}"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local val="${BASH_REMATCH[2]}"
      val="${val%\"}"
      val="${val#\"}"
      val="${val%\'}"
      val="${val#\'}"
      if [[ -z "${!key:-}" ]]; then
        export "$key=$val"
      fi
    fi
  done <"$file"
}

load_env_file "$ENV_FILE"

INSTANCE_ID="${SWT_ECS_INSTANCE_ID:-}"
REGION="${SWT_ECS_REGION:-cn-hangzhou}"
DEPLOY_PATH="${SWT_ECS_DEPLOY_PATH:-/root/swt-job}"
USER_NAME="${SWT_ECS_USER:-root}"
PROFILE="${SWT_ECS_PROFILE:-}"
WB="${WORKBENCH_BIN:-workbench}"
YES=false
TIMEOUT=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[ecs]${NC} $*"; }
ok() { echo -e "${GREEN}[ecs]${NC} $*"; }
warn() { echo -e "${YELLOW}[ecs]${NC} $*" >&2; }
fail() { echo -e "${RED}[ecs]${NC} $*" >&2; exit 1; }

usage() {
  cat <<EOF
本机通过 Workbench CLI 操作阿里云 ECS 上的 SWT-JOB（无需公网 SSH）。

用法:
  ./scripts/ecs.sh doctor
  ./scripts/ecs.sh status
  ./scripts/ecs.sh health
  ./scripts/ecs.sh logs [行数]
  ./scripts/ecs.sh exec '<远程命令>'
  ./scripts/ecs.sh upload <本地路径> <远程路径>
  ./scripts/ecs.sh download <远程路径> <本地路径>
  ./scripts/ecs.sh pull-restart [--yes]
  ./scripts/ecs.sh restart [--yes]
  ./scripts/ecs.sh connect          # 仅人类交互式登录，Agent 不要调用

环境（仓库根 .env.ecs 或导出变量，后者优先）:
  SWT_ECS_INSTANCE_ID     必填，例如 i-bp1xxxxxxxx
  SWT_ECS_REGION          默认 cn-hangzhou（i-bp 前缀通常可自动推断）
  SWT_ECS_DEPLOY_PATH     默认 /root/swt-job
  SWT_ECS_USER            默认 root
  SWT_ECS_PROFILE         可选，对应 workbench --profile
  WORKBENCH_BIN           可选，workbench 可执行文件路径

全局选项:
  --yes                   允许重启 / pull-restart
  --timeout <秒>          覆盖默认超时（exec 默认 120；pull-restart 默认 900）
  --instance-id <id>      覆盖 SWT_ECS_INSTANCE_ID
  --region <region>       覆盖地域
  --deploy-path <path>    覆盖远端仓库路径

凭证在本机 ~/.workbench/config.json，不要写入本仓库。
EOF
}

wb_args() {
  local args=()
  [[ -n "$PROFILE" ]] && args+=(--profile "$PROFILE")
  [[ -n "$REGION" ]] && args+=(-r "$REGION")
  printf '%s\n' "${args[@]}"
}

require_instance() {
  [[ -n "$INSTANCE_ID" ]] || fail "未设置 SWT_ECS_INSTANCE_ID。复制 .env.ecs.example 为 .env.ecs 并填实例 ID。"
}

require_workbench() {
  command -v "$WB" >/dev/null 2>&1 || fail "未找到 Workbench CLI（$WB）。安装: curl -fsSL https://workbench-cli.oss-cn-hangzhou.aliyuncs.com/install.sh | bash"
}

is_dangerous_command() {
  local cmd="$1"
  [[ "$cmd" =~ (rm[[:space:]]+-rf[[:space:]]+/|mkfs|shutdown|reboot|dd[[:space:]]+if=|drop[[:space:]]+database|mkswap) ]]
}

exec_remote() {
  local cmd="$1"
  local timeout="${TIMEOUT:-${2:-120}}"
  require_workbench
  require_instance
  if is_dangerous_command "$cmd" && [[ "$YES" != true ]]; then
    fail "命令看起来有破坏性，拒绝执行。确认后加 --yes。"
  fi
  local extra=()
  while IFS= read -r a; do
    [[ -n "$a" ]] && extra+=("$a")
  done < <(wb_args)
  # workbench exec 透传远程退出码；不要让 set -e 在拿到 JSON 前把脚本打断。
  set +e
  EXEC_JSON="$("$WB" exec -i "$INSTANCE_ID" -c "$cmd" --timeout "$timeout" --output json "${extra[@]}")"
  EXEC_RC=$?
  set -e
}

print_exec_json() {
  local json="${1:-}"
  local fallback_rc="${2:-0}"
  if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import json, sys
raw = sys.stdin.read()
fallback = int(sys.argv[1])
if not raw.strip():
    sys.exit(fallback)
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    sys.stdout.write(raw)
    sys.exit(fallback)
if isinstance(data, dict) and "output" in data:
    sys.stdout.write(data.get("output") or "")
    err = data.get("stderr") or ""
    if err:
        sys.stderr.write(err if err.endswith("\n") else err + "\n")
    code = data.get("exit_code", fallback)
    sys.exit(int(code) if code is not None else fallback)
if isinstance(data, dict) and "message" in data:
    sys.stderr.write(str(data.get("message")) + "\n")
    sys.exit(int(data.get("code") or fallback or 1))
sys.stdout.write(raw)
sys.exit(fallback)
' "$fallback_rc" <<<"$json"
  else
    printf '%s\n' "$json"
    return "$fallback_rc"
  fi
}

run_and_print() {
  exec_remote "$1" "${2:-120}"
  print_exec_json "${EXEC_JSON:-}" "${EXEC_RC:-0}"
}

cmd_doctor() {
  require_workbench
  info "workbench: $(command -v "$WB")"
  "$WB" version || true
  if [[ -f "$HOME/.workbench/config.json" ]]; then
    ok "凭证文件存在: ~/.workbench/config.json"
    local mode
    mode="$(python3 -c 'import json,os,sys
p=os.path.expanduser("~/.workbench/config.json")
d=json.load(open(p))
cur=d.get("current","default")
prof=(d.get("profiles") or {}).get(cur) or d
print(prof.get("mode","unknown"))
' 2>/dev/null || echo unknown)"
    info "当前凭证模式: $mode（不会打印密钥）"
  else
    warn "未找到 ~/.workbench/config.json，请在本机执行: workbench config"
  fi
  if [[ -n "$INSTANCE_ID" ]]; then
    info "实例 ID: $INSTANCE_ID"
    info "地域: $REGION  远端路径: $DEPLOY_PATH  用户: $USER_NAME"
  else
    warn "尚未配置 SWT_ECS_INSTANCE_ID"
  fi
  if [[ -n "$INSTANCE_ID" && -f "$HOME/.workbench/config.json" ]]; then
    info "探测实例（list ecs）…"
    local extra=()
    while IFS= read -r a; do
      [[ -n "$a" ]] && extra+=("$a")
    done < <(wb_args)
    "$WB" list ecs --output json "${extra[@]}" || warn "list ecs 失败：检查 RAM 权限与地域"
  fi
}

cmd_status() {
  run_and_print "cd '$DEPLOY_PATH' && ./server.sh status" 120
}

cmd_health() {
  run_and_print "curl -s -o /dev/null -w 'demo=%{http_code}\\n' http://127.0.0.1:9090/api/ragent/rag/demo-conversations; curl -s -o /dev/null -w 'google=%{http_code}\\n' -X POST http://127.0.0.1:9090/api/ragent/auth/google -H 'Content-Type: application/json' -d '{}'" 60
}

cmd_logs() {
  local lines="${1:-80}"
  [[ "$lines" =~ ^[0-9]+$ ]] || fail "行数必须是正整数"
  run_and_print "tail -n $lines '$DEPLOY_PATH/.server/logs/backend.log'" 60
}

cmd_exec() {
  local remote_cmd="${1:-}"
  [[ -n "$remote_cmd" ]] || fail "缺少远程命令。用法: ./scripts/ecs.sh exec 'df -h'"
  run_and_print "$remote_cmd" "${TIMEOUT:-120}"
}

cmd_upload() {
  local src="${1:-}"
  local dest="${2:-}"
  [[ -n "$src" && -n "$dest" ]] || fail "用法: ./scripts/ecs.sh upload <本地> <远程>"
  require_workbench
  require_instance
  local extra=()
  while IFS= read -r a; do
    [[ -n "$a" ]] && extra+=("$a")
  done < <(wb_args)
  "$WB" upload "$src" "$dest" -i "$INSTANCE_ID" "${extra[@]}"
}

cmd_download() {
  local src="${1:-}"
  local dest="${2:-}"
  [[ -n "$src" && -n "$dest" ]] || fail "用法: ./scripts/ecs.sh download <远程> <本地>"
  require_workbench
  require_instance
  local extra=()
  while IFS= read -r a; do
    [[ -n "$a" ]] && extra+=("$a")
  done < <(wb_args)
  "$WB" download "$src" "$dest" -i "$INSTANCE_ID" "${extra[@]}"
}

cmd_pull_restart() {
  [[ "$YES" == true ]] || fail "pull-restart 会在 ECS 上 git pull + 编译重启。确认后加 --yes。"
  run_and_print "cd '$DEPLOY_PATH' && ./server.sh restart backend --pull --build --skip-update-check --force" "${TIMEOUT:-900}"
}

cmd_restart() {
  [[ "$YES" == true ]] || fail "restart 会强杀后端进程。确认后加 --yes。"
  run_and_print "cd '$DEPLOY_PATH' && ./server.sh restart backend --force" "${TIMEOUT:-180}"
}

cmd_connect() {
  require_workbench
  require_instance
  warn "connect 是交互式 PTY，Agent 不要调用。人类用户按 Ctrl+D 退出。"
  local extra=()
  while IFS= read -r a; do
    [[ -n "$a" ]] && extra+=("$a")
  done < <(wb_args)
  exec "$WB" connect -i "$INSTANCE_ID" -u "$USER_NAME" "${extra[@]}"
}

COMMAND=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --yes) YES=true; shift ;;
    --timeout) TIMEOUT="${2:-}"; shift 2 ;;
    --instance-id) INSTANCE_ID="${2:-}"; shift 2 ;;
    --region) REGION="${2:-}"; shift 2 ;;
    --deploy-path) DEPLOY_PATH="${2:-}"; shift 2 ;;
    doctor|status|health|logs|exec|upload|download|pull-restart|restart|connect)
      if [[ -z "$COMMAND" ]]; then
        COMMAND="$1"
        shift
      else
        POSITIONAL+=("$1")
        shift
      fi
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

[[ -n "$COMMAND" ]] || { usage; exit 1; }

case "$COMMAND" in
  doctor) cmd_doctor ;;
  status) cmd_status ;;
  health) cmd_health ;;
  logs) cmd_logs "${POSITIONAL[0]:-80}" ;;
  exec) cmd_exec "${POSITIONAL[*]}" ;;
  upload) cmd_upload "${POSITIONAL[0]:-}" "${POSITIONAL[1]:-}" ;;
  download) cmd_download "${POSITIONAL[0]:-}" "${POSITIONAL[1]:-}" ;;
  pull-restart) cmd_pull_restart ;;
  restart) cmd_restart ;;
  connect) cmd_connect ;;
  *) usage; exit 1 ;;
esac
