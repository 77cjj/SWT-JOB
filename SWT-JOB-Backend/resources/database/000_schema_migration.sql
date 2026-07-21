-- 迁移版本记录表（由 scripts/db-migrate.sh 自动维护，请勿手动删改已执行记录）

CREATE TABLE IF NOT EXISTS t_schema_migration (
    id          VARCHAR(128) PRIMARY KEY,
    applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_file VARCHAR(255)
);

COMMENT ON TABLE t_schema_migration IS '数据库 upgrade 脚本执行记录';
