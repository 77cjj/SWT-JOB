# 管理员与 Google 登录

## Google 登录两条报错

浏览器里 `[GSI_LOGGER]: Failed to open popup window` 往往会出现 **两条**（OAuth 与 GSI select 各一条），原因是 **弹窗模式** 被拦截（Safari、Chrome 隐私、广告插件、Dialog 内 iframe 等）。

站点已改为 **redirect 模式**：点击 Google 按钮会 **整页跳转** 到 Google，再回到 `/auth/google-complete`，不再依赖 popup。

请确认 [Google Cloud Console](https://console.cloud.google.com/) → OAuth 客户端：

- **JavaScript 来源**：`https://swtjob.vercel.app`
- **重定向 URI**（GIS redirect）：`https://swtjob.vercel.app/api/auth/google-callback`

## 数据库管理员 `admin` 密码

**不要把密码写进 Git 或发给聊天机器人。** 在 ECS 的 `/root/SWT-JOB/.env` 里设置后执行：

```bash
ADMIN_PASSWORD='你的强密码' ./scripts/set-admin-password.sh
./server.sh restart backend --force
```

然后用用户名 `admin` + 新密码在管理端登录。

## 备用 dev-admin（可选）

在 `.env` 配置（不配置则 **禁用** 原来的 Admin/Admin 硬编码）：

```bash
DEV_ADMIN_USERNAME=Admin
DEV_ADMIN_PASSWORD=你的强密码
```

登录后 Sa-Token 用户 id 为 `dev-admin`，管理后台可用（与数据库 `admin` 用户是两套）。

## 新用户免费 AI 问答

- 新 **Google 注册** 用户默认 **3 次** 免费问答（`NEW_USER_FREE_CHAT_QUOTA`，默认 3）。
- 老用户 `free_chat_remaining` 为 NULL → **不限次**。
- `admin` 角色不限次。

数据库迁移：

```bash
./server.sh db up
# 或 psql 执行 resources/database/upgrade_v1.5_to_v1.6.sql
```
