#!/usr/bin/env bash
# 确保数据库中存在可用的 admin 账号（空库 / 被清空后可一键重建）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
info()  { echo -e "${BLUE}[ensure-admin]${NC} $*"; }
ok()    { echo -e "${GREEN}[ensure-admin]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ensure-admin]${NC} $*" >&2; }
fail()  { echo -e "${RED}[ensure-admin]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
确保 / 重建管理员账号（username=admin）

用法:
  ADMIN_PASSWORD='你的强密码' ./scripts/ensure-admin-user.sh
  ./server.sh db ensure-admin          # 需已在 .env 设置 ADMIN_PASSWORD

说明:
  - 若 admin 不存在则插入；若已存在则更新密码并恢复 deleted=0、role=admin
  - 密码当前为明文存储（与 AuthService 一致）
  - 不会删除其它用户
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
  PGDATABASE="${PGDATABASE:-ragent}"
  PG_CONTAINER="${PG_CONTAINER:-ragent-postgres}"
  APP_ENV="${APP_ENV:-staging}"
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
  if command -v psql >/dev/null 2>&1; then
    PSQL_MODE=host
    return 0
  fi
  fail "找不到 Postgres（容器 ${PG_CONTAINER} 或本机 psql）"
}

run_psql() {
  local sql="$1"
  if [[ "$PSQL_MODE" == container ]]; then
    "$PSQL_RT" exec -i -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
      psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -Atc "$sql"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -Atc "$sql"
  fi
}

load_env
detect_psql_mode

ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-${ADMIN_DB_PASSWORD:-}}"
[[ -n "$ADMIN_PASSWORD" ]] || fail "请设置 ADMIN_PASSWORD，例如: ADMIN_PASSWORD='你的强密码' $0"

# 固定稳定 ID（与 init_data_pg.sql 一致），避免重复插入产生多个 admin
ADMIN_ID="${ADMIN_USER_ID:-2001523723396308993}"

# SQL escape
esc_user="${ADMIN_USERNAME//\'/\'\'}"
esc_pass="${ADMIN_PASSWORD//\'/\'\'}"
esc_id="${ADMIN_ID//\'/\'\'}"

info "环境 APP_ENV=${APP_ENV} db=${PGDATABASE} container=${PG_CONTAINER:--}"
info "写入管理员 username=${ADMIN_USERNAME}"

# 兼容尚未跑 upgrade 的旧库：只写基础列；扩展列用 DO 块尽量补
SQL=$(cat <<SQL
-- 基础列 upsert（按 username）
INSERT INTO t_user (id, username, password, role, avatar, create_time, update_time, deleted)
VALUES (
  '${esc_id}',
  '${esc_user}',
  '${esc_pass}',
  'admin',
  'https://avatars.githubusercontent.com/u/583231?v=4',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  0
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'admin',
  deleted = 0,
  update_time = CURRENT_TIMESTAMP;

-- 扩展字段（若存在则补齐）
DO \$\$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='t_user' AND column_name='account_status'
  ) THEN
    EXECUTE \$q\$UPDATE t_user SET account_status='active' WHERE username='${esc_user}'\$q\$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='t_user' AND column_name='official_verified'
  ) THEN
    EXECUTE \$q\$UPDATE t_user SET official_verified=1 WHERE username='${esc_user}'\$q\$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='t_user' AND column_name='free_chat_remaining'
  ) THEN
    EXECUTE \$q\$UPDATE t_user SET free_chat_remaining=NULL WHERE username='${esc_user}'\$q\$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='t_user' AND column_name='display_name'
  ) THEN
    EXECUTE \$q\$UPDATE t_user SET display_name='Admin' WHERE username='${esc_user}' AND (display_name IS NULL OR display_name='')\$q\$;
  END IF;
END
\$\$;

SELECT username || ' | role=' || role || ' | deleted=' || deleted::text
FROM t_user WHERE username='${esc_user}' LIMIT 1;
SQL
)

RESULT="$(run_psql "$SQL" | tr -d '\r')"
ok "管理员已就绪: ${RESULT}"
warn "请用该密码登录管理后台；勿把真实密码提交到 Git"
warn "登录入口: /admin （需先在前台用 admin 账号登录）"
