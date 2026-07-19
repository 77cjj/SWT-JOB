# SWT-JOB

SWT-JOB is organized as a monorepo with separate frontend and backend projects.

## Structure

- `SWT-JOB-Frontend/`: Next.js frontend deployed by Vercel.
- `SWT-JOB-Backend/`: Spring Boot backend intended to run on ECS.
- `scripts/`: Local development and deployment helper scripts.
- `middleware.dockerfile`: Local middleware image definition.

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


