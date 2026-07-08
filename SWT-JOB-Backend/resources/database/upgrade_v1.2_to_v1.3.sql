-- ragent v1.2 -> v1.3 升级脚本
-- t_message 表：新增资源引用字段

ALTER TABLE t_message ADD COLUMN resources_json TEXT DEFAULT NULL;
