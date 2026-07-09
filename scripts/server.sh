#!/usr/bin/env bash
# SWT-JOB 服务器一键启停脚本（Podman/Docker 基础设施 + 后端 + Nginx）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/SWT-JOB-Backend"
STATE_DIR="$ROOT/.server"
PID_DIR="$STATE_DIR/pids"
LOG_DIR="$STATE_DIR/logs"

BACKEND_PORT="${BACKEND_PORT:-9090}"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
SERVER_CONFIG="${SERVER_CONFIG:-$BACKEND/bootstrap/config/application-server.yaml}"
LAST_BUILD_SHA="$STATE_DIR/last-build.sha"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/swt-job.conf}"
USE_SUDO="${USE_SUDO:-auto}"
CONTAINER_RT="${CONTAINER_RT:-}"
JAVA_MEM_OPTS="${JAVA_MEM_OPTS:--Xms256m -Xmx512m}"
SKIP_UPDATE_CHECK=false
AUTO_PULL_BUILD=false

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
  infra       仅启动缺失的基础设施（Podman/Docker）
  rustfs      仅启动 RustFS（创建知识库必需）
  backend     检查基础设施 + 启动 Spring Boot 后端
  nginx       Nginx 子命令：start | reload | stop | install-conf
  build       编译后端 jar 包
  stop        停止后端（默认保留 Docker / Nginx）
  restart     重启后端，或 restart all 重启全部
  status      查看容器 / 后端 / Nginx 状态
  logs        查看日志（backend | nginx | rustfs | postgres | redis）

说明:
  基础设施使用 podman run 直接启动，不依赖 compose / yaml 文件。
  端口已占用时自动跳过（兼容已有的 ragent-postgres 等容器）。

选项:
  --infra     stop / restart 时包含 Docker 容器
  --nginx     stop / restart 时包含 Nginx（stop 会停整个 Nginx 服务）
  --build     backend / all / restart 前先编译 jar
  --pull      检测到更新时自动拉取并重新编译（非交互）
  --skip-update-check  跳过后端更新检测，直接启动

环境变量（可写入项目根 .env）:
  BAILIAN_API_KEY      AI 功能必填
  SERVER_ENV_FILE      环境变量文件路径（默认 <项目根>/.env）
  SERVER_CONFIG        服务器 Spring 覆盖配置（默认 bootstrap/config/application-server.yaml）
  NGINX_CONF           Nginx 站点配置路径
  BACKEND_PORT         后端端口（默认 9090）
  JAVA_MEM_OPTS        JVM 内存参数（默认 -Xms256m -Xmx512m）
  USE_SUDO=yes|no|auto 操作 Nginx 时是否 sudo（默认 auto）
  CONTAINER_RT=podman|docker  强制指定容器运行时（默认自动检测）

智能行为:
  - 自动加载 application-server.yaml，生产环境默认关闭 MCP
  - 启动后端前检测 Git 远程/本地 Java 变更，交互询问是否拉取并编译

示例:
  ./server.sh                    # 检查中间件 + 启动后端 + 重载 Nginx
  ./server.sh infra              # 只检查/补启中间件
  ./server.sh backend            # 检查中间件 + 只启后端
  ./server.sh nginx install-conf # 安装 Nginx 配置模板
  ./server.sh nginx reload       # 校验并重载 Nginx
  ./server.sh stop               # 只停后端
  ./server.sh stop --infra       # 停后端 + Docker
  ./server.sh restart backend    # 重启后端（会重新加载 .env）
  ./server.sh restart all --build
  ./server.sh status
  ./server.sh logs backend

首次部署:
  1. cp .env.example .env 并填入 BAILIAN_API_KEY
  2. ./server.sh build
  3. ./server.sh nginx install-conf  # 编辑域名后
  4. ./server.sh all
EOF
}

ensure_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
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
  info "等待 ${label} (127.0.0.1:${port})..."
  local i=0
  while ! port_open "$port"; do
    sleep 1
    i=$((i + 1))
    if [[ $i -ge $timeout ]]; then
      fail "${label} 在 ${timeout}s 内未就绪，请查看 ${LOG_DIR}/backend.log"
    fi
  done
  ok "${label} 已就绪"
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
  $CT_CMD run -d --name "$name" --restart unless-stopped \
    -p 127.0.0.1:5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=ragent \
    -v ragent-pg-data:/var/lib/postgresql/data \
    -v "$schema:/docker-entrypoint-initdb.d/01-schema.sql:ro" \
    docker.io/pgvector/pgvector:pg16
}

ct_start_redis() {
  local name="${INFRA_CONTAINERS[redis]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  $CT_CMD run -d --name "$name" --restart unless-stopped \
    -p 127.0.0.1:6379:6379 \
    docker.io/library/redis:7 \
    redis-server --requirepass 123456
}

ct_start_rmqnamesrv() {
  local name="${INFRA_CONTAINERS[rmqnamesrv]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  $CT_CMD run -d --name "$name" --restart unless-stopped \
    -p 127.0.0.1:9876:9876 \
    -e JAVA_OPT_EXT="-Xms256m -Xmx400m" \
    docker.io/apache/rocketmq:5.2.0 \
    sh mqnamesrv
}

ct_start_rmqbroker() {
  local name="${INFRA_CONTAINERS[rmqbroker]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  $CT_CMD run -d --name "$name" --restart unless-stopped \
    -p 127.0.0.1:10909:10909 \
    -p 127.0.0.1:10911:10911 \
    -e NAMESRV_ADDR="rmqnamesrv:9876" \
    -e JAVA_OPT_EXT="-Xms256m -Xmx400m" \
    --add-host rmqnamesrv:127.0.0.1 \
    docker.io/apache/rocketmq:5.2.0 \
    sh -c 'cat > /home/rocketmq/rocketmq-5.2.0/conf/broker.conf << EOF
brokerClusterName = DefaultCluster
brokerName = broker-a
brokerId = 0
deleteWhen = 04
fileReservedTime = 48
brokerRole = ASYNC_MASTER
flushDiskType = ASYNC_FLUSH
brokerIP1 = 127.0.0.1
timerMaxDelaySec = 31622400
EOF
sh mqbroker --enable-proxy -c /home/rocketmq/rocketmq-5.2.0/conf/broker.conf'
}

ct_start_rustfs() {
  local name="${INFRA_CONTAINERS[rustfs]}"
  ct_exists "$name" && $CT_CMD rm -f "$name" >/dev/null 2>&1 || true
  $CT_CMD run -d --name "$name" --restart unless-stopped \
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
  for svc in "${INFRA_SERVICES[@]}"; do
    port="${INFRA_PORTS[$svc]}"
    if port_open "$port"; then
      warn "端口 ${port} 已占用，跳过 ${svc}"
    else
      to_start+=("$svc")
    fi
  done
  if [[ ${#to_start[@]} -gt 0 ]]; then
    printf '%s\n' "${to_start[@]}"
  fi
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
  wait_for_port 9876 "RocketMQ NameServer" 120
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

ensure_server_config() {
  if [[ -f "$SERVER_CONFIG" ]]; then
    return 0
  fi
  mkdir -p "$(dirname "$SERVER_CONFIG")"
  cat >"$SERVER_CONFIG" <<'EOF'
rag:
  mcp:
    servers: []
EOF
  warn "已生成服务器配置: ${SERVER_CONFIG}（默认关闭 MCP）"
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
  ensure_server_config

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

  local jar
  jar="$(find_backend_jar)"
  info "启动 Spring Boot 后端..."
  info "日志: ${log_file}"
  info "服务器配置: ${SERVER_CONFIG}（已关闭 MCP 等待）"

  local -a java_cmd=(java)
  # shellcheck disable=SC2206
  java_cmd+=($JAVA_MEM_OPTS)
  if [[ -n "${JAVA_OPTS:-}" ]]; then
    # shellcheck disable=SC2206
    java_cmd+=($JAVA_OPTS)
  fi

  export SPRING_CONFIG_ADDITIONAL_LOCATION="file:${SERVER_CONFIG}"

  (
    cd "$BACKEND/bootstrap"
    if [[ -n "$jar" ]]; then
      nohup "${java_cmd[@]}" -jar "$jar" >>"$log_file" 2>&1 &
    else
      warn "未找到 jar，使用 mvnw spring-boot:run（建议先执行 ./server.sh build）"
      nohup ../mvnw -q spring-boot:run -DskipTests >>"$log_file" 2>&1 &
    fi
  )

  wait_for_port "$BACKEND_PORT" "后端 API" 180
  local listener_pid
  listener_pid="$(pid_on_port "$BACKEND_PORT")"
  [[ -n "$listener_pid" ]] && echo "$listener_pid" >"$pid_file"
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
  echo "  日志目录: ${LOG_DIR}"
  if [[ -n "$CT_RT_LABEL" ]]; then
    echo "  容器运行时: ${CT_RT_LABEL}"
  fi
  echo ""

  local svc
  for svc in "5432:PostgreSQL" "6379:Redis" "9876:RocketMQ" "9000:RustFS" "${BACKEND_PORT}:后端 API"; do
    local port="${svc%%:*}"
    local label="${svc#*:}"
    if port_open "$port"; then
      echo -e "  ${GREEN}●${NC} ${label}  :${port}"
    else
      echo -e "  ${RED}○${NC} ${label}  :${port}"
    fi
  done

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
    infra|docker|podman)
      start_infra
      show_status
      ;;
    rustfs)
      start_rustfs_only
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
