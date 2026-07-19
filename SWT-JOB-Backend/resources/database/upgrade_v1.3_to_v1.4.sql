-- ragent v1.3 -> v1.4：用户扩展资料 + 薅羊毛亲测评论

CREATE TABLE IF NOT EXISTS t_user_profile (
    id                  VARCHAR(20)  NOT NULL PRIMARY KEY,
    user_id             VARCHAR(20)  NOT NULL,
    display_name        VARCHAR(64),
    avatar_color        VARCHAR(16),
    bio                 TEXT,
    program_year        VARCHAR(8),
    work_state          VARCHAR(8),
    job_title           VARCHAR(128),
    phone               VARCHAR(32),
    email               VARCHAR(128),
    wechat              VARCHAR(64),
    profile_visibility  VARCHAR(16)  NOT NULL DEFAULT 'consent',
    badge               VARCHAR(32),
    contribution_count  INT          NOT NULL DEFAULT 0,
    create_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted             SMALLINT     DEFAULT 0,
    CONSTRAINT uk_user_profile_user UNIQUE (user_id)
);
COMMENT ON TABLE t_user_profile IS '用户 SWT 扩展资料与隐私设置';
COMMENT ON COLUMN t_user_profile.profile_visibility IS 'consent=经同意才披露 public=主页直接公开';

CREATE TABLE IF NOT EXISTS t_deal_experience (
    id              VARCHAR(20)  NOT NULL PRIMARY KEY,
    user_id         VARCHAR(20)  NOT NULL,
    program_id      VARCHAR(64)  NOT NULL,
    edition_id      VARCHAR(64),
    reported_at     DATE         NOT NULL,
    body_zh         TEXT         NOT NULL,
    body_en         TEXT         NOT NULL,
    detail_json     JSONB,
    create_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT     DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_deal_exp_program ON t_deal_experience (program_id, edition_id);
CREATE INDEX IF NOT EXISTS idx_deal_exp_user ON t_deal_experience (user_id);
COMMENT ON TABLE t_deal_experience IS '薅羊毛亲测经历评论';
