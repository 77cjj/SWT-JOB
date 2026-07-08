# RAG Resources 后端对接文档

## 背景与目标

当前前端已经具备以下能力：

- 消费流式事件 `event: resources`
- 历史消息接口资源回显
- 在回答下方渲染 `Resources` 区块并支持外链跳转

后端目标是：当回答命中 RAG 文档时，返回可展示的资源引用（Resources），并保证流式与历史接口都可读到同一份资源数据。

## 本项目现状（代码映射）

已存在接口与关键实现：

- 流式聊天接口：`GET /rag/v3/chat`，控制器 `RAGChatController`
- SSE 事件发送：`SseEmitterSender`
- 流式事件处理：`StreamChatEventHandler`
- SSE 事件枚举：`SSEEventType`（当前仅 `meta/message/finish/done/cancel/reject`）
- 历史消息接口：`GET /conversations/{conversationId}/messages`，控制器 `ConversationController`
- 历史消息返回对象：`ConversationMessageVO`（当前无 `resources` 字段）
- 消息存储实体：`ConversationMessageDO`（当前无 `resources` 字段）

结论：后端尚未具备资源事件推送与资源持久化回显能力，需要补充事件、模型字段和存储字段。

## 接口改造要求

### 1) 流式聊天接口

- 路径：`GET /rag/v3/chat?...`
- 协议：`SSE`
- 新增事件：`event: resources`

建议时机：

- 检索阶段完成后立即发送一次（优先）
- 若 rerank 或后续阶段补充了资源，可再次发送（前端会去重合并）

SSE 事件示例：

```text
event: resources
data: {"resources":[{"title":"美国入境政策（2024）","url":"https://example.com/us-entry-policy","docId":"123","kbId":"9","chunkId":"c-1","score":0.91}]}
```

### 2) 历史消息接口

- 路径：`GET /conversations/{conversationId}/messages`
- 对 `assistant` 消息增加资源字段，保证刷新/切会话后可回显

前端兼容字段名（任一即可）：

- `resources`
- `references`
- `citations`

建议后端统一使用 `resources`。

## 资源字段契约（建议）

每个资源项结构：

```json
{
  "title": "string, 可选，文档标题",
  "url": "string, 推荐必填，可点击外链",
  "snippet": "string, 可选，命中片段摘要",
  "score": "number, 可选，相关度分数",
  "kbId": "string|number, 可选",
  "docId": "string|number, 可选",
  "chunkId": "string|number, 可选"
}
```

说明：

- 前端使用 `url` 作为跳转目标
- 若 `url` 为空，该资源不会展示
- 多次返回重复资源，前端会按 `url`（或备用键）去重

## 最小可用改造（MVP）

上线最小条件：

1. `/rag/v3/chat` SSE 增加 `event: resources`，且 `data.resources[*].url` 有值
2. `/conversations/{conversationId}/messages` 返回 `assistant` 消息的 `resources`（同结构）

## 推荐后端落地方案（按本项目实现）

### A. SSE 事件扩展

1. 在 `SSEEventType` 新增：
   - `RESOURCES("resources")`
2. 定义资源载荷 DTO（示例命名）：
   - `ResourceItemPayload`
   - `ResourcesPayload`（字段：`List<ResourceItemPayload> resources`）
3. 在流式处理链路中发送事件：
   - 可在检索结果可用后调用 `sender.sendEvent(SSEEventType.RESOURCES.value(), payload)`
   - 发送 1 次或多次均可，前端会合并去重

### B. 历史消息回显扩展

1. 数据库层为消息表新增资源字段（建议 JSON）：
   - 表：`t_message`
   - 字段建议：`resources_json`（`TEXT`/`JSON`，按数据库类型选择）
2. 实体层：
   - `ConversationMessageDO` 增加 `resourcesJson` 字段
3. 业务对象与接口返回：
   - `ConversationMessageBO` 增加 `resources`
   - `ConversationMessageVO` 增加 `resources`
4. 存取逻辑：
   - 写入：assistant 消息入库时同步写入 `resources_json`
   - 读取：`listMessages` 时反序列化到 `resources`

### C. 兼容与容错建议

- 仅对 `assistant` 消息返回 `resources`，`user` 消息可为空
- 反序列化失败时降级为空数组，不影响主消息返回
- 输出前过滤 `url` 为空的资源项，避免无效展示

## 联调验收标准

1. 新对话中命中 RAG 文档时，回答下方出现 `Resources` 区块，点击可打开外链
2. 刷新页面后，同条回答仍显示 `Resources`
3. 流式过程中收到多次 `resources` 事件，不会重复展示同一条链接

## 建议测试用例

- 单条资源：单次 `resources` 事件 + 历史回显一致
- 多条资源：同一回答返回多个 URL，展示顺序符合后端输出
- 重复资源：多次事件包含重复 URL，前端最终仅展示一条
- 空 URL：资源项被过滤，不出现在前端
- 无资源回答：不发送 `resources` 或返回空数组，不影响回答文本
