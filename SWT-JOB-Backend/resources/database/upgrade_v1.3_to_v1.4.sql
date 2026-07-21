-- ragent v1.3 -> v1.4：薅羊毛 / Refer 项目（管理员可编辑）

CREATE TABLE IF NOT EXISTS t_referral_deal (
    id                  VARCHAR(64) PRIMARY KEY,
    site_rebate_usd     DECIMAL(10, 2),
    site_rebate_label_zh VARCHAR(255),
    site_rebate_label_en VARCHAR(255),
    program_json        TEXT NOT NULL,
    sort_order          INT DEFAULT 0,
    published           SMALLINT DEFAULT 1,
    create_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted             SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_referral_deal_published ON t_referral_deal (published, deleted);
COMMENT ON TABLE t_referral_deal IS '薅羊毛官方项目（含本站返现与实操说明 JSON）';
