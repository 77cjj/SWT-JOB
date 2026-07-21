# 文档内容调研（SWT / 小红书等）

本站文档改写时，优先参考**可公开访问**的一手/二手资料，而不是让模型「凭空写攻略」。

## 小红书

- **没有**为小红书单独配置的 Cursor Skill 或 MCP；也**不建议**用未授权爬虫批量抓笔记（合规与稳定性都差）。
- 可行做法：
  1. 人工在小红书搜索 `SWT`、`赴美带薪实习`、`J-1` 等关键词，筛选高赞笔记；
  2. 把**事实性信息**（时间窗口、签证类型、常见坑）整理进本站 MDX，并注明「经验分享，以 Sponsor / 官方为准」；
  3. 在 Cursor 里用 **Web 搜索** 或浏览器打开公开网页（机构官网、国务院 SWT 说明、Go Abroad 等 PDF）作交叉验证。
- 公开参考示例（非 exhaustive）：
  - [白日梦出差报告 · 美国打工度假/SWT 说明](https://daydreambusinesstrip.com/usa-work-travel-full-guide/)
  - [Go Abroad USA · SWT 2026 说明 PDF](https://www.goabroadusa.com/wp-content/uploads/2025/10/SWT-2026-Program-Briefing_.pdf)

## 写作风格

- 用表格 + 短句 + 「适用场景」，少用大段形容词和「首先其次综上所述」。
- 金额、日期写「约 / 参考」，并链到本站相关文档（签证、机票、选岗计算器）。

## 后续

若你方有**已授权**的笔记导出或 Sponsor 官方文案，可放入 `SWT-JOB-Frontend/src/pages/docs/` 对应目录，再让 Agent 按 `docs/docs-semantic-rewrite-master-prompt.md` 做结构化，而不是直接粘贴全文。
