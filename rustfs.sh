#!/usr/bin/env bash
# 仅启动 RustFS（不依赖 compose / yaml / scripts 目录）
set -euo pipefail

NAME="${RUSTFS_CONTAINER_NAME:-ragent-rustfs}"

if command -v nc >/dev/null 2>&1; then
  nc -z 127.0.0.1 9000 >/dev/null 2>&1 && { echo "RustFS 已在运行 (9000)"; exit 0; }
fi

podman rm -f "$NAME" >/dev/null 2>&1 || true

podman run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p 127.0.0.1:9000:9000 \
  -p 127.0.0.1:9001:9001 \
  -v ragent-rustfs-data:/data \
  docker.io/rustfs/rustfs:1.0.0-alpha.72 \
  --address :9000 \
  --console-enable \
  --access-key rustfsadmin \
  --secret-key rustfsadmin \
  /data

echo "RustFS 已启动: $NAME"
podman ps | grep "$NAME" || true
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:9000 || true
