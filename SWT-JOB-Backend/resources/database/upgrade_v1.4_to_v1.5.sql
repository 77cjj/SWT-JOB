-- ragent v1.4 -> v1.5：AI 免费配额 + Google 登录绑定

ALTER TABLE t_user
    ADD COLUMN IF NOT EXISTS ai_quota_total INT NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS ai_quota_used INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64);

COMMENT ON COLUMN t_user.ai_quota_total IS 'AI 免费提问总次数';
COMMENT ON COLUMN t_user.ai_quota_used IS '已使用的 AI 提问次数';
COMMENT ON COLUMN t_user.google_sub IS 'Google 账号 subject，用于 OAuth 绑定';

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_google_sub
    ON t_user (google_sub)
    WHERE google_sub IS NOT NULL AND deleted = 0;

ALTER TABLE t_user
    ALTER COLUMN avatar TYPE VARCHAR(512);

UPDATE t_user
SET ai_quota_total = COALESCE(ai_quota_total, 3),
    ai_quota_used = COALESCE(ai_quota_used, 0)
WHERE deleted = 0;
