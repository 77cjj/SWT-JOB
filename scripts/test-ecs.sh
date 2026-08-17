#!/usr/bin/env bash
# 不连真实阿里云：用假 workbench 验证 ecs.sh 参数、超时、危险命令拦截与 JSON 解析。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FAKE="$TMP/bin"
mkdir -p "$FAKE"

cat >"$FAKE/workbench" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cmd="${1:-}"
shift || true
if [[ "$cmd" == "version" ]]; then
  echo "workbench v0.0.0-test"
  exit 0
fi
if [[ "$cmd" == "list" ]]; then
  echo '{"instances":[{"instance_id":"i-bp-test","region_id":"cn-hangzhou","status":"Running"}]}'
  exit 0
fi
if [[ "$cmd" == "exec" ]]; then
  remote=""
  timeout=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -c|--command) remote="$2"; shift 2 ;;
      --timeout) timeout="$2"; shift 2 ;;
      *) shift ;;
    esac
  done
  mkdir -p "${TMPDIR:-/tmp}/ecs-test-last"
  printf '%s\n' "$timeout" >"${FAKE_STATE}/last-timeout"
  printf '%s\n' "$remote" >"${FAKE_STATE}/last-cmd"
  if [[ "$remote" == *"exit 7"* ]]; then
    echo '{"output":"failed-out","stderr":"failed-err","exit_code":7}'
    exit 7
  fi
  echo "{\"output\":\"ok:${remote}\\n\",\"stderr\":\"\",\"exit_code\":0}"
  exit 0
fi
echo "unexpected: $cmd" >&2
exit 90
EOF
chmod +x "$FAKE/workbench"

export PATH="$FAKE:$PATH"
export WORKBENCH_BIN="$FAKE/workbench"
export FAKE_STATE="$TMP/state"
mkdir -p "$FAKE_STATE"
export SWT_ECS_INSTANCE_ID="i-bp-test"
export SWT_ECS_REGION="cn-hangzhou"
export SWT_ECS_DEPLOY_PATH="/root/swt-job"
export HOME="$TMP/home"
mkdir -p "$HOME/.workbench"
printf '%s\n' '{"current":"default","profiles":{"default":{"mode":"AK","access_key_id":"LTAI-test"}}}' >"$HOME/.workbench/config.json"
chmod 600 "$HOME/.workbench/config.json"

ECS="$ROOT/scripts/ecs.sh"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "OK: $*"; }

out="$("$ECS" exec 'echo hello')"
[[ "$out" == *"ok:echo hello"* ]] || fail "exec JSON 未解析 stdout: $out"
pass "exec 解析 JSON stdout"

set +e
out="$("$ECS" exec 'exit 7' 2>"$TMP/err")"
code=$?
set -e
[[ "$code" -eq 7 ]] || fail "exit_code 未透传，得到 $code"
[[ "$(cat "$TMP/err")" == *"failed-err"* ]] || fail "stderr 未透传"
pass "exec 透传远程退出码 7"

set +e
"$ECS" exec 'rm -rf /' >/dev/null 2>"$TMP/err"
code=$?
set -e
[[ "$code" -ne 0 ]] || fail "危险命令应被拒绝"
[[ "$(cat "$TMP/err")" == *"破坏性"* ]] || fail "危险命令提示不对"
pass "危险命令默认拒绝"

"$ECS" --yes exec 'rm -rf /tmp/swt-safe-test' >/dev/null
pass "--yes 可覆盖危险命令检查"

"$ECS" --timeout 42 exec 'true' >/dev/null
[[ "$(cat "$FAKE_STATE/last-timeout")" == "42" ]] || fail "未转发 --timeout"
pass "转发 --timeout"

"$ECS" status >/dev/null
[[ "$(cat "$FAKE_STATE/last-cmd")" == *"./server.sh status"* ]] || fail "status 未调用 server.sh"
pass "status 进入远端仓库路径"

set +e
"$ECS" restart >/dev/null 2>"$TMP/err"
code=$?
set -e
[[ "$code" -ne 0 ]] || fail "restart 缺 --yes 应失败"
pass "restart 需要 --yes"

"$ECS" --yes restart >/dev/null
[[ "$(cat "$FAKE_STATE/last-cmd")" == *"restart backend --force"* ]] || fail "restart 命令不对"
pass "restart --yes 调用 server.sh"

"$ECS" doctor >/dev/null
pass "doctor 在假 CLI 下可运行"

echo "全部通过"
