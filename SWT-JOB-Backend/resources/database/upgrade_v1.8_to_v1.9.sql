-- ragent v1.8 -> v1.9：薅羊毛项目评论

CREATE TABLE IF NOT EXISTS t_deal_comment (
    id              VARCHAR(64) PRIMARY KEY,
    deal_id         VARCHAR(64) NOT NULL,
    user_id         VARCHAR(64) NOT NULL,
    parent_id       VARCHAR(64),
    body            TEXT NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'visible',
    helpful_count   INT NOT NULL DEFAULT 0,
    dislike_count   INT NOT NULL DEFAULT 0,
    create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted         SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_deal_comment_deal ON t_deal_comment (deal_id, status, deleted, create_time DESC);
CREATE INDEX IF NOT EXISTS idx_deal_comment_parent ON t_deal_comment (parent_id, deleted);
COMMENT ON TABLE t_deal_comment IS '薅羊毛项目评论';
COMMENT ON COLUMN t_deal_comment.status IS 'visible | hidden';
