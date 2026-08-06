# 数据库环境隔离（Staging / Production）

当前单机 ECS 常见风险：调试时 `docker volume` / 重跑 schema / 指错库，把用户数据清空。上线前用 **库名隔离**（最低成本），需要更强隔离再用 **独立容器+数据卷**。

> 说明：意图树 seed、upgrade SQL **不会删除 `t_user`**。若 `t_user` 为空，多半是连错库、重建了 Postgres 数据卷，或误跑了全量 `schema_pg.sql` 到非空环境。本仓库 bootstrap **仅在没有 `t_user` 时**才灌 schema。

## 方案 A（推荐起步）：同一 Postgres，两个库

| 环境 | `.env` |
|------|--------|
| 调试/预发 | `APP_ENV=staging` `PGDATABASE=ragent` |
| 正式上线 | `APP_ENV=production` `PGDATABASE=ragent_prod` |

```bash
# 1) 编辑 /root/SWT-JOB/.env
APP_ENV=staging
PGDATABASE=ragent
ADMIN_PASSWORD='先设一个强密码'

# 2) 引导当前环境库（建库→缺表才灌 schema→migrate→admin）
./server.sh db bootstrap

# 3) 备份
./server.sh db backup

# 上线前另建生产库（改 .env 后）
APP_ENV=production
PGDATABASE=ragent_prod
ADMIN_PASSWORD='生产强密码'
./server.sh db bootstrap
./server.sh restart backend --build --force
```

后端始终只连 `.env` 里的 `PGDATABASE`，避免脚本和 jar 各连各的。

## 方案 B（更稳）：独立 Postgres 容器 + 独立卷

```bash
# 生产容器示例（与 ragent-postgres 并列，勿复用同一 volume）
docker run -d --name ragent-postgres-prod --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD='强密码' \
  -e POSTGRES_DB=ragent_prod \
  -v ragent-pg-data-prod:/var/lib/postgresql/data \
  -p 127.0.0.1:5433:5432 \
  postgres:16

# .env
APP_ENV=production
PG_CONTAINER=ragent-postgres-prod
PGDATABASE=ragent_prod
PGPASSWORD='强密码'
```

## 日常命令

```bash
./server.sh db                 # 迁移状态
./server.sh db up              # 补齐 upgrade
./server.sh db bootstrap       # 按 APP_ENV 引导
./server.sh db ensure-admin    # 重建/重置 admin（需 ADMIN_PASSWORD）
./server.sh db backup          # pg_dump 到 backups/
./server.sh db seed-intents    # 只动意图树，不动用户表
```

## 管理员账号

```bash
# 空库或 admin 丢了：
ADMIN_PASSWORD='你的强密码' ./server.sh db ensure-admin

# 登录：用户名 admin + 上面密码
# 入口：站点登录后访问 /admin
```

可选后门（仅应急，与 DB admin 无关）：

```env
DEV_ADMIN_USERNAME=Admin
DEV_ADMIN_PASSWORD=另一个强密码
```

## 上线检查清单

1. `.env` 中 `APP_ENV=production` 且 `PGDATABASE=ragent_prod`（或生产容器）
2. `./server.sh db backup` 成功
3. `./server.sh db ensure-admin` 后能登录 `/admin`
4. Google：`GOOGLE_CLIENT_ID` + `GOOGLE_TOKENINFO_PROXY_URL=https://swtjob.vercel.app/api/auth/google-tokeninfo`
5. 不要在生产库上重跑会 DROP/重建 volume 的操作；schema 全量脚本只用于空库
