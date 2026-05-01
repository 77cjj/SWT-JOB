# Ragent 融合 — 手工回归清单

在发版前对以下路径与功能做快速验证（亮/暗主题各一遍更佳）。

## 登录 `/login`

- [ ] 未登录可打开登录页；已登录访问应跳到 `/chat`。
- [ ] 登录成功进入 `/chat`；错误提示正常。

## 聊天 `/chat`、`/chat/[sessionId]`

- [ ] 顶部为 SWT 统一导航；主题切换后聊天区视觉正常。
- [ ] 新建对话、切换会话、重命名、删除（若接口可用）。
- [ ] 发送消息、流式输出、停止生成、深度思考开关（若后端可用）。

## 管理后台 `/admin/*`

- [ ] 非管理员访问受限页应跳转到 `/chat`（在关闭 BYPASS 时验证）。
- [ ] 侧栏导航各入口可进入对应页；带 query 的项（如 ingestion `?tab=`）正常。
- [ ] `/admin` 空路径重定向到 `/admin/dashboard`。
- [ ] 知识库：`knowledge` → 文档列表 → 切片页动态段正确。
- [ ] 意图：`intent-tree`、`intent-list`、`intent-list/:id/edit`。
- [ ] 链路追踪列表与详情页 `/admin/traces/:traceId`。

## API

- [ ] `NEXT_PUBLIC_RAGENT_API_BASE_URL` 指向正确环境。
