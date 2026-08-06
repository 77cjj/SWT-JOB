#!/usr/bin/env bash
# 一键灌入 SWT 意图树到 Postgres（可重复执行）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SERVER_ENV_FILE:-$ROOT/.env}"
DB_MIGRATE="$ROOT/scripts/db-migrate.sh"
PY_SEED="$ROOT/scripts/seed_swt_intent_tree.py"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[seed-intent]${NC} $*"; }
ok()    { echo -e "${GREEN}[seed-intent]${NC} $*"; }
warn()  { echo -e "${YELLOW}[seed-intent]${NC} $*" >&2; }
fail()  { echo -e "${RED}[seed-intent]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
一键写入 SWT 意图树（约 80+ 节点，覆盖文档/选岗/签证/落地/生活/交通/回国/羊毛/岗位/系统）

用法:
  ./scripts/seed-swt-intent-tree.sh
  ./scripts/seed-swt-intent-tree.sh --kb-id <主知识库ID>
  ./scripts/seed-swt-intent-tree.sh --kb-id <主KB> --deals-kb-id <羊毛KB>
  ./scripts/seed-swt-intent-tree.sh --dry-run          # 只打印 SQL
  ./scripts/seed-swt-intent-tree.sh --keep-demo        # 不禁用旧演示意图树

等价:
  ./server.sh db seed-intents

说明:
  - 可重复执行：会软删除 create_by=seed-swt-intent 的旧节点再插入
  - 未传 --kb-id 时自动取 t_knowledge_base 中最早一条未删除知识库
  - 名称含「羊毛/deal/refer」的知识库优先用作 deals KB
  - 执行后请重启后端以刷新意图缓存: ./server.sh restart backend
EOF
}

KB_ID=""
DEALS_KB_ID=""
DRY_RUN=false
DISABLE_DEMO=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --kb-id) KB_ID="${2:-}"; shift 2 ;;
    --deals-kb-id) DEALS_KB_ID="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --keep-demo) DISABLE_DEMO=false; shift ;;
    *) fail "未知参数: $1（见 --help）" ;;
  esac
done

[[ -f "$PY_SEED" ]] || fail "缺少 ${PY_SEED}"

# 优先较新的 python3.x（脚本兼容 3.6+；部分 ECS 默认 python3 过旧）
pick_python() {
  local cand
  for cand in python3.12 python3.11 python3.10 python3.9 python3.8 python3.7 python3.6 python3; do
    command -v "$cand" >/dev/null 2>&1 || continue
    if "$cand" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 6) else 1)' 2>/dev/null; then
      echo "$cand"
      return 0
    fi
  done
  return 1
}
PYTHON_BIN="$(pick_python)" || fail "需要 Python >= 3.6（当前 python3 过旧或未安装）。可 yum/apt 安装 python3，或用 conda/pyenv。"
info "使用 Python: ${PYTHON_BIN} ($("${PYTHON_BIN}" -c 'import sys; print("%d.%d.%d" % sys.version_info[:3])'))"

# 复用 db-migrate 的连接探测（导出函数太难，直接 source 部分逻辑）
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
  # 猜 postgres 容器
  for rt in docker podman; do
    command -v "$rt" >/dev/null 2>&1 || continue
    local name
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      if [[ "$name" == *postgres* || "$name" == ragent-postgres || "$name" == swt-dev-pg ]]; then
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
  fail "找不到 Postgres（容器 ${PG_CONTAINER} 或本机 psql）。先 ./server.sh infra 或设置 PG_CONTAINER"
}

run_psql_scalar() {
  local sql="$1"
  if [[ "$PSQL_MODE" == container ]]; then
    "$PSQL_RT" exec -i -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
      psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -Atc "$sql"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -Atc "$sql"
  fi
}

run_psql_file() {
  local file="$1"
  if [[ "$PSQL_MODE" == container ]]; then
    "$PSQL_RT" exec -i -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
      psql -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 <"$file"
  else
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$file"
  fi
}

load_env
detect_psql_mode
info "数据库连接: mode=${PSQL_MODE} container=${PG_CONTAINER:--} db=${PGDATABASE}"

# 探测知识库
if [[ -z "$KB_ID" ]]; then
  KB_ID="$(run_psql_scalar "SELECT id FROM t_knowledge_base WHERE deleted=0 ORDER BY create_time ASC NULLS LAST, id ASC LIMIT 1" | tr -d '[:space:]' || true)"
fi
if [[ -z "$DEALS_KB_ID" ]]; then
  DEALS_KB_ID="$(run_psql_scalar "SELECT id FROM t_knowledge_base WHERE deleted=0 AND (name ILIKE '%羊毛%' OR name ILIKE '%deal%' OR name ILIKE '%refer%' OR collection_name ILIKE '%deal%') ORDER BY create_time ASC NULLS LAST LIMIT 1" | tr -d '[:space:]' || true)"
fi

KB_COL=""
DEALS_COL=""
if [[ -n "$KB_ID" ]]; then
  KB_COL="$(run_psql_scalar "SELECT collection_name FROM t_knowledge_base WHERE id='${KB_ID}' AND deleted=0 LIMIT 1" | tr -d '[:space:]' || true)"
  info "主知识库: id=${KB_ID} collection=${KB_COL:-}"
else
  warn "未找到知识库：TOPIC 节点将不带 kb_id（可稍后在后台批量编辑）"
fi
if [[ -n "$DEALS_KB_ID" ]]; then
  DEALS_COL="$(run_psql_scalar "SELECT collection_name FROM t_knowledge_base WHERE id='${DEALS_KB_ID}' AND deleted=0 LIMIT 1" | tr -d '[:space:]' || true)"
  info "薅羊毛知识库: id=${DEALS_KB_ID} collection=${DEALS_COL:-}"
else
  warn "未单独识别薅羊毛 KB（名称含 羊毛/deal/refer），deals 节点将回退到主知识库（可忽略，或稍后 --deals-kb-id）"
  DEALS_KB_ID="$KB_ID"
  DEALS_COL="$KB_COL"
fi

PY_ARGS=(--print-sql)
[[ -n "$KB_ID" ]] && PY_ARGS+=(--kb-id "$KB_ID")
[[ -n "$DEALS_KB_ID" ]] && PY_ARGS+=(--deals-kb-id "$DEALS_KB_ID")
[[ -n "$KB_COL" ]] && PY_ARGS+=(--kb-collection "$KB_COL")
[[ -n "$DEALS_COL" ]] && PY_ARGS+=(--deals-kb-collection "$DEALS_COL")
[[ "$DISABLE_DEMO" == true ]] && PY_ARGS+=(--disable-demo)

TMP_SQL="$(mktemp /tmp/swt-intent-seed.XXXXXX.sql)"
trap 'rm -f "$TMP_SQL"' EXIT

"${PYTHON_BIN}" "$PY_SEED" "${PY_ARGS[@]}" >"$TMP_SQL"
COUNT="$("${PYTHON_BIN}" "$PY_SEED" --count)"
info "将写入 ${COUNT} 个意图节点"

if [[ "$DRY_RUN" == true ]]; then
  cat "$TMP_SQL"
  ok "dry-run 完成（未写入数据库）"
  exit 0
fi

info "执行 SQL..."
run_psql_file "$TMP_SQL"

ACTIVE="$(run_psql_scalar "SELECT COUNT(*) FROM t_intent_node WHERE deleted=0 AND create_by='seed-swt-intent'" | tr -d '[:space:]')"
ok "已写入/刷新意图节点: ${ACTIVE} 条（create_by=seed-swt-intent）"
warn "请重启后端以刷新意图缓存: ./server.sh restart backend"
warn "管理后台查看: /admin/intent-tree"
if [[ -z "$KB_ID" ]]; then
  warn "未绑定知识库：请在意图树里给 TOPIC 节点补 kbId，否则 KB 检索叶子会无效"
fi
