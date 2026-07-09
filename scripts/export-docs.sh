#!/usr/bin/env bash
# SWT-JOB 知识库文档一键导出脚本
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DOCS="$ROOT/SWT-JOB-Frontend/src/pages/docs"

DEFAULT_OUT="$HOME/Desktop/SWT-JOB-KB-Docs"
OUT_DIR="$DEFAULT_OUT"
OPEN_AFTER=false
USE_DATED=false
INCLUDE_ALL=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[export-docs]${NC} $*"; }
ok()    { echo -e "${GREEN}[export-docs]${NC} $*"; }
warn()  { echo -e "${YELLOW}[export-docs]${NC} $*"; }
fail()  { echo -e "${RED}[export-docs]${NC} $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
SWT-JOB 知识库文档导出脚本

用法:
  ./export-docs.sh [选项]

默认导出到桌面单个文件夹，便于批量上传到知识库后台。

导出内容（默认）:
  前端站点指南（src/pages/docs 下全部 .mdx → .md，平铺在同一目录）

选项:
  --out <目录>   自定义输出目录（默认 ~/Desktop/SWT-JOB-KB-Docs）
  --dated        在输出目录下再建时间戳子目录（避免覆盖旧导出）
  --all          额外包含 Frontend/docs、Backend/docs 等开发文档
  --open         导出完成后在 Finder 中打开目标目录
  -h, --help     显示帮助

示例:
  ./export-docs.sh
  ./export-docs.sh --open
  ./export-docs.sh --dated --open
  ./export-docs.sh --out ~/Downloads/swt-kb
EOF
}

strip_frontmatter() {
  awk '
    BEGIN { in_fm = 0; fm_done = 0 }
    NR == 1 && /^---[[:space:]]*$/ { in_fm = 1; next }
    in_fm && /^---[[:space:]]*$/ { in_fm = 0; fm_done = 1; next }
    in_fm { next }
    { print }
  ' "$1"
}

copy_markdown_file() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"

  case "$src" in
    *.mdx)
      strip_frontmatter "$src" >"$dest"
      ;;
    *.md)
      cp "$src" "$dest"
      ;;
    *)
      fail "不支持的文件类型: $src"
      ;;
  esac
}

export_flat() {
  local src_root="$1"
  local dest_root="$2"
  local label="$3"
  local name_fn="${4:-basename}"

  if [[ ! -d "$src_root" ]]; then
    warn "跳过 ${label}：目录不存在 ${src_root}"
    return 0
  fi

  local count=0
  while IFS= read -r -d '' file; do
    local out_name
    case "$name_fn" in
      basename)
        out_name="$(basename "${file%.*}").md"
        ;;
      path)
        local rel="${file#"$src_root"/}"
        out_name="${rel%.*}.md"
        out_name="${out_name//\//-}"
        ;;
      *)
        fail "未知的命名方式: $name_fn"
        ;;
    esac
    copy_markdown_file "$file" "$dest_root/$out_name"
    count=$((count + 1))
  done < <(find "$src_root" -type f \( -name '*.md' -o -name '*.mdx' \) ! -name '.*' -print0 | sort -z)

  ok "${label}: ${count} 个文件 → ${dest_root}"
}

export_dev_docs() {
  local dest="$1"
  local count=0

  while IFS= read -r -d '' file; do
    local prefix rel
    if [[ "$file" == "$ROOT/SWT-JOB-Frontend/docs/"* ]]; then
      prefix="frontend"
      rel="${file#"$ROOT/SWT-JOB-Frontend/docs/"}"
    elif [[ "$file" == "$ROOT/SWT-JOB-Backend/docs/"* ]]; then
      prefix="backend"
      rel="${file#"$ROOT/SWT-JOB-Backend/docs/"}"
    else
      continue
    fi
    local out_name="${prefix}-${rel%.*}.md"
    out_name="${out_name//\//-}"
    copy_markdown_file "$file" "$dest/$out_name"
    count=$((count + 1))
  done < <(
    find "$ROOT/SWT-JOB-Frontend/docs" "$ROOT/SWT-JOB-Backend/docs" \
      -type f \( -name '*.md' -o -name '*.mdx' \) ! -name '.*' -print0 2>/dev/null | sort -z
  )

  if [[ $count -gt 0 ]]; then
    ok "开发文档: ${count} 个文件 → ${dest}"
  fi
}

write_index() {
  local out="$1"
  local index="$out/导出清单.md"
  local total=0

  {
    echo "# SWT-JOB 知识库文档导出"
    echo ""
    echo "- 导出时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "- 项目路径: ${ROOT}"
    echo ""
    echo "## 文件清单"
    echo ""
    echo "| 文件名 | 大小 |"
    echo "| --- | ---: |"
  } >"$index"

  while IFS= read -r -d '' file; do
    local rel="${file#"$out"/}"
    [[ "$rel" == "导出清单.md" ]] && continue
    local size
    size="$(wc -c <"$file" | tr -d ' ')"
    echo "| ${rel} | ${size} B |" >>"$index"
    total=$((total + 1))
  done < <(find "$out" -maxdepth 1 -type f -name '*.md' ! -name '导出清单.md' -print0 | sort -z)

  {
    echo ""
    echo "共 **${total}** 个 Markdown 文件。"
    echo ""
    echo "## 上传建议"
    echo ""
    echo "1. 在管理后台进入目标知识库 → 文档管理 → 上传。"
    echo "2. 全选本目录下除本清单外的所有 .md 文件批量上传（文件名含分类前缀，如 intro-eligibility.md）。"
    echo "3. 上传后记得对每份文档执行「分块」以便检索。"
  } >>"$index"

  ok "索引文件: ${index}（${total} 篇）"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --out)
        [[ $# -ge 2 ]] || fail "--out 需要指定目录"
        OUT_DIR="$2"
        shift 2
        ;;
      --dated)
        USE_DATED=true
        shift
        ;;
      --all)
        INCLUDE_ALL=true
        shift
        ;;
      --open)
        OPEN_AFTER=true
        shift
        ;;
      -h|--help|help)
        usage
        exit 0
        ;;
      *)
        fail "未知参数: $1。运行 ./export-docs.sh --help 查看帮助。"
        ;;
    esac
  done
}

main() {
  parse_args "$@"

  local final_out="$OUT_DIR"
  if [[ "$USE_DATED" == "true" ]]; then
    final_out="$OUT_DIR/$(date '+%Y%m%d-%H%M%S')"
  fi

  info "开始导出文档..."
  info "输出目录: ${final_out}"

  rm -rf "$final_out"
  mkdir -p "$final_out"

  export_flat "$FRONTEND_DOCS" "$final_out" "SWT 站点指南" path

  if [[ "$INCLUDE_ALL" == "true" ]]; then
    export_dev_docs "$final_out"
  fi

  write_index "$final_out"

  echo ""
  ok "导出完成: ${final_out}"
  echo ""
  echo "  上传知识库: 打开上述目录，全选 .md 文件（可跳过 导出清单.md）上传即可"
  echo "  再次导出:   ./export-docs.sh"
  echo "  带时间戳:   ./export-docs.sh --dated"
  echo ""

  if [[ "$OPEN_AFTER" == "true" ]] && command -v open >/dev/null 2>&1; then
    open "$final_out"
  fi
}

main "$@"
