-- ragent v1.7 -> v1.8：选岗计算器入库 + 站点菜单功能开关

-- 选岗计算器每次保存的岗位快照（参数化写入，payload 为校验后的 JSON）
CREATE TABLE IF NOT EXISTS t_compare_job_entry (
    id                  VARCHAR(64) PRIMARY KEY,
    client_job_id       VARCHAR(64),
    user_id             VARCHAR(64),
    job_title           VARCHAR(255) NOT NULL,
    company             VARCHAR(255),
    state_code          VARCHAR(8) NOT NULL,
    hourly_wage         NUMERIC(10, 2) NOT NULL,
    avg_hours_per_week  NUMERIC(8, 2),
    tipped              SMALLINT NOT NULL DEFAULT 0,
    average_tip         NUMERIC(10, 2),
    has_housing         SMALLINT NOT NULL DEFAULT 0,
    housing_cost_per_week NUMERIC(10, 2),
    second_job_hours    NUMERIC(8, 2),
    second_job_hourly_wage NUMERIC(10, 2),
    project_start_date  DATE,
    project_end_date    DATE,
    payload_json        TEXT NOT NULL,
    source              VARCHAR(32) NOT NULL DEFAULT 'compare_form',
    create_time         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted             SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_compare_job_user ON t_compare_job_entry (user_id, deleted, create_time DESC);
CREATE INDEX IF NOT EXISTS idx_compare_job_state ON t_compare_job_entry (state_code, deleted);
COMMENT ON TABLE t_compare_job_entry IS '选岗计算器用户提交的岗位快照';

-- 站点五大菜单开放开关（1=开放 0=维护遮罩）
CREATE TABLE IF NOT EXISTS t_site_feature_flag (
    feature_key     VARCHAR(64) PRIMARY KEY,
    enabled         SMALLINT NOT NULL DEFAULT 1,
    label_zh        VARCHAR(128),
    sort_order      INT NOT NULL DEFAULT 0,
    update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE t_site_feature_flag IS '站点菜单功能开关';

INSERT INTO t_site_feature_flag (feature_key, enabled, label_zh, sort_order) VALUES
    ('chat', 1, 'AI问答', 10),
    ('deals', 1, '薅羊毛', 20),
    ('compare', 1, '选岗计算器', 30),
    ('jobs', 0, '岗位情报', 40),
    ('docs', 0, 'SWT文档', 50)
ON CONFLICT (feature_key) DO NOTHING;
