# Stripe 密钥放哪里（SWT Helper / Vercel）

## 原则

| 密钥 | 前缀 | 放哪里 | 能否进 Git / 前端 bundle |
|------|------|--------|---------------------------|
| **可发布密钥** | `pk_test_` / `pk_live_` | 环境变量 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 可进前端（本来就会暴露在浏览器） |
| **私钥** | `sk_test_` / `sk_live_` | **仅** `STRIPE_SECRET_KEY`，只在 Vercel / 本地 `.env.local` | **禁止** `NEXT_PUBLIC_`，禁止提交 Git |
| **Webhook 签名** | `whsec_` | `STRIPE_WEBHOOK_SECRET` | 仅服务端 |

你在对话里贴的是 **pk_test_…**，属于可发布密钥，泄露风险低于 sk_，但仍建议在 Stripe Dashboard 确认是否仅用于测试环境。

**切勿**把 `sk_test_` / `sk_live_` 发在聊天、截图或代码仓库里。若已泄露，请在 Stripe Dashboard → Developers → API keys **Roll key**。

---

## Vercel 和云端 ECS 分别放什么？

市集 Stripe **全部跑在 Next.js（Vercel）**，Java 后端 **没有任何 Stripe 代码**，也 **不需要** 在阿里云 ECS 的 `.env` 里配 Stripe。

| 部署位置 | 要不要配 Stripe | 配什么 |
|----------|-----------------|--------|
| **Vercel**（`swtjob` 前端项目） | **要，线上必配** | 下面三个环境变量 **都放在这里** |
| **阿里云 ECS**（`SWT-JOB-Backend`） | **不要** | 与 Stripe 无关；继续只配数据库、Sa-Token、企业微信等 |
| **本机**（`npm run dev`） | 可选 | `SWT-JOB-Frontend/.env.local` 里同样三个变量 |

在 Vercel 打开：**你的前端 Project → Settings → Environment Variables → Add**，名称必须一字不差：

1. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → 值填 Stripe 里的 **Publishable key**（`pk_test_…`）
2. `STRIPE_SECRET_KEY` → 值填 **Secret key**（`sk_test_…`），**不要**勾选 Expose to Browser
3. `STRIPE_WEBHOOK_SECRET` → 值填你在 Dashboard 里为这个端点拿到的 **`whsec_…`**

Environment 建议至少勾选 **Production**；若预览域名也要测支付，Preview 里也加一套（可用同一套 test 密钥）。

改完变量后点 **Deployments → 最新一次 → Redeploy**，否则旧实例读不到新环境变量。

### 你拿到的 Webhook 签名（`whsec_`）放哪？

取决于这个 `whsec` 是从哪来的：

| 来源 | 放哪里 |
|------|--------|
| Stripe Dashboard → Webhooks → 端点 `https://swtjob.vercel.app/api/marketplace/stripe/webhook` → **Signing secret** | **只放 Vercel** 的 `STRIPE_WEBHOOK_SECRET`（Production） |
| 本机 `stripe listen --forward-to localhost:3000/...` 终端里打印的 `whsec_…` | **只放** `SWT-JOB-Frontend/.env.local`，**不要**写进 Vercel |

两种 `whsec_` **不是同一个值**：Dashboard 给线上 Vercel 用；`stripe listen` 给本地开发用。你在 Dashboard 已经建好线上 Webhook 的话，把那个 **Signing secret 填进 Vercel 即可**，ECS 不用填。

---

## 本地开发

在 **`SWT-JOB-Frontend/.env.local`**（该文件已在 `.gitignore`）：

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_你的可发布密钥
STRIPE_SECRET_KEY=sk_test_你的私钥
# 本地 webhook（见下）
STRIPE_WEBHOOK_SECRET=whsec_...
```

重启 `npm run dev`。

---

## Vercel 生产 / 预览

Project → **Settings → Environment Variables**，对 Production / Preview 分别添加：

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_…` 或上线后 `pk_live_…`
- `STRIPE_SECRET_KEY` = `sk_test_…` 或 `sk_live_…`（**不要**勾选 “Expose to Browser”）
- `STRIPE_WEBHOOK_SECRET` = Stripe Dashboard 里为该环境创建的 Webhook 的 signing secret

保存后 **Redeploy** 前端。

---

## Webhook 地址

在 [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) 添加端点：

```text
https://swtjob.vercel.app/api/marketplace/stripe/webhook
```

订阅事件至少：`checkout.session.completed`。

本地调试（推荐配合 Cursor 里的 Stripe CLI / 插件）：

```bash
stripe login
stripe listen --forward-to localhost:3000/api/marketplace/stripe/webhook
```

终端会打印 `whsec_…`，写入本地 `.env.local` 的 `STRIPE_WEBHOOK_SECRET`。

---

## 代码里用到了什么

- `POST /api/marketplace/wallet/checkout`：创建 Checkout Session（需 `STRIPE_SECRET_KEY` + 用户已登录）
- `POST /api/marketplace/stripe/webhook`：支付成功后给市集钱包入账（需 `STRIPE_WEBHOOK_SECRET`）
- `GET /api/marketplace/payments-config`：前台是否显示「Stripe 充值」

未同时配置 **publishable + secret** 时，仍走演示充值。

---

## Cursor 里的 Stripe 开发插件怎么用

常见两种，**都不替代**在 Vercel 配环境变量：

1. **Stripe CLI（MCP / 终端）**  
   - 本地 `stripe listen` 转发 Webhook，避免部署后才能测入账。  
   - 用 `stripe trigger checkout.session.completed` 做联调（需与真实 Session 区分时仍以 Checkout 实测为准）。

2. **文档 / API 参考类插件**  
   - 查 Checkout、Webhook 字段、测试卡号（如 `4242 4242 4242 4242`）。

当前 Cloud Agent 环境**没有**绑定你的 Stripe 账号 MCP；密钥配置与 Webhook 需你在 **Vercel + Stripe Dashboard + 本地 CLI** 完成。

---

## 测试卡

Stripe 测试模式：`4242 4242 4242 4242`，任意未来有效期与 CVC。详见 [Stripe 测试卡文档](https://docs.stripe.com/testing)。
