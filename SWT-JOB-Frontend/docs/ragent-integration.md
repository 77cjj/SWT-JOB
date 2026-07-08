# Ragent 融入 SWT Next 架构

## 路由对照（URL 保持不变）

| React Router（已弃用） | Next.js 页面 / 组件 |
|------------------------|---------------------|
| `/login` | [`src/pages/login.tsx`](../src/pages/login.tsx) → `HostedLoginPage` |
| `/chat` | [`src/pages/chat/index.tsx`](../src/pages/chat/index.tsx) |
| `/chat/:sessionId` | [`src/pages/chat/[sessionId].tsx`](../src/pages/chat/[sessionId].tsx) |
| `/admin`, `/admin/*` | [`src/pages/admin/[[...slug]].tsx`](../src/pages/admin/[[...slug]].tsx) → `AdminRagentShell` |
| `*`（未匹配） | 由 `AdminRagentShell` / Next 404 处理 |

### `/admin/*` 片段映射（`slug` 为 `[[...slug]]` 捕获段）

| 路径 | slug 片段 |
|------|-----------|
| `/admin/dashboard` | `dashboard` |
| `/admin/knowledge` | `knowledge` |
| `/admin/knowledge/:kbId` | `knowledge`, `:kbId` |
| `/admin/knowledge/:kbId/docs/:docId` | `knowledge`, `:kbId`, `docs`, `:docId` |
| `/admin/intent-tree` | `intent-tree` |
| `/admin/intent-list` | `intent-list` |
| `/admin/intent-list/:id/edit` | `intent-list`, `:id`, `edit` |
| `/admin/ingestion` | `ingestion` |
| `/admin/traces` | `traces` |
| `/admin/traces/:traceId` | `traces`, `:traceId` |
| `/admin/settings` | `settings` |
| `/admin/sample-questions` | `sample-questions` |
| `/admin/mappings` | `mappings` |
| `/admin/users` | `users` |

## 架构要点

- **唯一路由真源**：Next `pages`；不再使用 `RouterProvider`。
- **外壳**：聊天 / 登录 / 后台通过 [`HostedChatPage`](../src/components/ragent/HostedChatPage.tsx)、`HostedLoginPage`、`HostedAdminPage` 套用 SWT `DesktopLayout` / `MobileLayout`（若适用）。
- **共享**：[`RagentProviders`](../src/components/ragent/RagentProviders.tsx) 提供 ErrorBoundary、Toast、初始化 `auth` / `theme`（hosted 模式不写 `body[data-app=ragent]`）。
- **鉴权**：[`src/lib/ragent/guards.tsx`](../src/lib/ragent/guards.tsx) 中 `RequireAuth` / `RequireAdmin` / `RedirectIfAuth`（客户端重定向）。

## 手工回归清单（chat / admin / login）

见 [ragent-qa-checklist.md](./ragent-qa-checklist.md)。

## 环境变量

- `NEXT_PUBLIC_RAGENT_API_BASE_URL`：Ragent 后端 API 基地址（见 ragent `api.ts`）。
- `NEXT_PUBLIC_RAGENT_BYPASS_AUTH`：设为 `true` 时仅在开发环境跳过真实登录校验（生产务必关闭或不设置）。
