#!/usr/bin/env bash
# 按 APP_ENV 初始化/校验数据库（建库 → schema → migrate → admin）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
DB_DIR="${DB_DIR:-$ROOT/SWT-JOB-Backend/resources/database}"
SCHEMA_SQL="$DB_DIR/schema_pg.sql"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
info()  { echo -e "${BLUE}[db-bootstrap]${NC} $*"; }
ok()    { echo -e "${GREEN}[db-bootstrap]${NC} $*"; }
warn()  { echo -e "${YELLOW}[db-bootstrap]${NC} $*" >&2; }
fail()  { echo -e "${RED}[db-bootstrap]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
按环境引导数据库（不会无确认地删库）

用法:
  ./scripts/db-bootstrap-env.sh
  ./server.sh db bootstrap

.env 关键变量:
  APP_ENV=staging|production     默认 staging
  PGDATABASE=ragent              staging 建议 ragent；生产建议 ragent_prod
  PG_CONTAINER=ragent-postgres
  ADMIN_PASSWORD=...             bootstrap 结束会 ensure-admin

生产隔离建议:
  1) 生产用独立库名: PGDATABASE=ragent_prod
  2) 更稳妥：独立 Postgres 容器 + 独立数据卷（见 docs/DB_ENV_ISOLATION.md）
  3) 变更前先 ./server.sh db backup
EOF
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set +u
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE" 2>/dev/null || true
    set +a
    set -u
  fi
  PGHOST="${PGHOST:-127.0.0.1}"
  PGPORT="${PGPORT:-5432}"
  PGUSER="${PGUSER:-postgres}"
  PGPASSWORD="${PGPASSWORD:-postgres}"
  APP_ENV="${APP_ENV:-staging}"
  case "$APP_ENV" in
    production|prod)
      APP_ENV=production
      PGDATABASE="${PGDATABASE:-ragent_prod}"
      ;;
    *)
      APP_ENV=staging
      PGDATABASE="${PGDATABASE:-ragent}"
      ;;
  esac
  PG_CONTAINER="${PG_CONTAINER:-ragent-postgres}"
}

detect_psql_mode() {
  PSQL_MODE=""
  PSQL_RT=""
  for rt in docker podman; do
    command -v "$rt" >/dev/null 2>&1 || continue
    if "$rt" inspect "$PG_CONTAINER" >/dev/null 2>&1; then
      PSQL_MODE=container
      PSQL_RT="$rt"
      return 0
    fi
  done
  for rt in docker podman; do
    command -v "$rt" >/dev/null 2>&1 || continue
    local name
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      if [[ "$name" == *postgres* || "$name" == ragent-postgres ]]; then
        PG_CONTAINER="$name"
        PSQL_MODE=container
        PSQL_RT="$rt"
        return 0
      fi
    done < <("$rt" ps --format '{{.Names}}' 2>/dev/null || true)
  done
  command -v psql >/dev/null 2>&1 || fail "找不到 Postgres"
  PSQL_MODE=host
}

run_psql_db() {
  local db="$1"
  local sql="$2"
  if [[ "$PSQL_MODE" == container ]]; then
    "$PSQL_RT" exec -i -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
      psql -U "$PGUSER" -d "$db" -v ON_ERROR_STOP=1 -Atc "$sql"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$db" -v ON_ERROR_STOP=1 -Atc "$sql"
  fi
}

run_psql_file() {
  local db="$1"
  local file="$2"
  if [[ "$PSQL_MODE" == container ]]; then
    "$PSQL_RT" exec -i -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
      psql -U "$PGUSER" -d "$db" -v ON_ERROR_STOP=1 <"$file"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$db" -v ON_ERROR_STOP=1 -f "$file"
  fi
}

load_env
detect_psql_mode

info "APP_ENV=${APP_ENV} → database=${PGDATABASE} container=${PG_CONTAINER}"
if [[ "$APP_ENV" == production ]]; then
  warn "当前为 PRODUCTION 引导：只会 CREATE DATABASE / 补表，不会 DROP"
fi

# 1) 建库（若不存在）
EXISTS="$(run_psql_db postgres "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" | tr -d '[:space:]' || true)"
if [[ "$EXISTS" != "1" ]]; then
  info "创建数据库 ${PGDATABASE} ..."
  run_psql_db postgres "CREATE DATABASE ${PGDATABASE}"
  ok "已创建 ${PGDATABASE}"
else
  ok "数据库已存在: ${PGDATABASE}"
fi

# 2) 若无 t_user 则灌 schema（绝不在已有表时重跑 schema，避免误伤）
HAS_USER="$(run_psql_db "$PGDATABASE" "SELECT to_regclass('public.t_user') IS NOT NULL" | tr -d '[:space:]' || true)"
if [[ "$HAS_USER" != "t" && "$HAS_USER" != "true" ]]; then
  [[ -f "$SCHEMA_SQL" ]] || fail "缺少 ${SCHEMA_SQL}"
  warn "未检测到 t_user，将执行 schema_pg.sql（仅空库）"
  run_psql_file "$PGDATABASE" "$SCHEMA_SQL"
  ok "schema 已应用"
else
  ok "已检测到 t_user，跳过全量 schema（防误删）"
fi

# 3) 迁移
info "执行 ./server.sh db up ..."
PGDATABASE="$PGDATABASE" PG_CONTAINER="$PG_CONTAINER" bash "$ROOT/scripts/db-migrate.sh" up

# 4) admin
if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  info "确保 admin 账号..."
  PGDATABASE="$PGDATABASE" bash "$ROOT/scripts/ensure-admin-user.sh"
else
  warn "未设置 ADMIN_PASSWORD，跳过 admin 创建。稍后执行:"
  warn "  ADMIN_PASSWORD='你的强密码' ./server.sh db ensure-admin"
fi

ok "bootstrap 完成: APP_ENV=${APP_ENV} PGDATABASE=${PGDATABASE}"
info "请确认后端 .env 中 PGDATABASE=${PGDATABASE} 后重启: ./server.sh restart backend --build"
