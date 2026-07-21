-- 岗位情报贡献、用户上传条目、文档投票、用户 moderation 字段

ALTER TABLE t_user ADD COLUMN IF NOT EXISTS official_verified SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE t_user ADD COLUMN IF NOT EXISTS account_status VARCHAR(32) NOT NULL DEFAULT 'active';
ALTER TABLE t_user ADD COLUMN IF NOT EXISTS restriction_note TEXT;
ALTER TABLE t_user ADD COLUMN IF NOT EXISTS display_name VARCHAR(128);
COMMENT ON COLUMN t_user.official_verified IS '1=官方认证 SWT 校友等';
COMMENT ON COLUMN t_user.account_status IS 'active | restricted | banned';

CREATE TABLE IF NOT EXISTS t_job_intel_contribution (
    id              VARCHAR(64) PRIMARY KEY,
    job_id          VARCHAR(64),
    submitter_id    VARCHAR(64) NOT NULL,
    state_code      VARCHAR(8),
    job_title       VARCHAR(255),
    hourly_wage     NUMERIC(10, 2),
    notes           TEXT NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',
    admin_summary   TEXT,
    published       SMALLINT NOT NULL DEFAULT 0,
    create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_job_intel_contrib_status ON t_job_intel_contribution (status, deleted);
COMMENT ON TABLE t_job_intel_contribution IS '用户提交的岗位情报贡献';

CREATE TABLE IF NOT EXISTS t_job_intel_document (
    id              VARCHAR(64) PRIMARY KEY,
    job_id          VARCHAR(64) NOT NULL,
    kind            VARCHAR(32) NOT NULL,
    title           VARCHAR(255),
    body            TEXT NOT NULL,
    uploader_id     VARCHAR(64) NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending',
    create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_job_intel_doc_job ON t_job_intel_document (job_id, status, deleted);
COMMENT ON TABLE t_job_intel_document IS '岗位细则 / 雇主发布信息（用户上传）';

CREATE TABLE IF NOT EXISTS t_doc_poll_vote (
    id              VARCHAR(64) PRIMARY KEY,
    poll_id         VARCHAR(64) NOT NULL,
    user_id         VARCHAR(64) NOT NULL,
    option_id       VARCHAR(64) NOT NULL,
    work_state      VARCHAR(8),
    program_year    VARCHAR(8),
    voted_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (poll_id, user_id)
);
COMMENT ON TABLE t_doc_poll_vote IS '文档社区投票（如二工 poll）';
