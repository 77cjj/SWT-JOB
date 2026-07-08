# Ragent 接口契约联调清单（上线前）

用于前后端逐项联调，确认接口路径、方法、鉴权、返回结构一致。

## 通用约定

- API Base URL: `NEXT_PUBLIC_RAGENT_API_BASE_URL`
- 统一响应包装（前端当前假设）:
  - 成功: `{"code":"0","data":...}`
  - 失败: `{"code":"非0","message":"..."}`
- 鉴权头: `Authorization: <token>`

## 1) 鉴权与用户

- [ ] `POST /auth/login`
- [ ] `POST /auth/logout`
- [ ] `GET /user/me`
- [ ] `PUT /user/password`
- [ ] `GET /users`
- [ ] `POST /users`
- [ ] `PUT /users/{id}`
- [ ] `DELETE /users/{id}`

## 2) 会话与消息

- [ ] `GET /conversations`
- [ ] `GET /conversations/{conversationId}/messages`
- [ ] `PUT /conversations/{conversationId}`
- [ ] `DELETE /conversations/{conversationId}`
- [ ] `POST /conversations/messages/{messageId}/feedback`

## 3) 聊天流式（SSE）

- [ ] `GET /rag/v3/chat?question=...&conversationId=...&deepThinking=true|false`
- [ ] `POST /rag/v3/stop?taskId=...`
- [ ] SSE 事件类型与字段一致: `meta`、`message`、`finish`、`done`、`cancel`、`reject`、`resources`、`title`、`error`
- [ ] `meta` 至少返回: `conversationId`、`taskId`
- [ ] `finish` 支持: `messageId`、`title`

## 4) 知识库管理

- [ ] `GET /knowledge-base/chunk-strategies`
- [ ] `GET /knowledge-base`
- [ ] `GET /knowledge-base/{id}`
- [ ] `POST /knowledge-base`
- [ ] `PUT /knowledge-base/{id}`
- [ ] `DELETE /knowledge-base/{id}`

## 5) 文档与切片

- [ ] `GET /knowledge-base/{kbId}/docs`
- [ ] `GET /knowledge-base/docs/search`
- [ ] `POST /knowledge-base/{kbId}/docs/upload` (`multipart/form-data`)
- [ ] `GET /knowledge-base/docs/{docId}`
- [ ] `PUT /knowledge-base/docs/{docId}`
- [ ] `POST /knowledge-base/docs/{docId}/chunk`
- [ ] `PATCH /knowledge-base/docs/{docId}/enable?value=true|false`
- [ ] `DELETE /knowledge-base/docs/{docId}`
- [ ] `GET /knowledge-base/docs/{docId}/chunks`
- [ ] `POST /knowledge-base/docs/{docId}/chunks`
- [ ] `PUT /knowledge-base/docs/{docId}/chunks/{chunkId}`
- [ ] `DELETE /knowledge-base/docs/{docId}/chunks/{chunkId}`
- [ ] `PATCH /knowledge-base/docs/{docId}/chunks/{chunkId}/enable?value=true|false`
- [ ] `PATCH /knowledge-base/docs/{docId}/chunks/batch-enable?value=true|false`
- [ ] `GET /knowledge-base/docs/{docId}/chunk-logs`

## 6) 意图树

- [ ] `GET /intent-tree/trees`
- [ ] `POST /intent-tree`
- [ ] `PUT /intent-tree/{id}`
- [ ] `DELETE /intent-tree/{id}`
- [ ] `POST /intent-tree/batch/enable`
- [ ] `POST /intent-tree/batch/disable`
- [ ] `POST /intent-tree/batch/delete`

## 7) 问题映射

- [ ] `GET /mappings`
- [ ] `POST /mappings`
- [ ] `PUT /mappings/{id}`
- [ ] `DELETE /mappings/{id}`

## 8) 采集与管道

- [ ] `GET /ingestion/pipelines`
- [ ] `GET /ingestion/pipelines/{id}`
- [ ] `POST /ingestion/pipelines`
- [ ] `PUT /ingestion/pipelines/{id}`
- [ ] `DELETE /ingestion/pipelines/{id}`
- [ ] `GET /ingestion/tasks`
- [ ] `GET /ingestion/tasks/{id}`
- [ ] `GET /ingestion/tasks/{id}/nodes`
- [ ] `POST /ingestion/tasks`
- [ ] `POST /ingestion/tasks/upload` (`multipart/form-data`)

## 9) 追踪与看板

- [ ] `GET /rag/traces/runs`
- [ ] `GET /rag/traces/runs/{traceId}`
- [ ] `GET /rag/traces/runs/{traceId}/nodes`
- [ ] `GET /admin/dashboard/overview`
- [ ] `GET /admin/dashboard/performance`
- [ ] `GET /admin/dashboard/trends`

## 联调记录模板

- 环境:
  - FE: `<vercel-url>`
  - API: `<api-domain>`
  - 时间: `<yyyy-mm-dd hh:mm>`
- 通过项:
  - `<模块/接口>`
- 失败项:
  - `<接口 + 错误码 + 后端日志关键字>`
- 结论:
  - `<是否可发版>`
