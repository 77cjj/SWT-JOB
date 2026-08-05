-- ragent v1.6 -> v1.7：薅羊毛项目 AI 问答开关（仿知识库 enabled）

ALTER TABLE t_referral_deal ADD COLUMN IF NOT EXISTS ai_enabled SMALLINT DEFAULT 1;
COMMENT ON COLUMN t_referral_deal.ai_enabled IS '是否纳入 AI 问答知识库：1 是 0 否';

CREATE INDEX IF NOT EXISTS idx_referral_deal_ai_enabled ON t_referral_deal (ai_enabled, published, deleted);

UPDATE t_referral_deal SET ai_enabled = 1 WHERE ai_enabled IS NULL;
