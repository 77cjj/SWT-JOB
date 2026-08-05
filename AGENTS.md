# AGENTS.md

## Cursor Cloud specific instructions

This is a monorepo with two products:

- `SWT-JOB-Frontend/` — Next.js 15 app ("SWT Helper"), the primary product, deployed on Vercel. This is what the cloud environment is set up for.
- `SWT-JOB-Backend/` — Spring Boot 3 / Java 17 RAG service ("Ragent"). Heavy: needs Docker + Postgres, Redis, RocketMQ, RustFS, Milvus, and an AI provider key (`BAILIAN_API_KEY`). It is **not** set up in the cloud environment (no Docker, and it requires external secrets). The frontend does not need a local backend — see below.

### Frontend (SWT-JOB-Frontend) — the working dev target

- Package manager is **npm** (there is a `package-lock.json`). Dependencies are installed by the startup update script; you normally don't need to reinstall.
- Standard commands live in `SWT-JOB-Frontend/package.json` scripts. Run them from `SWT-JOB-Frontend/`:
  - Dev server: `npm run dev` (serves on `http://127.0.0.1:3000`, host is pinned to `127.0.0.1`, dist dir is `.next-dev`).
  - Lint: `npm run lint`. Note: the repo currently has pre-existing lint errors unrelated to environment setup; a clean `lint` is not required for the app to run, and Vercel builds skip ESLint (`eslint.ignoreDuringBuilds: true` in `next.config.mjs`).
  - Typecheck: `npx tsc --noEmit` (passes clean; `next.config.mjs` sets `typescript.ignoreBuildErrors: false`).
  - Build (production): `npm run build`.
- No secrets/env vars are required to run the frontend in dev. `ragent/config/runtimeEnv.ts` falls back to the public backend `https://ragent.nageoffer.com` in non-production, and Sanity content falls back to local MDX under `src/pages/docs/**`. Missing `NEXT_PUBLIC_RAGENT_API_BASE_URL` only throws in `NODE_ENV=production`.
- The `@` import alias points to `SWT-JOB-Frontend/ragent/` (see `next.config.mjs` webpack alias), not to `src/`. Keep this in mind when tracing imports.
- Auth / register / login (`/register`, `/login`, `/chat`) call the Ragent backend. In dev that is the remote public backend, so do NOT create test accounts there. For a self-contained local demo of core functionality, use the SWT job picker at `/compare` (add a job → net-income calculation with federal/state tax, tips, housing). This flow runs entirely in the browser with no backend.
- The `/api/ragent/:path*` rewrite to the ECS backend lives in `vercel.json` and is Vercel-only; it is not applied by `next dev`.

### Repo-level helper scripts (mostly for servers, not the cloud VM)

- `./dev.sh` (root) wraps `scripts/dev.sh` and can start frontend/backend/infra, but its `all`/`backend`/`infra` modes require Docker + Java 17 and will fail in this environment. `./dev.sh frontend` just runs `npm install` + `npm run dev` in `SWT-JOB-Frontend/`. Prefer running the frontend npm scripts directly.
- `server.sh`, `scripts/auto-pull-backend.sh`, and the `.github/workflows/deploy-backend.yml` flow target the Aliyun ECS host; they are not relevant to local/cloud frontend development.
