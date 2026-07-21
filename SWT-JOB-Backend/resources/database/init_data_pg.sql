-- PostgreSQL Initial Data for Ragent

INSERT INTO t_user (id, username, password, role, avatar, create_time, update_time, deleted)
VALUES (2001523723396308993, 'admin', 'admin', 'admin', 'https://static.deepseek.com/user-avatar/G_6cuD8GbD53VwGRwisvCsZ6', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

INSERT INTO t_user (id, username, password, role, avatar, create_time, update_time, deleted)
VALUES (2001523723396308994, 'demo', 'demo2026', 'user', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON CONFLICT (id) DO NOTHING;
