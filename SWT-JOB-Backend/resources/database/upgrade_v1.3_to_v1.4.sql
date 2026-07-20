-- Add Google OAuth subject id for t_user (v1.3 -> v1.4)

ALTER TABLE t_user ADD COLUMN IF NOT EXISTS google_sub VARCHAR(128);

COMMENT ON COLUMN t_user.google_sub IS 'Google 账号 sub，用于 OAuth 登录';

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_google_sub ON t_user (google_sub)
    WHERE google_sub IS NOT NULL AND deleted = 0;
