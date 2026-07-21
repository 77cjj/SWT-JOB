# 交易市集 · 钱包与支付

当前市集钱包为 **演示 escrow**：

- 数据存在 Vercel 的 `/tmp/swt-marketplace.json`（或本地 `.data/marketplace.json`），**非持久化生产数据库**。
- 「充值」为模拟入账，**没有**对接 Stripe / PayPal / 微信支付的 live 扣款。

## 若要接入真实支付（需你方商户资质）

推荐路径：**Stripe Checkout**（美元）或 **PayPal**（跨境）。

1. 注册商户，获取 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`（仅服务端）。
2. 新增 API：`POST /api/marketplace/wallet/checkout` → 创建 Checkout Session → 用户支付成功 webhook → `depositWallet`。
3. 将市集存储迁到 **PostgreSQL / Redis**（Vercel `/tmp` 会在冷启动后丢失数据）。
4. 合规：KYC、退款政策、平台手续费披露。

在未完成以上步骤前，请勿向用户承诺「真实充值即时到账」。

环境变量（预留，当前未启用）：

```bash
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# MARKETPLACE_STORE_PATH=/var/lib/swt/marketplace.json  # 自建机持久化路径
```
