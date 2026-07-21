#!/usr/bin/env bash
# 数据库 upgrade 脚本：查看状态 / 执行未跑迁移 / 登记历史上已手动跑过的迁移
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${DB_DIR:-$ROOT/SWT-JOB-Backend/resources/database}"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-ragent}"
PG_CONTAINER="${PG_CONTAINER:-ragent-postgres}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "${BLUE}[db]${NC} $*"; }
ok()    { echo -e "${GREEN}[db]${NC} $*"; }
warn()  { echo -e "${YELLOW}[db]${NC} $*" >&2; }
fail()  { echo -e "${RED}[db]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
数据库迁移（upgrade_v*.sql）

用法:
  ./scripts/db-migrate.sh              同 status
  ./scripts/db-migrate.sh status       哪些已跑、哪些未跑（含结构检测）
  ./scripts/db-migrate.sh up           按顺序执行未记录的迁移
  ./scripts/db-migrate.sh sync         只登记「结构上已存在、但未写入记录表」的迁移（不重复执行 SQL）
  ./scripts/db-migrate.sh up --dry-run  仅打印将要执行的文件
  ./scripts/db-migrate.sh doctor       排查「跑不起来」（路径/容器/连接）

等价短命令（项目根）:
  ./server.sh db
  ./server.sh db doctor
  ./server.sh db up
  ./server.sh db sync

环境变量（可写入 .env）:
  PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
  PG_CONTAINER   Docker/Podman 容器名（默认 ragent-postgres）；能连上容器则优先用容器内 psql

说明:
  - 记录表: t_schema_migration
  - 若你以前手动 psql 跑过升级脚本，先 ./server.sh db status，再 ./server.sh db sync，最后 ./server.sh db up
EOF
}

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set +u
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE" 2>/dev/null || warn "加载 ${ENV_FILE} 失败（可检查语法）；继续使用默认 PG 变量"
    set +a
    set -u
  fi
  PGHOST="${PGHOST:-127.0.0.1}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-postgres}"
  PGPASSWORD="${PGPASSWORD:-postgres}"
  PGDATABASE="${PGDATABASE:-ragent}"
  PG_CONTAINER="${PG_CONTAINER:-ragent-postgres}"
}

list_running_containers() {
  local rt="$1"
  "$rt" ps --format '{{.Names}}' 2>/dev/null || true
}

guess_postgres_container() {
  local rt name
  for rt in docker podman; do
    command -v "$rt" >/dev/null 2>&1 || continue
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      if [[ "$name" == *postgres* || "$name" == *pg-* || "$name" == ragent-postgres ]]; then
        echo "${rt}:${name}"
        return 0
      fi
    done < <(list_running_containers "$rt")
  done
  return 1
}

print_container_hint() {
  warn "当前运行的容器（供核对 PG_CONTAINER）："
  for rt in docker podman; do
    command -v "$rt" >/dev/null 2>&1 || continue
    local lines
    lines="$(list_running_containers "$rt")"
    if [[ -n "$lines" ]]; then
      echo "  [$rt]"
      echo "$lines" | sed 's/^/    /'
    fi
  done
}

run_doctor() {
  echo ""
  info "项目根: ${ROOT}"
  info "迁移目录: ${DB_DIR}"

  if [[ ! -f "$ROOT/scripts/db-migrate.sh" ]]; then
    fail "缺少 scripts/db-migrate.sh，请在仓库根目录 git pull origin master"
  fi
  if [[ ! -x "$ROOT/scripts/db-migrate.sh" ]]; then
    warn "脚本无执行位，可运行: chmod +x scripts/db-migrate.sh"
  fi
  if [[ ! -d "$DB_DIR" ]]; then
    fail "缺少数据库目录 ${DB_DIR}（是否在错误目录执行？应在 SWT-JOB 仓库根）"
  fi
  if ! grep -q 'db|migrate|sql' "$ROOT/server.sh" 2>/dev/null; then
    warn "当前 server.sh 没有 db 子命令 → 请 git pull，或用: bash scripts/db-migrate.sh status"
  fi

  load_env

  if container_running "$PG_CONTAINER" >/dev/null; then
    ok "Postgres 容器 ${PG_CONTAINER} 正在运行"
    resolve_psql
    if run_psql -c "SELECT 1" >/dev/null 2>&1; then
      ok "psql 连接成功（库 ${PGDATABASE}）"
    else
      fail "容器在运行但 psql 连不上，请检查 PGUSER/PGDATABASE/PGPASSWORD（可在 .env 设置）"
    fi
    return 0
  fi

  warn "未找到运行中的容器: ${PG_CONTAINER}"
  print_container_hint

  local guessed
  if guessed="$(guess_postgres_container)"; then
    PSQL_RT="${guessed%%:*}"
    PG_CONTAINER="${guessed#*:}"
    warn "尝试自动匹配: ${PSQL_RT} / ${PG_CONTAINER}"
    PSQL_MODE=container
    if run_psql -c "SELECT 1" >/dev/null 2>&1; then
      ok "用 ${PG_CONTAINER} 连接成功。建议在 .env 加: PG_CONTAINER=${PG_CONTAINER}"
      return 0
    fi
  fi

  if command -v psql >/dev/null 2>&1 && PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" >/dev/null 2>&1; then
    ok "本机 psql 连接 ${PGHOST}:${PGPORT} 成功"
    return 0
  fi

  echo ""
  fail "无法连接数据库。请先 ./server.sh infra，再 ./server.sh db doctor；或设置 .env 里 PG_CONTAINER=你的postgres容器名"
}

container_running() {
  local name="$1"
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$name"; then
    echo docker
    return 0
  fi
  if command -v podman >/dev/null 2>&1 && podman ps --format '{{.Names}}' 2>/dev/null | grep -qx "$name"; then
    echo podman
    return 0
  fi
  return 1
}

PSQL_MODE=""
PSQL_RT=""

resolve_psql() {
  local rt
  if rt="$(container_running "$PG_CONTAINER")"; then
    PSQL_MODE=container
    PSQL_RT="$rt"
    return 0
  fi
  local guessed
  if guessed="$(guess_postgres_container)"; then
    PSQL_RT="${guessed%%:*}"
    PG_CONTAINER="${guessed#*:}"
    PSQL_MODE=container
    info "使用 Postgres 容器: ${PG_CONTAINER}（可在 .env 设置 PG_CONTAINER 固定）"
    return 0
  fi
  if command -v psql >/dev/null 2>&1; then
    PSQL_MODE=local
    return 0
  fi
  print_container_hint
  fail "找不到 psql，且容器 ${PG_CONTAINER} 未运行。请先: ./server.sh infra  →  ./server.sh db doctor"
}

run_psql() {
  local args=("$@")
  if [[ "$PSQL_MODE" == container ]]; then
    "${PSQL_RT}" exec -i "$PG_CONTAINER" psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "${args[@]}"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 "${args[@]}"
  fi
}

run_psql_file() {
  local file="$1"
  if [[ "$PSQL_MODE" == container ]]; then
    "${PSQL_RT}" exec -i "$PG_CONTAINER" psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 < "$file"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$file"
  fi
}

run_psql_scalar() {
  run_psql -tAc "$1" | tr -d '[:space:]'
}

ensure_migration_table() {
  local bootstrap="$DB_DIR/000_schema_migration.sql"
  [[ -f "$bootstrap" ]] || fail "缺少 $bootstrap"
  run_psql_file "$bootstrap" >/dev/null
}

migration_recorded() {
  local id="$1"
  local n
  n="$(run_psql_scalar "SELECT COUNT(*) FROM t_schema_migration WHERE id = '${id}'")"
  [[ "$n" == "1" ]]
}

record_migration() {
  local id="$1" file="$2"
  run_psql -c "INSERT INTO t_schema_migration (id, source_file) VALUES ('${id}', '${file}') ON CONFLICT (id) DO NOTHING;" >/dev/null
}

# 结构检测：历史上手动跑过 SQL 但未写入记录表时使用
detect_migration_applied() {
  local id="$1"
  case "$id" in
    upgrade_v1.0_to_v1.1)
      [[ "$(run_psql_scalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='t_knowledge_document_chunk_log' AND column_name='persist_duration'")" == "1" ]]
      ;;
    upgrade_v1.1_to_v1.2)
      [[ "$(run_psql_scalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='t_message' AND column_name='thinking_content'")" == "1" ]]
      ;;
    upgrade_v1.2_to_v1.3)
      [[ "$(run_psql_scalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='t_message' AND column_name='resources_json'")" == "1" ]]
      ;;
    upgrade_v1.3_to_v1.4)
      [[ "$(run_psql_scalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='t_referral_deal'")" == "1" ]]
      ;;
    upgrade_v1.4_to_v1.5)
      [[ "$(run_psql_scalar "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='t_sample_question' AND column_name='answer'")" == "1" ]]
      ;;
    *)
      return 1
      ;;
  esac
}

list_upgrade_files() {
  find "$DB_DIR" -maxdepth 1 -name 'upgrade_v*.sql' -type f | sort
}

migration_id_from_path() {
  basename "$1" .sql
}

print_status() {
  ensure_migration_table

  local files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(list_upgrade_files)

  if [[ ${#files[@]} -eq 0 ]]; then
    warn "在 $DB_DIR 下未找到 upgrade_v*.sql"
    return 0
  fi

  echo ""
  printf "  %-28s %-10s %-10s %s\n" "迁移脚本" "记录表" "结构检测" "说明"
  printf "  %-28s %-10s %-10s %s\n" "----------------------------" "----------" "----------" "--------"

  local pending=0 unregistered=0

  for f in "${files[@]}"; do
    local id file_name recorded detected state note
    id="$(migration_id_from_path "$f")"
    file_name="$(basename "$f")"

    if migration_recorded "$id"; then
      recorded="${GREEN}已登记${NC}"
      detected="${DIM}—${NC}"
      state="${GREEN}✓ 已完成${NC}"
      note=""
    else
      recorded="${YELLOW}未登记${NC}"
      if detect_migration_applied "$id"; then
        detected="${GREEN}已存在${NC}"
        state="${YELLOW}需 sync${NC}"
        note="结构已有，执行 db sync 登记即可"
        unregistered=$((unregistered + 1))
      else
        detected="${RED}缺失${NC}"
        state="${RED}待 up${NC}"
        note="执行 db up 会跑此脚本"
        pending=$((pending + 1))
      fi
    fi

    echo -e "  ${file_name}  ${recorded}  ${detected}  ${state}  ${DIM}${note}${NC}"
  done

  echo ""
  if [[ "$PSQL_MODE" == container ]]; then
    info "连接: ${PSQL_RT} 容器 ${PG_CONTAINER} / 库 ${PGDATABASE}"
  else
    info "连接: ${PGHOST}:${PGPORT} / 库 ${PGDATABASE}"
  fi

  if [[ $unregistered -gt 0 ]]; then
    warn "${unregistered} 个迁移已在库中存在但未登记 → 运行: ./server.sh db sync"
  fi
  if [[ $pending -gt 0 ]]; then
    warn "${pending} 个迁移尚未执行 → 运行: ./server.sh db up"
  fi
  if [[ $pending -eq 0 && $unregistered -eq 0 ]]; then
    ok "所有 upgrade 脚本均已登记完成。"
  fi
  echo ""
}

apply_pending() {
  local dry_run="${1:-false}"
  ensure_migration_table

  local files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(list_upgrade_files)

  local applied=0
  for f in "${files[@]}"; do
    local id
    id="$(migration_id_from_path "$f")"
    if migration_recorded "$id"; then
      continue
    fi
    if detect_migration_applied "$id"; then
      warn "跳过 ${id}（结构已存在，请先 db sync 登记）"
      continue
    fi
    if [[ "$dry_run" == true ]]; then
      info "[dry-run] 将执行: $(basename "$f")"
      applied=$((applied + 1))
      continue
    fi
    info "执行: $(basename "$f") ..."
    run_psql_file "$f"
    record_migration "$id" "$(basename "$f")"
    ok "完成: ${id}"
    applied=$((applied + 1))
  done

  if [[ $applied -eq 0 ]]; then
    ok "没有需要执行的迁移。"
  fi
}

sync_detected() {
  ensure_migration_table
  local files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(list_upgrade_files)

  local n=0
  for f in "${files[@]}"; do
    local id
    id="$(migration_id_from_path "$f")"
    if migration_recorded "$id"; then
      continue
    fi
    if detect_migration_applied "$id"; then
      record_migration "$id" "$(basename "$f")"
      ok "已登记（未重跑 SQL）: ${id}"
      n=$((n + 1))
    fi
  done
  if [[ $n -eq 0 ]]; then
    info "没有「已存在但未登记」的迁移。"
  fi
}

main() {
  local cmd="${1:-status}"
  shift || true

  if [[ "$cmd" == help || "$cmd" == -h || "$cmd" == --help ]]; then
    usage
    exit 0
  fi

  if [[ "$cmd" == doctor || "$cmd" == diag ]]; then
    run_doctor
    exit 0
  fi

  load_env
  resolve_psql

  case "$cmd" in
    status|st|ls|"")
      print_status
      ;;
    up|migrate|apply)
      local dry=false
      for arg in "$@"; do
        [[ "$arg" == "--dry-run" || "$arg" == -n ]] && dry=true
      done
      if [[ "$dry" == true ]]; then
        apply_pending true
      else
        apply_pending false
        echo ""
        print_status
      fi
      ;;
    sync|register)
      sync_detected
      echo ""
      print_status
      ;;
    *)
      fail "未知子命令: ${cmd}。运行 ./scripts/db-migrate.sh help"
      ;;
  esac
}

main "$@"
