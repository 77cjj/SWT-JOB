# 站点留言 → 企业微信群机器人

## 链路

1. 浏览器 `POST /api/site-inquiry`（Vercel）
2. Vercel 转发 `POST {SITE_INQUIRY_WEBHOOK_URL}`（JSON + 可选 `X-Site-Inquiry-Secret`）
3. ECS 后端 `POST /api/ragent/public/site-inquiry` → 企业微信 Webhook

## 服务器 `.env`（勿提交 Git）

```bash
SITE_INQUIRY_WEWORK_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=你的key
SITE_INQUIRY_WEBHOOK_SECRET=请自行生成一段随机字符串
```

配置后重启：

```bash
./server.sh restart backend --build --force
```

## Vercel 环境变量

| 变量 | 值 |
|------|-----|
| `SITE_INQUIRY_WEBHOOK_URL` | `https://swtjob.vercel.app/api/ragent/auth/site-inquiry-webhook`（推荐；旧路径 `/public/site-inquiry` 仍可用） |
| `SITE_INQUIRY_WEBHOOK_SECRET` | 与服务器 `.env` 相同（若服务器配置了 secret） |

不要配置 `SITE_INQUIRY_PUSHPLUS_TOKEN`（否则会优先走 PushPlus）。

Redeploy 前端后，在站点「联系站长」发测试留言。

## 自测（服务器已部署且已配 WEWORK）

**1. 先测免登录 ping（不需要 Secret）：**

```bash
curl -sS 'http://127.0.0.1:9090/api/ragent/auth/site-inquiry-ping'
```

应返回 `"code":"0"` 且 `"weworkConfigured":true`。若这里仍是「未登录」，说明 **jar 未重新编译**（见文末）。

**2. 再测留言 Webhook（推荐路径，走 `/auth/**` 白名单）：**

```bash
curl -sS -X POST 'http://127.0.0.1:9090/api/ragent/auth/site-inquiry-webhook' \
  -H 'Content-Type: application/json' \
  -H 'X-Site-Inquiry-Secret: 你的SECRET' \
  -d '{"message":"ECS webhook 测试留言","contact":"test","pageUrl":"https://swtjob.vercel.app/chat","topic":"general"}'
```

兼容旧 URL 也可用 `.../public/site-inquiry`，但生产请改用上面 **auth** 路径。

```bash
curl -sS -X POST 'http://127.0.0.1:9090/api/ragent/public/site-inquiry' \
  -H 'Content-Type: application/json' \
  -H 'X-Site-Inquiry-Secret: 你的SECRET' \
  -d '{"message":"ECS webhook 测试留言","contact":"test","pageUrl":"https://swtjob.vercel.app/chat","topic":"general"}'
```

返回 `code: "0"` 且企微群收到消息即成功。

## 若返回 `未登录或登录已过期`（code A000001）

说明请求被 **Sa-Token 登录拦截** 拦住了，常见原因：

1. **ECS 上的后端还是旧版本**（还没有新接口 / 未放行）。在服务器执行（**必须带 --build**）：
   ```bash
   cd /root/SWT-JOB && git pull
   ./server.sh restart backend --build --force
   ```
2. 若只 `restart` 不带 `--build`，可能仍在跑旧 jar。用 ping 验证：
   ```bash
   curl -sS 'http://127.0.0.1:9090/api/ragent/auth/site-inquiry-ping'
   ```
   若 ping 也返回未登录，一定是旧 jar；若 ping 成功但 POST 失败，再看 Secret。

Secret 配错时返回的是 **`Webhook 鉴权失败`**，不是「未登录」。

## 安全说明

- Webhook URL 中的 `key` 等同于密码，泄露后他人可向群内发消息；若已在聊天中暴露，请在企微群机器人设置里**重置 key**。
- 建议始终配置 `SITE_INQUIRY_WEBHOOK_SECRET`。
