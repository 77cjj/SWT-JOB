# SWT-JOB

SWT-JOB is organized as a monorepo with separate frontend and backend projects.

## Structure

- `SWT-JOB-Frontend/`: Next.js frontend deployed by Vercel.
- `SWT-JOB-Backend/`: Spring Boot backend intended to run on ECS.
- `scripts/`: Local development and deployment helper scripts（含本机 `ecs.sh`：Workbench CLI 包装）。
- `.githooks/`: Local git hooks（提交前 / 推送前检查）.
- `middleware.dockerfile`: Local middleware image definition.

## Git hooks（本地门禁）

克隆后执行一次：

```bash
./scripts/setup-hooks.sh
```

| Hook | 做什么 | 干预 → 结果 |
|------|--------|-------------|
| `pre-commit` | 扫描疑似密钥；对暂存前端文件跑 eslint | 拦下坏提交；`SKIP_HOOKS=1` 可跳过 |
| `pre-push` | 前端变更 → `./scripts/check-frontend.sh`；后端变更 → `mvn compile` | 推送前拦住 Vercel/编译错误；`SKIP_FRONTEND_CHECK=1` 只跳过前端构建 |

因果链：本地 hooks → 少把坏代码推上远程 → CI / Vercel 更少红灯。CI 仍是最终门禁（hooks 可被跳过）。

## Auto-merge（少手动合 PR）

机制：`cursor/*` 分支开出的 PR 会自动贴 `automerge` 标签；当 Frontend Build / Backend Compile 通过且无冲突时，Actions 会 **squash 合入 `master`** 并尝试删分支。

- 想阻止某 PR 自动合入：加 `no-automerge` 标签，或保持 draft（去掉 `automerge` 在 cursor 分支上可能被下次 push 重新贴上）。
- 非 cursor 分支：手动加 `automerge` 标签即可走同一套流程。
- 仓库 Settings 建议开启：**Allow auto-merge**、**Automatically delete head branches**（本 workflow 也会尝试删分支）。

## Local AI × Workbench CLI（本机 Cursor）

后端在阿里云 Linux ECS 上。本机装了 [Workbench CLI](https://help.aliyun.com/zh/ecs/user-guide/connect-to-an-instance-through-workbench-cli/) 之后，Cursor Agent 用结构化 `exec`/`upload`/`download` 管实例，**不必**给实例开公网 SSH，也**不要**用交互式 `workbench connect`（会卡住 Agent）。

一次性：

```bash
# 已在 Mac 上安装 workbench 并执行过 workbench config 的可跳过安装
cp .env.ecs.example .env.ecs   # 填 SWT_ECS_INSTANCE_ID，文件已 gitignore
./scripts/ecs.sh doctor
./scripts/ecs.sh status
./scripts/ecs.sh health
./scripts/ecs.sh logs 80
```

约定见 `AGENTS.md` 与 `.cursor/skills/aliyun-workbench-cli/SKILL.md`。正式发版仍走下面的 GitHub Actions；Workbench 用于本机排障与健康检查。

凭证只存在本机 `~/.workbench/config.json`（0600）。请用 RAM 最小权限，不要用主账号 AccessKey。

## Deployment

Vercel is configured to use `SWT-JOB-Frontend` as the project root directory.
The backend should be deployed separately on ECS and exposed through an HTTPS API domain.

Production frontend environment variables should include:

```env
NEXT_PUBLIC_RAGENT_API_BASE_URL=https://api.example.com/api/ragent
NEXT_PUBLIC_RAGENT_BYPASS_AUTH=false
NEXT_PUBLIC_RAGENT_ALLOW_LOGIN_PAGE=true
```

Local secret files, build output, dependencies, raw source documents, and nested Git backups are intentionally ignored.

## Backend auto-pull (Aliyun cron)

Use `scripts/auto-pull-backend.sh` on the ECS host to poll GitHub and redeploy the backend when `SWT-JOB-Backend/` changes.

### Prerequisites on the server

1. Clone the repo and run `./server.sh fix` once.
2. Configure Git read access to GitHub (SSH deploy key recommended).
3. Ensure the cron user can run Java 17 and `./server.sh`.

### Install cron (every minute)

Replace `/path/to/swt-job` with your actual repo path on the server:

```bash
chmod +x /path/to/swt-job/scripts/auto-pull-backend.sh

crontab -e
```

Add:

```cron
* * * * * /path/to/swt-job/scripts/auto-pull-backend.sh
```

Logs: `/path/to/swt-job/.server/logs/auto-pull.log`

### Behavior

- Every run: `git fetch` (lightweight).
- Remote has **backend** changes: `git pull` + build + restart backend.
- Remote has **frontend-only** changes: `git pull` only, backend keeps running.
- Overlapping runs are skipped via `flock`.

### Manual test

```bash
/path/to/swt-job/scripts/auto-pull-backend.sh
tail -f /path/to/swt-job/.server/logs/auto-pull.log
```

### GitHub deploy key (one-time)

On the server:

```bash
ssh-keygen -t ed25519 -C "swt-job-deploy" -f ~/.ssh/swt-job-deploy -N ""
cat ~/.ssh/swt-job-deploy.pub
```

Add the public key in GitHub → repo → Settings → Deploy keys (read-only).

Then set the remote:

```bash
cd /path/to/swt-job
git remote set-url origin git@github.com:77cjj/swt-job.git
GIT_SSH_COMMAND='ssh -i ~/.ssh/swt-job-deploy -o IdentitiesOnly=yes' git fetch origin
```

If you use HTTPS instead, configure a credential helper or personal access token before enabling cron.

## Backend deploy via GitHub Actions (recommended)

Push to `master` with changes under `SWT-JOB-Backend/` triggers `.github/workflows/deploy-backend.yml`, which SSHs into Aliyun and runs:

```bash
./server.sh restart backend --pull --skip-update-check --force
```

Use **either** GitHub Actions **or** cron auto-pull, not both, unless you know they won't race.

### Step 1: Create an SSH key for GitHub Actions

On your **local machine** (not the server):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-actions-swt-job -N ""
```

- **Private key** (`github-actions-swt-job`) → GitHub Secrets (next step)
- **Public key** (`github-actions-swt-job.pub`) → Aliyun server `authorized_keys` (step 2)

This is **separate** from the Deploy Key used for `git pull` on the server.

### Step 2: Allow GitHub Actions to SSH into Aliyun

On the **Aliyun server**, as the deploy user (e.g. `root`):

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_ONE_LINE_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Paste the full line from `cat ~/.ssh/github-actions-swt-job.pub` (starts with `ssh-ed25519`).

Ensure the server security group allows **SSH (port 22)** from the internet (or restrict to GitHub Actions IP ranges if you prefer).

Test from local:

```bash
ssh -i ~/.ssh/github-actions-swt-job root@120.55.91.39
```

### Step 3: Add GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Example value | Required |
|-------------|---------------|----------|
| `ALIYUN_SSH_HOST` | `120.55.91.39` | yes |
| `ALIYUN_SSH_USER` | `root` | yes |
| `ALIYUN_SSH_KEY` | entire private key file (`-----BEGIN OPENSSH PRIVATE KEY-----` …) | yes |
| `ALIYUN_DEPLOY_PATH` | `/root/swt-job` (absolute path to repo on server) | yes |

For `ALIYUN_SSH_KEY`, copy the **whole** private key including header/footer lines.

### Step 4: Prepare the server once

```bash
cd /root/swt-job   # your ALIYUN_DEPLOY_PATH
./server.sh fix
git remote -v      # ensure git pull works (Deploy Key or HTTPS token)
```

### Step 5: Merge workflow and test

After merging `.github/workflows/deploy-backend.yml` to `master`:

1. **Actions** tab → **Deploy Backend to Aliyun** → **Run workflow** (manual test)
2. Or push a commit that touches `SWT-JOB-Backend/`

Check logs on the server:

```bash
tail -f /root/swt-job/.server/logs/backend.log
./server.sh status
```

### What triggers deployment

| Event | Deploy backend? |
|-------|-----------------|
| Push to `master` changing `SWT-JOB-Backend/**` | yes |
| Push only changing `SWT-JOB-Frontend/**` | no (Vercel handles frontend) |
| Manual **Run workflow** | yes |


