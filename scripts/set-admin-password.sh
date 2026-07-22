#!/usr/bin/env bash
# 修改数据库中 username=admin 的登录密码（明文存储，与当前 AuthService 一致）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-${ADMIN_DB_PASSWORD:-}}"

if [[ -z "$ADMIN_PASSWORD" ]]; then
  echo "请设置环境变量 ADMIN_PASSWORD（或 ADMIN_DB_PASSWORD），勿写入 Git。" >&2
  echo "示例: ADMIN_PASSWORD='你的强密码' $0" >&2
  exit 1
fi

PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
export PGPASSWORD
psql -h 127.0.0.1 -U postgres -d ragent -v ON_ERROR_STOP=1 <<SQL
UPDATE t_user SET password = '${ADMIN_PASSWORD//\'/''}', update_time = CURRENT_TIMESTAMP
WHERE username = '${ADMIN_USERNAME//\'/''}' AND deleted = 0;
SQL

echo "已更新用户「${ADMIN_USERNAME}」的密码（请确认 psql 返回 UPDATE 1）。"
