#!/usr/bin/env bash
# 备份当前 PGDATABASE 到 backups/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
OUT_DIR="${DB_BACKUP_DIR:-$ROOT/backups}"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'
info()  { echo -e "${BLUE}[db-backup]${NC} $*"; }
ok()    { echo -e "${GREEN}[db-backup]${NC} $*"; }
fail()  { echo -e "${RED}[db-backup]${NC} $*" >&2; exit 1; }

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

load_env
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${OUT_DIR}/${APP_ENV}-${PGDATABASE}-${STAMP}.sql.gz"

info "备份 ${PGDATABASE} → ${FILE}"

if command -v docker >/dev/null 2>&1 && docker inspect "$PG_CONTAINER" >/dev/null 2>&1; then
  docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
    pg_dump -U "$PGUSER" -d "$PGDATABASE" --no-owner --no-acl \
    | gzip -c >"$FILE"
elif command -v pg_dump >/dev/null 2>&1; then
  PGPASSWORD="$PGPASSWORD" pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --no-owner --no-acl \
    | gzip -c >"$FILE"
else
  fail "需要 docker 容器 ${PG_CONTAINER} 或本机 pg_dump"
fi

ok "备份完成: ${FILE} ($(du -h "$FILE" | awk '{print $1}'))"
echo "$FILE"
