-- 新注册用户免费 AI 问答次数（NULL = 不限，兼容老用户）

ALTER TABLE t_user ADD COLUMN IF NOT EXISTS free_chat_remaining INT;
COMMENT ON COLUMN t_user.free_chat_remaining IS '剩余免费 AI 问答次数；NULL 表示不限；新 Google 用户默认 3';
