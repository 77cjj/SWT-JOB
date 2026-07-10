#!/usr/bin/env bash
# SWT-JOB 服务器一键启停脚本（Podman/Docker 基础设施 + 后端 + Nginx）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/SWT-JOB-Backend"
STATE_DIR="$ROOT/.server"
PID_DIR="$STATE_DIR/pids"
LOG_DIR="$STATE_DIR/logs"

BACKEND_PORT="${BACKEND_PORT:-9090}"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
SERVER_CONFIG="${SERVER_CONFIG:-$BACKEND/bootstrap/config/application.yaml}"
LEGACY_SERVER_CONFIG="$BACKEND/bootstrap/config/application-server.yaml"
LAST_BUILD_SHA="$STATE_DIR/last-build.sha"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/swt-job.conf}"
USE_SUDO="${USE_SUDO:-auto}"
CONTAINER_RT="${CONTAINER_RT:-}"
JAVA_MEM_OPTS="${JAVA_MEM_OPTS:--Xms256m -Xmx512m}"
LOW_MEM_MODE="${LOW_MEM_MODE:-auto}"
SKIP_ROCKETMQ="${SKIP_ROCKETMQ:-auto}"
SKIP_UPDATE_CHECK=false
AUTO_PULL_BUILD=false
FORCE_BACKEND=false

INFRA_SERVICES=(postgres redis rmqnamesrv rmqbroker rustfs)
declare -A INFRA_PORTS=(
  [postgres]=5432
  [redis]=6379
  [rmqnamesrv]=9876
  [rmqbroker]=10911
  [rustfs]=9000
)
declare -A INFRA_CONTAINERS=(
  [postgres]=ragent-postgres
  [redis]=ragent-redis
  [rmqnamesrv]=rmqnamesrv
  [rmqbroker]=rmqbroker
  [rustfs]=ragent-rustfs
)

CT_CMD=""
CT_RT_LABEL=""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[server]${NC} $*"; }
ok()    { echo -e "${GREEN}[server]${NC} $*"; }
warn()  { echo -e "${YELLOW}[server]${NC} $*" >&2; }
fail()  { echo -e "${RED}[server]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
SWT-JOB 服务器一键启停脚本

用法:
  ./server.sh [命令] [选项]

命令:
  all         启动基础设施 + 后端 + Nginx 重载（默认）
  fix         一键修复：写配置、缩容器、停 MQ、重启后端并健康检查
  light       2G 小内存模式：限制容器内存 + 停 RocketMQ + 给后端腾空间
  swap        创建并启用 2G swap（小内存机器强烈建议）
  infra       仅启动缺失的基础设施（Podman/Docker）
  rustfs      仅启动 RustFS（创建知识库必需）
  broker      强制重建 RocketMQ Broker（2G 机器稳定配置）
  backend     检查基础设施 + 启动 Spring Boot 后端
  nginx       Nginx 子命令：start | reload | stop | install-conf
  build       编译后端 jar 包
  stop        停止后端（默认保留 Docker / Nginx）
  restart     重启后端，或 restart all 重启全部
  status      查看容器 / 后端 / Nginx 状态
  doctor      诊断 502 / 启动卡住原因
  logs        查看日志（backend | nginx | rustfs | postgres | redis）

说明:
  基础设施使用 podman run 直接启动，不依赖 compose / yaml 文件。
  端口已占用时自动跳过（兼容已有的 ragent-postgres 等容器）。
  生产默认关闭 MCP + MQ 消费者，避免 Broker 不稳时后端卡死导致 Nginx 502。

选项:
  --infra     stop / restart 时包含 Docker 容器
  --nginx     stop / restart 时包含 Nginx（stop 会停整个 Nginx 服务）
  --build     backend / all / restart 前先编译 jar
  --pull      检测到更新时自动拉取并重新编译（非交互）
  --skip-update-check  跳过后端更新检测，直接启动
  --force     backend / fix 时强制杀掉旧进程再启

环境变量（可写入项目根 .env）:
  BAILIAN_API_KEY      AI 功能必填
  SERVER_ENV_FILE      环境变量文件路径（默认 <项目根>/.env）
  SERVER_CONFIG        服务器 Spring 覆盖配置（默认 bootstrap/config/application.yaml）
  NGINX_CONF           Nginx 站点配置路径
  BACKEND_PORT         后端端口（默认 9090）
  JAVA_MEM_OPTS        JVM 内存（2G 机器自动降为 -Xms128m -Xmx384m）
  LOW_MEM_MODE         auto|true|false  小内存优化（默认 auto：<3GB 自动开启）
  SKIP_ROCKETMQ        auto|true|false  是否跳过 RocketMQ（默认 auto：小内存时停掉）
  USE_SUDO=yes|no|auto 操作 Nginx 时是否 sudo（默认 auto）
  CONTAINER_RT=podman|docker  强制指定容器运行时（默认自动检测）

智能行为:
  - 每次启动强制写入 bootstrap/config/application.yaml（关 MCP + 关 MQ 消费者）
  - 端口占用但健康检查失败时，自动杀掉卡死进程再启
  - 等待「端口 + HTTP 可达」才算启动成功

示例:
  ./server.sh fix                # 推荐：一键修好 502 / OOM
  ./server.sh light              # 2G 机器：缩容器 + 停 MQ + 重启后端
  ./server.sh swap               # 加 2G swap，防 Java 被 OOM kill
  ./server.sh doctor             # 只诊断，不改动
  ./server.sh                    # 检查中间件 + 启动后端 + 重载 Nginx
  ./server.sh broker             # 重建稳定的 RocketMQ Broker
  ./server.sh backend --force    # 强杀后重启后端
  ./server.sh status
  ./server.sh logs backend

首次部署:
  1. cp .env.example .env 并填入 BAILIAN_API_KEY
  2. ./server.sh build
  3. ./server.sh nginx install-conf  # 编辑域名后
  4. ./server.sh fix
EOF
}

ensure_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
}

total_mem_mb() {
  awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 4096
}

detect_low_mem_mode() {
  case "${LOW_MEM_MODE}" in
    true|1|yes) return 0 ;;
    false|0|no) return 1 ;;
  esac
  local total
  total="$(total_mem_mb)"
  [[ "$total" -lt 3072 ]]
}

should_skip_rocketmq() {
  case "${SKIP_ROCKETMQ}" in
    true|1|yes) return 0 ;;
    false|0|no) return 1 ;;
  esac
  detect_low_mem_mode
}

apply_low_mem_defaults() {
  if detect_low_mem_mode; then
    # 用户若在 .env 里自定义了 JAVA_MEM_OPTS，则尊重用户设置
    if [[ "${JAVA_MEM_OPTS}" == "-Xms256m -Xmx512m" ]]; then
      JAVA_MEM_OPTS="-Xms128m -Xmx384m"
    fi
    info "小内存模式: 总内存 $(total_mem_mb)MB，后端 JVM=${JAVA_MEM_OPTS}"
  fi
}

ct_mem_limit_args() {
  local svc="$1"
  detect_low_mem_mode || return 0
  case "$svc" in
    postgres) echo --memory=280m --memory-swap=280m ;;
    redis) echo --memory=96m --memory-swap=96m ;;
    rmqnamesrv) echo --memory=180m --memory-swap=180m ;;
    rmqbroker) echo --memory=200m --memory-swap=200m ;;
    rustfs) echo --memory=128m --memory-swap=128m ;;
  esac
}

infra_services_list() {
  local svc
  for svc in "${INFRA_SERVICES[@]}"; do
    if should_skip_rocketmq && [[ "$svc" == rmqnamesrv || "$svc" == rmqbroker ]]; then
      continue
    fi
    echo "$svc"
  done
}

stop_rocketmq_containers() {
  ensure_container_runtime
  local name
  for name in rmqbroker rmqnamesrv; do
    if ct_exists "$name"; then
      info "停止 ${name}（小内存模式为后端腾内存）..."
      $CT_CMD stop "$name" >/dev/null 2>&1 || true
    fi
  done
}

ensure_swap() {
  if swapon --show 2>/dev/null | grep -q .; then
    ok "Swap 已启用"
    swapon --show 2>/dev/null || true
    return 0
  fi
  if [[ -f /swapfile ]]; then
    maybe_sudo swapon /swapfile && ok "已启用 /swapfile" && return 0
  fi
  detect_low_mem_mode || return 0
  warn "未检测到 swap。2G 机器上 Java 启动高峰容易被 OOM kill。"
  warn "可执行: ./server.sh swap"
  return 1
}

setup_swap() {
  if swapon --show 2>/dev/null | grep -q .; then
    ok "Swap 已存在"
    swapon --show
    return 0
  fi
  if [[ -f /swapfile ]]; then
    maybe_sudo swapon /swapfile
    ok "已启用已有 /swapfile"
    return 0
  fi
  info "创建 2G swap 文件 /swapfile ..."
  maybe_sudo fallocate -l 2G /swapfile || maybe_sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  maybe_sudo chmod 600 /swapfile
  maybe_sudo mkswap /swapfile
  maybe_sudo swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' | maybe_sudo tee -a /etc/fstab >/dev/null || true
  fi
  ok "Swap 已创建并启用"
  free -h
}

maybe_sudo() {
  if [[ "$USE_SUDO" == "no" ]]; then
    "$@"
    return
  fi
  if [[ "$USE_SUDO" == "yes" ]] || { [[ "$USE_SUDO" == "auto" ]] && [[ "$(id -u)" -ne 0 ]]; }; then
    sudo "$@"
    return
  fi
  "$@"
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
    info "已加载环境变量: ${ENV_FILE}"
  else
    warn "未找到环境变量文件 ${ENV_FILE}（请配置 BAILIAN_API_KEY 等）"
  fi
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
  local port="$1" label="$2" timeout="${3:-120}"
  local log_hint="${4:-}"
  local optional="${5:-false}"
  info "等待 ${label} (127.0.0.1:${port})..."
  local i=0
  while ! port_open "$port"; do
    sleep 1
    i=$((i + 1))
    if [[ $i -ge $timeout ]]; then
      if [[ "$optional" == "true" ]]; then
        warn "${label} 在 ${timeout}s 内未就绪（继续启动，但后端可能卡在 MQ）"
        return 1
      fi
      if [[ -n "$log_hint" && -f "$log_hint" ]]; then
        warn "最近日志 (${log_hint}):"
        tail -n 30 "$log_hint" >&2 || true
      fi
      fail "${label} 在 ${timeout}s 内未就绪${log_hint:+，请查看 ${log_hint}}"
    fi
  done
  ok "${label} 已就绪"
}

warn_if_broker_unstable() {
  if ! port_open 10911; then
    warn "RocketMQ Broker 端口 10911 未监听，后端 MQ 消费者可能卡住启动"
    warn "可先执行: podman logs rmqbroker --tail 30"
    warn "或拉取最新 application-server.yaml（已默认禁用 MQ 消费者）"
    return 0
  fi
  if command -v "$CT_CMD" >/dev/null 2>&1 && ct_exists rmqbroker; then
    local status
    status="$($CT_CMD inspect -f '{{.State.Status}}' rmqbroker 2>/dev/null || true)"
    if [[ "$status" != "running" ]]; then
      warn "RocketMQ Broker 容器状态异常: ${status:-unknown}"
    fi
  fi
}

pid_on_port() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -1
}

is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

resolve_java17() {
  if [[ -n "${JAVA_HOME:-}" ]] && "$JAVA_HOME/bin/java" -version 2>&1 | grep -qE 'version "17'; then
    return 0
  fi
  if command -v /usr/libexec/java_home >/dev/null 2>&1 && /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
    export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
    return 0
  fi
  if command -v java >/dev/null 2>&1 && java -version 2>&1 | grep -qE 'version "17'; then
    return 0
  fi
  for dir in /usr/lib/jvm/java-17-* /usr/lib/jvm/ms-17-*; do
    if [[ -x "$dir/bin/java" ]]; then
      export JAVA_HOME="$dir"
      return 0
    fi
  done
  fail "未找到 Java 17，请先安装（后端需要 Java 17）。"
}

resolve_container_runtime() {
  if [[ -n "$CT_CMD" ]]; then
    return 0
  fi

  local rt="${CONTAINER_RT}"
  if [[ -z "$rt" ]]; then
    if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
      rt="podman"
    elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
      rt="docker"
    fi
  fi

  case "$rt" in
    podman|docker)
      CT_CMD="$rt"
      CT_RT_LABEL="$rt"
      ;;
    *)
      fail "未找到 podman。请安装: dnf install -y podman"
      ;;
  esac
}

ensure_container_runtime() {
  resolve_container_runtime
}

ct_exists() {
  local name="$1"
  ensure_container_runtime
  $CT_CMD ps -a --format '{{.Names}}' | grep -Fxq "$name"
}

ct_running() {
  local name="$1"
  ensure_container_runtime
  $CT_CMD ps --format '{{.Names}}' | grep -Fxq "$name"
}

ct_start_postgres() {
  local name="${INFRA_CONTAINERS[postgres]}"
  local schema="$BACKEND/resources/database/schema_pg.sql"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  [[ -f "$schema" ]] || fail "未找到数据库初始化脚本: $schema"
  local -a mem_limit=()
  if detect_low_mem_mode; then
    mem_limit=(--memory=280m --memory-swap=280m)
  fi
  if detect_low_mem_mode; then
    $CT_CMD run -d --name "$name" --restart unless-stopped "${mem_limit[@]}" \
      -p 127.0.0.1:5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=ragent \
      -v ragent-pg-data:/var/lib/postgresql/data \
      -v "$schema:/docker-entrypoint-initdb.d/01-schema.sql:ro" \
      docker.io/pgvector/pgvector:pg16 \
      postgres -c shared_buffers=64MB -c max_connections=40 -c work_mem=4MB
  else
    $CT_CMD run -d --name "$name" --restart unless-stopped "${mem_limit[@]}" \
      -p 127.0.0.1:5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=ragent \
      -v ragent-pg-data:/var/lib/postgresql/data \
      -v "$schema:/docker-entrypoint-initdb.d/01-schema.sql:ro" \
      docker.io/pgvector/pgvector:pg16
  fi
}

ct_start_redis() {
  local name="${INFRA_CONTAINERS[redis]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  local -a mem_limit=()
  local -a redis_args=(redis-server --requirepass 123456)
  if detect_low_mem_mode; then
    mem_limit=(--memory=96m --memory-swap=96m)
    redis_args+=(--maxmemory 48mb --maxmemory-policy allkeys-lru --save "")
  fi
  $CT_CMD run -d --name "$name" --restart unless-stopped "${mem_limit[@]}" \
    -p 127.0.0.1:6379:6379 \
    docker.io/library/redis:7 \
    "${redis_args[@]}"
}

ct_start_rmqnamesrv() {
  local name="${INFRA_CONTAINERS[rmqnamesrv]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  local -a mem_limit=()
  if detect_low_mem_mode; then
    mem_limit=(--memory=180m --memory-swap=180m)
  fi
  $CT_CMD run -d --name "$name" --restart unless-stopped "${mem_limit[@]}" \
    -p 127.0.0.1:9876:9876 \
    -e JAVA_OPT_EXT="-Xms64m -Xmx128m" \
    docker.io/apache/rocketmq:5.2.0 \
    sh mqnamesrv
}

ct_start_rmqbroker() {
  local name="${INFRA_CONTAINERS[rmqbroker]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true

  local -a mem_limit=()
  if detect_low_mem_mode; then
    mem_limit=(--memory=200m --memory-swap=200m)
  fi

  local broker_script='cat > /tmp/broker.conf << EOF
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1 = 127.0.0.1
namesrvAddr = 127.0.0.1:9876
autoCreateTopicEnable = true
EOF
exec sh mqbroker -n 127.0.0.1:9876 -c /tmp/broker.conf'

  # 优先 host 网络（NameServer 连通更稳）；失败则回退端口映射
  if $CT_CMD run -d --name "$name" --restart unless-stopped \
    "${mem_limit[@]}" \
    --network host \
    -e NAMESRV_ADDR="127.0.0.1:9876" \
    -e JAVA_OPT_EXT="-Xms64m -Xmx128m -XX:MaxMetaspaceSize=96m" \
    docker.io/apache/rocketmq:5.2.0 \
    sh -c "$broker_script" >/dev/null 2>&1; then
    ok "Broker 已用 host 网络启动"
    return 0
  fi

  warn "host 网络不可用，回退到端口映射模式"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  $CT_CMD run -d --name "$name" --restart unless-stopped \
    "${mem_limit[@]}" \
    -p 127.0.0.1:10909:10909 \
    -p 127.0.0.1:10911:10911 \
    -e NAMESRV_ADDR="127.0.0.1:9876" \
    -e JAVA_OPT_EXT="-Xms64m -Xmx128m -XX:MaxMetaspaceSize=96m" \
    --add-host=host.containers.internal:host-gateway \
    docker.io/apache/rocketmq:5.2.0 \
    sh -c 'cat > /tmp/broker.conf << EOF
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1 = 127.0.0.1
namesrvAddr = host.containers.internal:9876
autoCreateTopicEnable = true
EOF
exec sh mqbroker -n host.containers.internal:9876 -c /tmp/broker.conf'
}

rebuild_rmqbroker() {
  ensure_container_runtime
  if ! port_open 9876; then
    info "NameServer 未就绪，先启动 rmqnamesrv..."
    if ! port_open 9876; then
      start_infra_service rmqnamesrv
      wait_for_port 9876 "RocketMQ NameServer" 120
    fi
  fi
  info "强制重建 RocketMQ Broker（低内存稳定配置）..."
  ct_start_rmqbroker
  wait_for_port 10911 "RocketMQ Broker" 90 "" true || {
    warn "Broker 仍未就绪。后端已默认禁用 MQ 消费者，API 仍可启动。"
    warn "查看日志: $CT_CMD logs rmqbroker --tail 50"
    return 0
  }
  ok "RocketMQ Broker 已重建"
}

ct_start_rustfs() {
  local name="${INFRA_CONTAINERS[rustfs]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  local -a mem_limit=()
  if detect_low_mem_mode; then
    mem_limit=(--memory=128m --memory-swap=128m)
  fi
  $CT_CMD run -d --name "$name" --restart unless-stopped "${mem_limit[@]}" \
    -p 127.0.0.1:9000:9000 \
    -p 127.0.0.1:9001:9001 \
    -v ragent-rustfs-data:/data \
    docker.io/rustfs/rustfs:1.0.0-alpha.72 \
    --address :9000 \
    --console-enable \
    --access-key rustfsadmin \
    --secret-key rustfsadmin \
    /data
}

start_infra_service() {
  local svc="$1"
  case "$svc" in
    postgres) ct_start_postgres ;;
    redis) ct_start_redis ;;
    rmqnamesrv) ct_start_rmqnamesrv ;;
    rmqbroker) ct_start_rmqbroker ;;
    rustfs) ct_start_rustfs ;;
    *) fail "未知服务: $svc" ;;
  esac
}

infra_services_to_start() {
  local svc port
  local -a to_start=()
  while IFS= read -r svc; do
    [[ -z "$svc" ]] && continue
    port="${INFRA_PORTS[$svc]}"
    if port_open "$port"; then
      warn "端口 ${port} 已占用，跳过 ${svc}"
    else
      to_start+=("$svc")
    fi
  done < <(infra_services_list)
  if [[ ${#to_start[@]} -gt 0 ]]; then
    printf '%s\n' "${to_start[@]}"
  fi
}

recreate_light_infra() {
  ensure_container_runtime
  info "小内存模式：限额重建 postgres / redis / rustfs ..."
  ct_start_postgres
  wait_for_port 5432 "PostgreSQL" 90
  ct_start_redis
  wait_for_port 6379 "Redis" 30
  ct_start_rustfs
  wait_for_port 9000 "RustFS" 30
  ok "核心容器已按限额重建"
}

run_light_mode() {
  info "=== 小内存模式 (light) ==="
  LOW_MEM_MODE=true
  ensure_dirs
  load_env
  apply_low_mem_defaults
  ensure_server_config
  ensure_swap || true

  stop_rocketmq_containers
  recreate_light_infra

  FORCE_BACKEND=true
  kill_stale_backend
  maybe_prepare_backend false
  start_backend
  nginx_cmd reload || true

  echo ""
  if backend_http_ok; then
    ok "小内存模式完成：后端已稳定运行"
    warn "RocketMQ 已停止以节省内存；文档异步分块暂不可用（登录/知识库/聊天正常）"
  else
    fail "后端仍未就绪，请执行: ./server.sh doctor"
  fi
  print_ready
}

start_infra() {
  ensure_container_runtime
  info "检查基础设施端口..."
  local to_start=()
  while IFS= read -r svc; do
    [[ -n "$svc" ]] && to_start+=("$svc")
  done < <(infra_services_to_start)

  if [[ ${#to_start[@]} -eq 0 ]]; then
    ok "基础设施端口均已就绪，无需启动新容器"
  else
    info "使用 ${CT_RT_LABEL} 启动: ${to_start[*]}"
    local svc
    for svc in "${to_start[@]}"; do
      start_infra_service "$svc"
    done
  fi

  wait_for_port 5432 "PostgreSQL" 90
  wait_for_port 6379 "Redis" 30
  if should_skip_rocketmq; then
    stop_rocketmq_containers
    warn "小内存模式：已跳过 RocketMQ（为后端节省约 400MB 内存）"
  else
    wait_for_port 9876 "RocketMQ NameServer" 120
    wait_for_port 10911 "RocketMQ Broker" 60 "" true || warn_if_broker_unstable
  fi
  wait_for_port 9000 "RustFS" 30
  ok "基础设施检查完成"
}

start_rustfs_only() {
  ensure_container_runtime
  if port_open 9000; then
    warn "RustFS 端口 9000 已在监听，无需启动"
    return 0
  fi
  info "使用 ${CT_RT_LABEL} 启动 RustFS..."
  ct_start_rustfs
  wait_for_port 9000 "RustFS" 30
  ok "RustFS 已启动"
}

stop_infra() {
  ensure_container_runtime
  info "停止脚本管理的 RustFS 容器（不影响已有 postgres/redis/rocketmq）..."
  local name="${INFRA_CONTAINERS[rustfs]}"
  if ct_exists "$name"; then
    $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  fi
  ok "RustFS 已停止"
}

find_backend_jar() {
  find "$BACKEND/bootstrap/target" -maxdepth 1 -name '*.jar' \
    ! -name '*-sources.jar' ! -name '*-javadoc.jar' ! -name '*-original.jar' \
    -print 2>/dev/null | head -1
}

backend_http_ok() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 \
    -X POST "http://127.0.0.1:${BACKEND_PORT}/api/ragent/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"__health__","password":"__health__"}' 2>/dev/null || echo 000)"
  # 能连上后端就算健康：401/400/200/403 都说明 Spring 已起来；000/502/503 不行
  [[ "$code" =~ ^(200|400|401|403|404|405)$ ]]
}

nginx_proxy_ok() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 5 \
    -X POST "http://127.0.0.1/api/ragent/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"__health__","password":"__health__"}' 2>/dev/null || echo 000)"
  [[ "$code" =~ ^(200|400|401|403|404|405)$ ]]
}

wait_for_backend_ready() {
  local timeout="${1:-180}"
  local log_file="${2:-$LOG_DIR/backend.log}"
  info "等待后端真正可用 (端口 ${BACKEND_PORT} + HTTP)..."
  local i=0
  while true; do
    if port_open "$BACKEND_PORT" && backend_http_ok; then
      ok "后端已就绪（HTTP 健康检查通过）"
      return 0
    fi
    sleep 2
    i=$((i + 2))
    if [[ $i -ge $timeout ]]; then
      warn "最近日志 (${log_file}):"
      tail -n 40 "$log_file" 2>/dev/null >&2 || true
      fail "后端在 ${timeout}s 内未通过健康检查。常见原因：MQ 消费者卡住 / OOM / 配置未生效。请执行: ./server.sh doctor"
    fi
    if (( i % 20 == 0 )); then
      info "仍在等待后端... ${i}s/${timeout}s"
      if [[ -f "$log_file" ]]; then
        local last
        last="$(tail -n 1 "$log_file" 2>/dev/null || true)"
        [[ -n "$last" ]] && info "最新日志: ${last}"
      fi
    fi
  done
}

kill_stale_backend() {
  info "清理可能卡死的后端进程..."
  local pid_file="$PID_DIR/backend.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
  if port_open "$BACKEND_PORT"; then
    local pid
    pid="$(pid_on_port "$BACKEND_PORT")"
    if [[ -n "$pid" ]]; then
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  pkill -f "bootstrap.*\.jar" 2>/dev/null || true
  pkill -f "spring-boot:run" 2>/dev/null || true
  pkill -f "ragent.*\.jar" 2>/dev/null || true
  sleep 1
  if port_open "$BACKEND_PORT"; then
    fail "无法释放端口 ${BACKEND_PORT}，请手动: lsof -iTCP:${BACKEND_PORT} -sTCP:LISTEN"
  fi
  ok "旧后端进程已清理"
}

write_server_config() {
  mkdir -p "$(dirname "$SERVER_CONFIG")"
  cat >"$SERVER_CONFIG" <<'EOF'
# 由 server.sh 自动写入（每次启动都会覆盖）
# 目的：2G 小内存机器上避免 MCP / RocketMQ 消费者阻塞 Spring 启动，导致 Nginx 502

rag:
  mcp:
    servers: []

rocketmq:
  consumer:
    listeners:
      knowledge-document-chunk_cg:
        knowledge-document-chunk_topic:
          enabled: false
      message-feedback_cg:
        message-feedback_topic:
          enabled: false

logging:
  level:
    org.apache.rocketmq: WARN
EOF
  # 兼容旧路径：有人可能还在用 application-server.yaml
  mkdir -p "$(dirname "$LEGACY_SERVER_CONFIG")"
  cp -f "$SERVER_CONFIG" "$LEGACY_SERVER_CONFIG"
  ok "已写入服务器配置: ${SERVER_CONFIG}"
}

ensure_server_config() {
  write_server_config
}

record_build_sha() {
  if git -C "$ROOT" rev-parse HEAD >/dev/null 2>&1; then
    git -C "$ROOT" rev-parse HEAD >"$LAST_BUILD_SHA"
  fi
}

git_upstream_ref() {
  git -C "$ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "origin/master"
}

count_remote_commits_behind() {
  local upstream
  upstream="$(git_upstream_ref)"
  git -C "$ROOT" rev-list --count "HEAD..${upstream}" 2>/dev/null || echo 0
}

backend_changed_since_last_build() {
  [[ -f "$LAST_BUILD_SHA" ]] || return 1
  local last_sha
  last_sha="$(cat "$LAST_BUILD_SHA")"
  git -C "$ROOT" diff --name-only "$last_sha" HEAD -- SWT-JOB-Backend/ 2>/dev/null | grep -q .
}

remote_has_backend_changes() {
  local upstream behind_files
  upstream="$(git_upstream_ref)"
  behind_files="$(git -C "$ROOT" diff --name-only "HEAD..${upstream}" -- SWT-JOB-Backend/ 2>/dev/null || true)"
  [[ -n "$behind_files" ]]
}

prompt_backend_update_action() {
  local behind="$1"
  local has_local_changes="$2"
  local has_remote_backend="$3"
  local jar_exists="$4"

  echo ""
  warn "检测到后端可能需要更新："
  [[ "$behind" -gt 0 ]] && echo "  - 远程领先 ${behind} 个提交"
  [[ "$has_local_changes" == "true" ]] && echo "  - 本地 Java 代码相对上次编译有变更"
  [[ "$has_remote_backend" == "true" ]] && echo "  - 远程提交包含 SWT-JOB-Backend 变更"
  [[ -z "$jar_exists" ]] && echo "  - 当前未找到已编译 jar"
  echo ""

  if [[ ! -t 0 ]]; then
    if [[ -n "$jar_exists" ]]; then
      warn "非交互终端：使用现有 jar 继续启动"
      return 0
    fi
    warn "非交互终端：未找到 jar，将自动拉取并编译"
    git_pull_and_build
    return $?
  fi

  echo "请选择："
  echo "  [1] 拉取并重新编译 (git pull + build)"
  if [[ -n "$jar_exists" ]]; then
    echo "  [2] 使用现有 jar 继续启动"
  fi
  echo "  [3] 取消"
  echo ""
  local choice
  while true; do
    if [[ -n "$jar_exists" ]]; then
      read -r -p "请输入 [1/2/3]: " choice
    else
      read -r -p "请输入 [1/3]: " choice
      [[ "$choice" == "2" ]] && choice="3"
    fi
    case "$choice" in
      1) git_pull_and_build; return $? ;;
      2)
        if [[ -n "$jar_exists" ]]; then
          ok "使用现有 jar 继续"
          return 0
        fi
        ;;
      3) fail "已取消启动" ;;
      *) warn "无效输入，请重新选择" ;;
    esac
  done
}

git_pull_and_build() {
  info "拉取最新代码..."
  git -C "$ROOT" pull --ff-only || fail "git pull 失败，请手动解决后重试"
  build_backend
}

maybe_prepare_backend() {
  local do_build="$1"

  ensure_server_config

  if [[ "$do_build" == "true" ]]; then
    build_backend
    return 0
  fi

  if [[ "$SKIP_UPDATE_CHECK" == "true" ]]; then
    return 0
  fi

  if ! git -C "$ROOT" rev-parse HEAD >/dev/null 2>&1; then
    warn "当前目录不是 Git 仓库，跳过更新检测"
    return 0
  fi

  if [[ "$AUTO_PULL_BUILD" == "true" ]]; then
    local behind
    behind="$(count_remote_commits_behind)"
    if [[ "$behind" -gt 0 ]] || ! find_backend_jar >/dev/null 2>&1; then
      git_pull_and_build
    fi
    return 0
  fi

  git -C "$ROOT" fetch origin --quiet 2>/dev/null || warn "git fetch 失败，仅使用本地状态判断"

  local behind=0
  behind="$(count_remote_commits_behind)"
  local has_local_changes="false"
  local has_remote_backend="false"
  local jar
  jar="$(find_backend_jar || true)"

  backend_changed_since_last_build && has_local_changes="true"
  remote_has_backend_changes && has_remote_backend="true"

  if [[ "$behind" -gt 0 || "$has_local_changes" == "true" || "$has_remote_backend" == "true" || -z "$jar" ]]; then
    prompt_backend_update_action "$behind" "$has_local_changes" "$has_remote_backend" "$jar"
  fi
}

build_backend() {
  resolve_java17
  info "编译后端 jar..."
  (cd "$BACKEND" && ./mvnw -q package -DskipTests)
  local jar
  jar="$(find_backend_jar)"
  [[ -n "$jar" ]] || fail "编译完成但未找到 jar 包"
  record_build_sha
  ok "编译完成: ${jar}"
}

stop_backend() {
  local pid_file="$PID_DIR/backend.pid"
  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    info "停止后端 (PID ${pid})..."
    kill "$pid" 2>/dev/null || true
    sleep 2
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    ok "后端已停止"
  elif port_open "$BACKEND_PORT"; then
    local pid
    pid="$(pid_on_port "$BACKEND_PORT")"
    if [[ -n "$pid" ]]; then
      info "停止后端 (端口 ${BACKEND_PORT}, PID ${pid})..."
      kill "$pid" 2>/dev/null || true
      sleep 2
      kill -9 "$pid" 2>/dev/null || true
      ok "后端已停止"
    fi
  fi
  pkill -f "bootstrap.*\.jar" 2>/dev/null || true
  pkill -f "spring-boot:run" 2>/dev/null || true
}

start_backend() {
  resolve_java17
  load_env
  apply_low_mem_defaults
  ensure_server_config

  local pid_file="$PID_DIR/backend.pid"
  local log_file="$LOG_DIR/backend.log"
  ensure_dirs

  # 已在跑且健康 → 跳过；否则强杀再启（解决「进程在但 502」）
  if [[ "$FORCE_BACKEND" == "true" ]]; then
    kill_stale_backend
  elif port_open "$BACKEND_PORT"; then
    if backend_http_ok; then
      ok "后端已在运行且健康 (端口 ${BACKEND_PORT})"
      local listener_pid
      listener_pid="$(pid_on_port "$BACKEND_PORT")"
      [[ -n "$listener_pid" ]] && echo "$listener_pid" >"$pid_file"
      return 0
    fi
    warn "端口 ${BACKEND_PORT} 被占用，但 HTTP 健康检查失败（典型：启动卡在 MCP/MQ）"
    kill_stale_backend
  elif is_running "$pid_file"; then
    warn "PID 文件存在但端口未监听，清理后重启"
    kill_stale_backend
  fi

  local jar
  jar="$(find_backend_jar)"
  [[ -n "$jar" ]] || fail "未找到 jar，请先执行: ./server.sh build"

  info "启动 Spring Boot 后端..."
  info "日志: ${log_file}"
  info "配置: ${SERVER_CONFIG}（关 MCP + 关 MQ 消费者，避免卡死）"
  warn_if_broker_unstable

  : >"$log_file"

  local -a java_cmd=(java)
  # shellcheck disable=SC2206
  java_cmd+=($JAVA_MEM_OPTS)
  if [[ -n "${JAVA_OPTS:-}" ]]; then
    # shellcheck disable=SC2206
    java_cmd+=($JAVA_OPTS)
  fi

  # 关键：用 --spring.config.additional-location 指向目录，Spring 会加载其中的 application.yaml
  local config_dir
  config_dir="$(dirname "$SERVER_CONFIG")"
  local spring_cfg="file:${config_dir}/"

  (
    cd "$BACKEND/bootstrap"
    nohup "${java_cmd[@]}" -jar "$jar" \
      --spring.config.additional-location="${spring_cfg}" \
      >>"$log_file" 2>&1 &
    echo $! >"$pid_file"
  )

  wait_for_backend_ready 180 "$log_file"
  local listener_pid
  listener_pid="$(pid_on_port "$BACKEND_PORT")"
  [[ -n "$listener_pid" ]] && echo "$listener_pid" >"$pid_file"

  if nginx_proxy_ok; then
    ok "Nginx → 后端代理正常"
  else
    warn "本机 Nginx 代理仍异常。若用 Vercel 反代，请执行: ./server.sh nginx reload"
    warn "并确认 Nginx upstream 指向 127.0.0.1:${BACKEND_PORT}"
  fi
}

nginx_running() {
  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active --quiet nginx 2>/dev/null
    return
  fi
  pgrep -x nginx >/dev/null 2>&1
}

nginx_cmd() {
  local action="${1:-reload}"

  case "$action" in
    install-conf)
      local example="$ROOT/scripts/nginx/swt-job.conf.example"
      [[ -f "$example" ]] || fail "模板不存在: ${example}"
      info "安装 Nginx 配置 → ${NGINX_CONF}"
      maybe_sudo mkdir -p "$(dirname "$NGINX_CONF")"
      if [[ -f "$NGINX_CONF" ]]; then
        warn "配置已存在，跳过覆盖: ${NGINX_CONF}"
      else
        maybe_sudo cp "$example" "$NGINX_CONF"
        ok "已安装，请编辑 server_name 后执行: ./server.sh nginx reload"
      fi
      ;;
    start)
      if nginx_running; then
        warn "Nginx 已在运行"
        return 0
      fi
      info "启动 Nginx..."
      if command -v systemctl >/dev/null 2>&1; then
        maybe_sudo systemctl start nginx
      else
        maybe_sudo nginx
      fi
      ok "Nginx 已启动"
      ;;
    reload)
      if [[ ! -f "$NGINX_CONF" ]]; then
        warn "未找到 ${NGINX_CONF}，跳过 Nginx 重载（可先执行 ./server.sh nginx install-conf）"
        return 0
      fi
      info "校验并重载 Nginx..."
      maybe_sudo nginx -t
      if command -v systemctl >/dev/null 2>&1; then
        maybe_sudo systemctl reload nginx
      else
        maybe_sudo nginx -s reload
      fi
      ok "Nginx 已重载"
      ;;
    stop)
      warn "将停止整个 Nginx 服务（会影响该机其它站点）"
      if command -v systemctl >/dev/null 2>&1; then
        maybe_sudo systemctl stop nginx
      else
        maybe_sudo nginx -s stop
      fi
      ok "Nginx 已停止"
      ;;
    status)
      if nginx_running; then
        ok "Nginx: 运行中"
      else
        echo -e "  ${RED}○${NC} Nginx: 未运行"
      fi
      if [[ -f "$NGINX_CONF" ]]; then
        echo "  配置文件: ${NGINX_CONF}"
      else
        echo "  配置文件: 未安装"
      fi
      ;;
    *)
      fail "未知 nginx 子命令: ${action}（可用: start | reload | stop | install-conf | status）"
      ;;
  esac
}

show_status() {
  echo ""
  echo "=== SWT-JOB 服务器状态 ==="
  echo ""
  resolve_container_runtime 2>/dev/null || true
  echo "  环境文件: ${ENV_FILE}"
  echo "  配置文件: ${SERVER_CONFIG}"
  echo "  日志目录: ${LOG_DIR}"
  if [[ -n "$CT_RT_LABEL" ]]; then
    echo "  容器运行时: ${CT_RT_LABEL}"
  fi
  if detect_low_mem_mode; then
    echo -e "  ${YELLOW}●${NC} 小内存模式: 开启（总内存 $(total_mem_mb)MB）"
    if should_skip_rocketmq; then
      echo -e "  ${YELLOW}●${NC} RocketMQ: 已跳过（为后端腾内存）"
    fi
    echo "  后端 JVM: ${JAVA_MEM_OPTS}"
  fi
  echo ""

  local svc
  for svc in "5432:PostgreSQL" "6379:Redis" "9876:RMQ NameServer" "10911:RMQ Broker" "9000:RustFS" "${BACKEND_PORT}:后端端口"; do
    local port="${svc%%:*}"
    local label="${svc#*:}"
    if port_open "$port"; then
      echo -e "  ${GREEN}●${NC} ${label}  :${port}"
    else
      echo -e "  ${RED}○${NC} ${label}  :${port}"
    fi
  done

  echo ""
  if backend_http_ok; then
    echo -e "  ${GREEN}●${NC} 后端 HTTP 健康检查: 通过"
  else
    echo -e "  ${RED}○${NC} 后端 HTTP 健康检查: 失败（这就是 Vercel 502 的原因）"
  fi
  if nginx_proxy_ok; then
    echo -e "  ${GREEN}●${NC} Nginx → 后端代理: 正常"
  else
    echo -e "  ${RED}○${NC} Nginx → 后端代理: 异常（502）"
  fi

  echo ""
  nginx_cmd status
  echo ""

  if is_running "$PID_DIR/backend.pid"; then
    echo "  后端 PID: $(cat "$PID_DIR/backend.pid")"
  fi
  if [[ -f "$ENV_FILE" ]] && grep -q '^BAILIAN_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
    echo -e "  ${GREEN}●${NC} BAILIAN_API_KEY: 已配置"
  else
    echo -e "  ${YELLOW}○${NC} BAILIAN_API_KEY: 未配置"
  fi
  echo ""
}

run_doctor() {
  echo ""
  echo "=== SWT-JOB 诊断 (doctor) ==="
  echo ""
  resolve_container_runtime 2>/dev/null || true

  echo "1) 端口与健康"
  show_status

  echo "2) 后端进程"
  ps aux | grep -E '[j]ava.*bootstrap|[j]ava.*ragent|[s]pring-boot:run' || echo "  （未发现 Java 后端进程）"
  echo ""

  echo "3) 最近后端日志"
  if [[ -f "$LOG_DIR/backend.log" ]]; then
    tail -n 25 "$LOG_DIR/backend.log" || true
  else
    echo "  无日志文件: $LOG_DIR/backend.log"
  fi
  echo ""

  echo "4) RocketMQ Broker"
  if [[ -n "$CT_CMD" ]] && ct_exists rmqbroker; then
    $CT_CMD ps -a --filter name=rmqbroker --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
    echo "--- broker 最近日志 ---"
    $CT_CMD logs rmqbroker --tail 20 2>/dev/null || true
  else
    echo "  未找到 rmqbroker 容器"
  fi
  echo ""

  echo "5) 内存与容器占用"
  free -h 2>/dev/null || true
  if [[ -n "$CT_CMD" ]]; then
    $CT_CMD stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}' 2>/dev/null \
      | grep -E 'NAME|ragent-|rmq' || true
  fi
  echo ""
  echo "5b) 是否被 OOM kill"
  if dmesg 2>/dev/null | grep -iE 'killed process|out of memory|oom' | tail -n 5 | grep -q .; then
    dmesg 2>/dev/null | grep -iE 'killed process|out of memory|oom' | tail -n 5 || true
    warn "检测到 OOM kill！2G 机器请执行: ./server.sh light && ./server.sh swap"
  else
    echo "  未发现近期 OOM 记录（或无权读取 dmesg）"
  fi
  echo ""

  echo "6) 结论"
  if backend_http_ok && nginx_proxy_ok; then
    ok "本机链路正常。若浏览器仍 502，多半是 Vercel 缓存或旧部署，等 1 分钟再试。"
  elif backend_http_ok && ! nginx_proxy_ok; then
    warn "后端已起来，但 Nginx 代理失败 → 执行: ./server.sh nginx install-conf && ./server.sh nginx reload"
  elif port_open "$BACKEND_PORT" && ! backend_http_ok; then
    warn "端口在听但 HTTP 不通 → 后端卡在启动中。执行: ./server.sh light"
  else
    warn "后端未就绪（常被 OOM kill）→ 执行: ./server.sh light"
  fi
  echo ""
}

fix_all() {
  info "=== 一键修复开始 ==="
  ensure_dirs
  load_env
  apply_low_mem_defaults
  ensure_server_config
  FORCE_BACKEND=true
  ensure_swap || true

  if detect_low_mem_mode; then
    warn "检测到小内存机器（$(total_mem_mb)MB），使用 light 策略：停 MQ + 限额重建容器"
    stop_rocketmq_containers
    recreate_light_infra
  else
    start_infra || true
    rebuild_rmqbroker || true
  fi

  kill_stale_backend
  maybe_prepare_backend false
  start_backend
  nginx_cmd reload || true

  echo ""
  if backend_http_ok && nginx_proxy_ok; then
    ok "修复成功：本机登录接口已通，Vercel 502 应随之消失"
  elif backend_http_ok; then
    ok "后端已通，但 Nginx 仍异常 → 执行: ./server.sh nginx install-conf && ./server.sh nginx reload"
  elif detect_low_mem_mode; then
    fail "修复后后端仍不可用。请依次执行: ./server.sh swap && ./server.sh light"
  else
    fail "修复后后端仍不可用，请把 ./server.sh doctor 输出贴出来"
  fi
  print_ready
}

show_logs() {
  local target="${1:-backend}"
  case "$target" in
    backend|be)
      tail -f "$LOG_DIR/backend.log"
      ;;
    nginx)
      if [[ -f /var/log/nginx/error.log ]]; then
        maybe_sudo tail -f /var/log/nginx/error.log
      else
        fail "未找到 /var/log/nginx/error.log"
      fi
      ;;
    docker:*|podman:*|ct:*|rustfs|postgres|redis|rmqnamesrv|rmqbroker)
      local service="${target#*:}"
      [[ "$target" == "rustfs" || "$target" == "postgres" || "$target" == "redis" || "$target" == "rmqnamesrv" || "$target" == "rmqbroker" ]] && service="$target"
      local name="${INFRA_CONTAINERS[$service]:-$service}"
      ensure_container_runtime
      $CT_CMD logs -f "$name"
      ;;
    *)
      fail "请指定: ./server.sh logs backend|nginx|rustfs"
      ;;
  esac
}

print_ready() {
  echo ""
  ok "服务器环境已就绪"
  echo ""
  echo "  后端 API:  http://127.0.0.1:${BACKEND_PORT}/api/ragent"
  echo "  日志:      ${LOG_DIR}/backend.log"
  echo ""
  echo "  停止后端:     ./server.sh stop"
  echo "  重启后端:     ./server.sh restart backend"
  echo "  查看状态:     ./server.sh status"
  echo "  Nginx 重载:   ./server.sh nginx reload"
  echo ""
}

stop_all() {
  local stop_infra=false
  local stop_nginx=false
  for arg in "$@"; do
    case "$arg" in
      --infra) stop_infra=true ;;
      --nginx) stop_nginx=true ;;
    esac
  done

  stop_backend
  if [[ "$stop_infra" == "true" ]]; then
    stop_infra
  fi
  if [[ "$stop_nginx" == "true" ]]; then
    nginx_cmd stop
  fi
}

restart_services() {
  local target="${1:-backend}"
  local do_build=false
  local extra_args=()
  shift || true
  for arg in "$@"; do
    case "$arg" in
      --build) do_build=true ;;
      --pull) AUTO_PULL_BUILD=true ;;
      --skip-update-check) SKIP_UPDATE_CHECK=true ;;
      --infra|--nginx) extra_args+=("$arg") ;;
      *) extra_args+=("$arg") ;;
    esac
  done

  case "$target" in
    all)
      stop_all "${extra_args[@]}"
      maybe_prepare_backend "$do_build"
      start_infra
      start_backend
      nginx_cmd reload
      print_ready
      ;;
    backend|be)
      stop_backend
      maybe_prepare_backend "$do_build"
      start_backend
      ok "后端已重启"
      ;;
    infra|docker|podman)
      stop_infra
      start_infra
      ok "基础设施已重启"
      ;;
    *)
      fail "未知重启目标: ${target}（可用: all | backend | infra）"
      ;;
  esac
}

main() {
  local cmd="${1:-all}"
  shift || true

  local do_build=false
  local extra_args=()
  for arg in "$@"; do
    case "$arg" in
      --build) do_build=true ;;
      --pull) AUTO_PULL_BUILD=true ;;
      --skip-update-check) SKIP_UPDATE_CHECK=true ;;
      --force) FORCE_BACKEND=true ;;
      --infra|--nginx) extra_args+=("$arg") ;;
      -h|--help) usage; exit 0 ;;
      *) extra_args+=("$arg") ;;
    esac
  done

  ensure_dirs

  case "$cmd" in
    all|start)
      start_infra
      maybe_prepare_backend "$do_build"
      start_backend
      nginx_cmd reload
      print_ready
      ;;
    fix|repair)
      fix_all
      ;;
    light|lowmem)
      run_light_mode
      ;;
    swap)
      setup_swap
      ;;
    doctor|diag|diagnose)
      run_doctor
      ;;
    infra|docker|podman)
      start_infra
      show_status
      ;;
    rustfs)
      start_rustfs_only
      show_status
      ;;
    broker|rmqbroker)
      rebuild_rmqbroker
      show_status
      ;;
    backend|be)
      start_infra
      maybe_prepare_backend "$do_build"
      start_backend
      print_ready
      ;;
    nginx)
      nginx_cmd "${extra_args[0]:-reload}"
      ;;
    build)
      build_backend
      ;;
    stop)
      stop_all "${extra_args[@]}"
      ;;
    restart)
      FORCE_BACKEND=true
      restart_services "${extra_args[0]:-backend}" "${extra_args[@]:1}"
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
      fail "未知命令: ${cmd}。运行 ./server.sh help 查看帮助。"
      ;;
  esac
}

main "$@"
