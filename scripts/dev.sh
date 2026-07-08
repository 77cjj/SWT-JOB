#!/usr/bin/env bash
# SWT-JOB 本地开发一键启动脚本
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/SWT-JOB-Frontend"
BACKEND="$ROOT/SWT-JOB-Backend"
COMPOSE_FILE="$ROOT/scripts/docker-compose.dev.yaml"
STATE_DIR="$ROOT/.dev"
PID_DIR="$STATE_DIR/pids"
LOG_DIR="$STATE_DIR/logs"

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-9090}"
INCLUDE_DASHBOARD="${INCLUDE_DASHBOARD:-false}"

# 后端运行必须依赖的中间件（默认不包含 dashboard，避免拉镜像卡住）
INFRA_SERVICES=(postgres redis rmqnamesrv rmqbroker rustfs)
INFRA_CONTAINERS=(swt-dev-pg swt-dev-redis swt-dev-rmqnamesrv swt-dev-rmqbroker swt-dev-rustfs)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[dev]${NC} $*"; }
ok()    { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
fail()  { echo -e "${RED}[dev]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
SWT-JOB 本地开发启动脚本

用法:
  ./dev.sh [命令] [选项]

命令:
  all         启动基础设施 + 后端 + 前端（默认）
  frontend    仅启动 Next.js 前端（最快，适合 UI 开发）
  backend     启动基础设施 + Spring Boot 后端
  infra       仅启动 Docker 基础设施
  stop        停止前端/后端进程
  status      查看各服务状态
  logs        查看日志（frontend | backend）

选项:
  --install   启动前自动 npm install（前端）
  --infra     stop 时同时停止 Docker 容器

示例:
  ./dev.sh                  # 全栈启动
  ./dev.sh frontend         # 只开前端
  ./dev.sh stop             # 停应用进程
  ./dev.sh stop --infra     # 停应用 + Docker

访问地址:
  前端      http://127.0.0.1:3000
  后端 API  http://127.0.0.1:9090/api/ragent
  AI 聊天   http://127.0.0.1:3000/chat
  管理后台  http://127.0.0.1:3000/admin

前置条件:
  - Docker Desktop 已启动（全栈 / 后端模式）
  - Node.js 18+（前端）
  - Java 17（后端，脚本会自动选用，勿用 Java 25）
  - AI 功能需在项目根 .env 或环境变量中配置 BAILIAN_API_KEY
EOF
}

ensure_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
}

port_open() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  fi
}

wait_for_port() {
  local port="$1" label="$2" timeout="${3:-90}"
  info "等待 ${label} (127.0.0.1:${port})..."
  local i=0
  while ! port_open "$port"; do
    sleep 1
    i=$((i + 1))
    if [[ $i -ge $timeout ]]; then
      fail "${label} 在 ${timeout}s 内未就绪，请查看 ${LOG_DIR}"
    fi
  done
  ok "${label} 已就绪"
}

pid_on_port() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -1
}

resolve_java17() {
  if [[ -n "${JAVA_HOME:-}" ]] && "$JAVA_HOME/bin/java" -version 2>&1 | grep -q 'version "17'; then
    return 0
  fi
  if /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
    return 0
  fi
  if [[ -d "/Users/mac/Library/Java/JavaVirtualMachines/ms-17.0.18/Contents/Home" ]]; then
    export JAVA_HOME="/Users/mac/Library/Java/JavaVirtualMachines/ms-17.0.18/Contents/Home"
    return 0
  fi
  fail "未找到 Java 17。后端需要 Java 17，请安装后重试（当前默认 Java 25 会导致编译失败）。"
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    fail "未找到 docker 命令，请先安装 Docker Desktop。"
  fi
  if ! docker info >/dev/null 2>&1; then
    fail "Docker 未运行，请先打开 Docker Desktop。"
  fi
}

container_running() {
  local name="$1"
  docker ps --format '{{.Names}}' | grep -Fxq "$name"
}

container_exists() {
  local name="$1"
  docker ps -a --format '{{.Names}}' | grep -Fxq "$name"
}

compose_pull_never_supported() {
  docker compose up --help 2>/dev/null | grep -q -- '--pull'
}

start_infra() {
  ensure_docker
  info "启动 Docker 基础设施（优先复用已有容器，不自动拉镜像）..."

  local missing_services=()
  local idx
  for idx in "${!INFRA_SERVICES[@]}"; do
    local service="${INFRA_SERVICES[$idx]}"
    local container="${INFRA_CONTAINERS[$idx]}"

    if container_running "$container"; then
      continue
    fi

    if container_exists "$container"; then
      info "启动已有容器: ${container}"
      docker start "$container" >/dev/null
    else
      missing_services+=("$service")
    fi
  done

  if [[ "$INCLUDE_DASHBOARD" == "true" ]]; then
    missing_services+=(rmqdashboard)
  fi

  if [[ ${#missing_services[@]} -gt 0 ]]; then
    info "创建缺失服务: ${missing_services[*]}"
    local compose_cmd=(docker compose -f "$COMPOSE_FILE" up -d --no-build)
    if compose_pull_never_supported; then
      compose_cmd+=(--pull never)
    fi
    if ! "${compose_cmd[@]}" "${missing_services[@]}"; then
      fail "存在缺失服务且本地镜像不可用。请先手动拉镜像后重试。"
    fi
  fi

  wait_for_port 5432 "PostgreSQL" 60
  wait_for_port 6379 "Redis" 30
  wait_for_port 9876 "RocketMQ NameServer" 120
  ok "基础设施已启动"
}

load_env() {
  if [[ -f "$ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/.env"
    set +a
  fi
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

start_backend() {
  resolve_java17
  load_env

  local pid_file="$PID_DIR/backend.pid"
  local log_file="$LOG_DIR/backend.log"

  if is_running "$pid_file"; then
    warn "后端已在运行 (PID $(cat "$pid_file"))"
    return 0
  fi

  if port_open "$BACKEND_PORT"; then
    warn "端口 ${BACKEND_PORT} 已被占用，跳过后端启动"
    return 0
  fi

  info "启动 Spring Boot 后端（Java 17）..."
  info "日志: ${log_file}"

  (
    cd "$BACKEND/bootstrap"
    nohup ../mvnw -q spring-boot:run -DskipTests >>"$log_file" 2>&1 &
  )

  wait_for_port "$BACKEND_PORT" "后端 API" 180
  local listener_pid
  listener_pid="$(pid_on_port "$BACKEND_PORT")"
  [[ -n "$listener_pid" ]] && echo "$listener_pid" >"$pid_file"
}

start_frontend() {
  local do_install="${1:-false}"
  local pid_file="$PID_DIR/frontend.pid"
  local log_file="$LOG_DIR/frontend.log"

  if ! command -v npm >/dev/null 2>&1; then
    fail "未找到 npm，请先安装 Node.js 18+。"
  fi

  if [[ "$do_install" == "true" ]] || [[ ! -d "$FRONTEND/node_modules" ]]; then
    info "安装前端依赖..."
    (cd "$FRONTEND" && npm install)
  fi

  if is_running "$pid_file"; then
    warn "前端已在运行 (PID $(cat "$pid_file"))"
    return 0
  fi

  if port_open "$FRONTEND_PORT"; then
    warn "端口 ${FRONTEND_PORT} 已被占用，跳过前端启动"
    return 0
  fi

  info "启动 Next.js 前端..."
  info "日志: ${log_file}"

  (
    cd "$FRONTEND"
    nohup npm run dev >>"$log_file" 2>&1 &
  )

  wait_for_port "$FRONTEND_PORT" "前端" 90
  local listener_pid
  listener_pid="$(pid_on_port "$FRONTEND_PORT")"
  [[ -n "$listener_pid" ]] && echo "$listener_pid" >"$pid_file"
}

stop_process() {
  local name="$1" pid_file="$2" port="${3:-}"
  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    info "停止 ${name} (PID ${pid})..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    ok "${name} 已停止"
  elif [[ -n "$port" ]] && port_open "$port"; then
    local pid
    pid="$(pid_on_port "$port")"
    if [[ -n "$pid" ]]; then
      info "停止 ${name} (端口 ${port}, PID ${pid})..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      ok "${name} 已停止"
    fi
  fi
}

stop_all() {
  local stop_infra=false
  for arg in "$@"; do
    [[ "$arg" == "--infra" ]] && stop_infra=true
  done

  stop_process "前端" "$PID_DIR/frontend.pid" "$FRONTEND_PORT"
  stop_process "后端" "$PID_DIR/backend.pid" "$BACKEND_PORT"

  # 兼容旧版手动启动的进程
  pkill -f "NEXT_DIST_DIR=.next-dev next dev" 2>/dev/null || true
  pkill -f "spring-boot:run" 2>/dev/null || true

  if [[ "$stop_infra" == "true" ]]; then
    ensure_docker
    info "停止 Docker 基础设施..."
    docker compose -f "$COMPOSE_FILE" down
    ok "Docker 基础设施已停止"
  fi
}

show_status() {
  echo ""
  echo "=== SWT-JOB 开发环境状态 ==="
  echo ""

  local svc
  for svc in "5432:PostgreSQL" "6379:Redis" "9876:RocketMQ" "9000:RustFS" "${BACKEND_PORT}:后端" "${FRONTEND_PORT}:前端"; do
    local port="${svc%%:*}"
    local label="${svc#*:}"
    if port_open "$port"; then
      echo -e "  ${GREEN}●${NC} ${label}  :${port}"
    else
      echo -e "  ${RED}○${NC} ${label}  :${port}"
    fi
  done

  echo ""
  if is_running "$PID_DIR/frontend.pid"; then
    echo "  前端 PID: $(cat "$PID_DIR/frontend.pid")"
  fi
  if is_running "$PID_DIR/backend.pid"; then
    echo "  后端 PID: $(cat "$PID_DIR/backend.pid")"
  fi
  echo ""
  echo "  日志目录: ${LOG_DIR}"
  echo "  前端地址: http://127.0.0.1:${FRONTEND_PORT}"
  echo "  后端地址: http://127.0.0.1:${BACKEND_PORT}/api/ragent"
  echo ""
}

show_logs() {
  local target="${1:-}"
  case "$target" in
    frontend|fe) tail -f "$LOG_DIR/frontend.log" ;;
    backend|be)  tail -f "$LOG_DIR/backend.log" ;;
    *)
      fail "请指定: ./dev.sh logs frontend|backend"
      ;;
  esac
}

print_ready() {
  echo ""
  ok "开发环境已就绪"
  echo ""
  echo "  前端:     http://127.0.0.1:${FRONTEND_PORT}"
  echo "  选岗:     http://127.0.0.1:${FRONTEND_PORT}/compare"
  echo "  岗位情报: http://127.0.0.1:${FRONTEND_PORT}/jobs"
  echo "  AI 聊天:  http://127.0.0.1:${FRONTEND_PORT}/chat"
  echo ""
  echo "  停止: ./dev.sh stop"
  echo "  状态: ./dev.sh status"
  echo "  日志: ./dev.sh logs frontend|backend"
  echo ""
}

main() {
  local cmd="${1:-all}"
  shift || true

  local do_install=false
  local extra_args=()
  for arg in "$@"; do
    case "$arg" in
      --install) do_install=true ;;
      --infra)   extra_args+=("$arg") ;;
      -h|--help) usage; exit 0 ;;
      *)         extra_args+=("$arg") ;;
    esac
  done

  ensure_dirs

  case "$cmd" in
    all|start)
      start_infra
      start_backend
      start_frontend "$do_install"
      print_ready
      ;;
    frontend|fe)
      start_frontend "$do_install"
      print_ready
      ;;
    backend|be)
      start_infra
      start_backend
      print_ready
      ;;
    infra|docker)
      start_infra
      show_status
      ;;
    stop)
      stop_all "${extra_args[@]}"
      ;;
    status|ps)
      show_status
      ;;
    logs)
      show_logs "${extra_args[0]:-}"
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      fail "未知命令: ${cmd}。运行 ./dev.sh help 查看帮助。"
      ;;
  esac
}

main "$@"
