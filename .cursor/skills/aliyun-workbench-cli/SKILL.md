---
name: aliyun-workbench-cli
description: 用阿里云 Workbench CLI 从本机操作 SWT-JOB 所在 Linux ECS（无公网 SSH 也能 exec / 传文件 / 看日志 / 健康检查）。在用户提到 ECS、阿里云、workbench、云服务器、远端日志、线上后端重启、拉 jar、没有公网 IP 时使用。
---

# SWT-JOB × 阿里云 Workbench CLI

## 心智模型

本机 Cursor Agent 不 SSH 到 `120.55.91.39`，改走 Workbench 控制面：`workbench exec` 一条命令、JSON + 退出码判断成败。前端仍在 Vercel；只有 **Spring Boot 后端 + 中间件** 在 ECS。

对照：GitHub Actions 部署仍用公网 SSH Secret（分钟级流水线）；本机 Agent 排障用 Workbench（秒级 `exec`，默认超时 120s；编译重启要 900s 量级）。

## 先读仓库包装，不要手写 workbench

优先：

```bash
./scripts/ecs.sh doctor
./scripts/ecs.sh status
./scripts/ecs.sh health
./scripts/ecs.sh logs 120
./scripts/ecs.sh exec 'df -h && free -m'
```

需要实例 ID：仓库根 `.env.ecs`（从 `.env.ecs.example` 复制）或环境变量 `SWT_ECS_INSTANCE_ID`。AccessKey **只**在本机 `~/.workbench/config.json`。

## Agent 硬规则

1. **禁止** `workbench connect` / `./scripts/ecs.sh connect`：交互 PTY，Agent 会挂死。人类自己登录再用。
2. **禁止**把 AK/SK、`~/.workbench/config.json`、SSH 私钥写进仓库或提交。
3. 每次 `exec` 是**独立 shell**：要 `cd` 必须写进同一条 `-c`，例如 `cd /root/swt-job && ./server.sh status`。
4. 默认 `workbench exec --timeout` 是 **30s**；包装脚本把日常命令提到 120s，`pull-restart` 提到 900s。编译 jar 不要用 30s。
5. `restart` / `pull-restart` 必须带 `--yes`，且只在用户明确要求部署/重启时执行。
6. 看退出码：包装脚本会透传远程 `exit_code`。JSON 失败体是 `{ "code", "message" }`，不是 stdout。
7. 改代码仍在本机 git；ECS 上的权威发布路径仍是 **push `master` → Actions SSH deploy**。Workbench 用于验证、看日志、紧急重启，不要用 `upload` 覆盖 git 管理的源码当常规发布。

## 本机一次性开通（人类）

1. 已安装：`curl -fsSL https://workbench-cli.oss-cn-hangzhou.aliyuncs.com/install.sh | bash`
2. RAM 最小权限 + `workbench config`（不要用主账号 AK）
3. 实例是 Linux、云助手 Agent 在跑；安全组允许 Workbench 通道 `100.104.0.0/16` → TCP 22
4. `cp .env.ecs.example .env.ecs`，填实例 ID（杭州多为 `i-bp…`）
5. `./scripts/ecs.sh doctor` 再 `status`

## 何时用哪条通道

| 场景 | 通道 |
|------|------|
| 本机 Cursor 查 ECS 状态 / 日志 / 磁盘 | `./scripts/ecs.sh` |
| 合入 master 后的正式后端发布 | GitHub Actions `deploy-backend.yml` |
| 前端 | Vercel，不要碰 ECS |
| Cursor Cloud Agent（无本机 workbench 凭证） | 不要假装能连 ECS；用 CI 日志 / 让用户在本机跑 `ecs.sh` |

## 原始 CLI（包装不够用时）

```bash
workbench list ecs -r cn-hangzhou --output json
workbench exec -i "$SWT_ECS_INSTANCE_ID" -c 'cd /root/swt-job && ./server.sh status' --timeout 120 --output json
workbench download /root/swt-job/.server/logs/backend.log ./backend.log -i "$SWT_ECS_INSTANCE_ID"
```

官方：<https://help.aliyun.com/zh/ecs/user-guide/connect-to-an-instance-through-workbench-cli/>
