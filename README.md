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

