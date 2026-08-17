# Agent 约定（SWT-JOB）

## 仓库怎么拆

- `SWT-JOB-Frontend/`：Next.js，部署在 **Vercel**
- `SWT-JOB-Backend/`：Spring Boot，部署在 **阿里云 Linux ECS**
- `./server.sh`：只在 ECS（或本机复现服务器）上启停中间件与后端
- 正式后端发布：push `master` 且碰到后端文件 → `.github/workflows/deploy-backend.yml`（公网 SSH）

## 本机 vibecoding × Workbench CLI

本机已装阿里云 `workbench` 时，Agent **用 CLI 管 ECS，不要交互登录**。

1. 读 `.cursor/skills/aliyun-workbench-cli/SKILL.md`
2. 跑 `./scripts/ecs.sh doctor|status|health|logs`
3. 远程命令用 `./scripts/ecs.sh exec '…'`（独立 shell；`cd` 写进同一条命令）
4. 禁止 `workbench connect`（PTY 会卡住 Agent）
5. 禁止把 AccessKey、`~/.workbench/config.json`、SSH 私钥提交进 git

实例 ID 放 `.env.ecs`（模板：`.env.ecs.example`）。凭证：`workbench config` → `~/.workbench/config.json`（权限 0600）。

数量级：日常 `exec` 超时约 10^2 秒（包装默认 120s）；`pull-restart` 含 Maven 编译，超时约 10^3 秒（默认 900s）。官方 `workbench exec` 默认只有 30s，直接套编译会误判失败。

## Cursor Cloud 与本机 Cursor

| 环境 | 能不能 Workbench 直连这台 ECS |
|------|------------------------------|
| 用户 Mac 上的 Cursor | 能（本机 CLI + RAM 凭证） |
| Cursor Cloud Agent | 默认不能（跑在隔离 VM，没有 `~/.workbench`） |

Cloud Agent 验证后端：看 GitHub Actions 日志，或请用户在本机执行 `./scripts/ecs.sh` 把输出贴回来。

## 安全

- RAM 最小权限，不要主账号 AK（官方策略见 Workbench CLI 凭证文档）
- `ecs.sh restart` / `pull-restart` 必须 `--yes`
- 不要用 `upload` 当常规发版；发版走 git + Actions
