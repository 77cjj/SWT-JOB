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
| `SITE_INQUIRY_WEBHOOK_URL` | `https://swtjob.vercel.app/api/ragent/public/site-inquiry` |
| `SITE_INQUIRY_WEBHOOK_SECRET` | 与服务器 `.env` 相同（若服务器配置了 secret） |

不要配置 `SITE_INQUIRY_PUSHPLUS_TOKEN`（否则会优先走 PushPlus）。

Redeploy 前端后，在站点「联系站长」发测试留言。

## 显示成功但没收到？

按顺序排查（最常见在前）：

1. **Vercel 环境变量**  
   - 是否配置了 `SITE_INQUIRY_WEBHOOK_URL`（指向 ECS 的 `/api/ragent/public/site-inquiry`）或 `SITE_INQUIRY_PUSHPLUS_TOKEN`？  
   - 若两者都未配置，生产环境会返回 **503「留言通道尚未配置」**；若你仍看到成功，可能是旧版前端或浏览器缓存。

2. **PushPlus 优先**  
   - 若同时配置了 `SITE_INQUIRY_PUSHPLUS_TOKEN` 与 Webhook，**只会走 PushPlus**，不会进企业微信。不需要 PushPlus 时请删除该变量。

3. **Webhook Secret 不一致**  
   - Vercel 的 `SITE_INQUIRY_WEBHOOK_SECRET` 须与 ECS `SITE_INQUIRY_WEBHOOK_SECRET` 完全一致，否则后端会拒绝转发（前端可能显示 502「通知发送失败」）。

4. **ECS 后端**  
   - `SITE_INQUIRY_WEWORK_WEBHOOK` 是否配置？是否已 `./server.sh restart backend --build --force`？  
   - 用下方 curl 在服务器自测，确认企微群能收到。

5. **企微机器人**  
   - Webhook key 是否过期或被重置？群是否静音/免打扰？

6. **Vercel 函数日志**  
   - 在 Vercel → Project → Logs 搜索 `[site-inquiry]`，查看 notify 失败原因。

## 自测（服务器已部署且已配 WEWORK）

```bash
curl -sS -X POST 'http://127.0.0.1:9090/api/ragent/public/site-inquiry' \
  -H 'Content-Type: application/json' \
  -H 'X-Site-Inquiry-Secret: 你的SECRET' \
  -d '{"message":"ECS webhook 测试留言","contact":"test","pageUrl":"https://swtjob.vercel.app/chat","topic":"general"}'
```

返回 `code: "0"` 且企微群收到消息即成功。

## 安全说明

- Webhook URL 中的 `key` 等同于密码，泄露后他人可向群内发消息；若已在聊天中暴露，请在企微群机器人设置里**重置 key**。
- 建议始终配置 `SITE_INQUIRY_WEBHOOK_SECRET`。
