-- 可选：为 RAG 增加薅羊毛意图与术语映射（在已有库执行一次；ID 可按需调整）
-- 使用前请确认 t_knowledge_base 中已有「SWT薅羊毛」或对应 collection 的知识库，并在后台将意图节点 kb_id / collection_name 改为实际值。

INSERT INTO t_query_term_mapping (id, source_term, target_term, enabled, deleted)
VALUES
  ('9100000000000000001', '羊毛', '薅羊毛 refer 开户奖励', 1, 0),
  ('9100000000000000002', 'refer', '邀请链接 薅羊毛', 1, 0),
  ('9100000000000000003', '开户奖励', '银行 bonus 薅羊毛', 1, 0),
  ('9100000000000000004', 'kalshi', 'Kalshi 预测市场 refer', 1, 0),
  ('9100000000000000005', 'chime', 'Chime 银行 refer', 1, 0)
ON CONFLICT (id) DO NOTHING;

-- 示例：薅羊毛 DOMAIN / TOPIC 意图（需手动绑定 kb_id 与 collection_name）
-- INSERT INTO t_intent_node (...) VALUES (...);
