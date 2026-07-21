# PostgreSQL 脚本

| 文件 | 用途 |
|------|------|
| `schema_pg.sql` | 全新库完整建表 |
| `init_data_pg.sql` | 初始数据 |
| `upgrade_v*.sql` | 版本增量升级（按文件名顺序） |
| `000_schema_migration.sql` | 迁移记录表（由工具自动执行） |

## 推荐：用一条命令看状态 / 跑迁移

在项目根目录：

```bash
./server.sh db          # 查看哪些 upgrade 已跑、哪些未跑
./server.sh db up       # 执行所有「未登记且结构缺失」的 upgrade
./server.sh db sync     # 以前手动 psql 跑过、但未写记录表时，只登记不重复执行
```

或直接：

```bash
./scripts/db-migrate.sh status
./scripts/db-migrate.sh up
```

连接默认：`ragent-postgres` 容器 + 库 `ragent`（与 `server.sh` 一致）。可在 `.env` 里改 `PGUSER` / `PGPASSWORD` / `PGDATABASE` / `PG_CONTAINER`。
