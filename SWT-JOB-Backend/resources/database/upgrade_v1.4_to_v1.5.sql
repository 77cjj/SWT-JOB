-- ragent v1.4 -> v1.5：示例对话（用户问 + 草拟 AI 答）

ALTER TABLE t_sample_question ADD COLUMN IF NOT EXISTS answer TEXT;
ALTER TABLE t_sample_question ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE t_sample_question ADD COLUMN IF NOT EXISTS pinned SMALLINT DEFAULT 0;

COMMENT ON COLUMN t_sample_question.answer IS '草拟的 AI 回答（访客可浏览）';
COMMENT ON COLUMN t_sample_question.sort_order IS '排序（越小越靠前）';
COMMENT ON COLUMN t_sample_question.pinned IS '置顶 1/0';
