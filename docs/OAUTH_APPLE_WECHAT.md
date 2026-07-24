# Apple / 微信登录配置

## Apple Sign In

1. [Apple Developer](https://developer.apple.com/) → Identifiers → **Services ID**
2. 启用 Sign in with Apple，配置 **Return URL**：
   ```
   https://swtjob.vercel.app/api/auth/apple-callback
   http://localhost:3000/api/auth/apple-callback
   ```

### Vercel

```env
NEXT_PUBLIC_APPLE_CLIENT_ID=com.example.swtjob.web
APPLE_CLIENT_ID=com.example.swtjob.web
```

### ECS（后端）

```env
APPLE_CLIENT_ID=与上面相同
APPLE_VERIFY_PROXY_URL=https://swtjob.vercel.app/api/auth/apple-verify
```

部署：`./server.sh restart backend --build --force`，然后 Vercel Redeploy。

---

## 微信开放平台（网站应用扫码）

1. [微信开放平台](https://open.weixin.qq.com/) → 网站应用 → 获取 AppID / AppSecret
2. **授权回调域**：`swtjob.vercel.app`（不含路径）
3. 回调完整 URL 由代码固定为：`/api/auth/wechat-callback`

### Vercel

```env
NEXT_PUBLIC_WECHAT_APP_ID=wxXXXXXXXX
WECHAT_APP_ID=wxXXXXXXXX
WECHAT_APP_SECRET=xxxxxxxx
```

### ECS

```env
WECHAT_APP_ID=wxXXXXXXXX
WECHAT_APP_SECRET=xxxxxxxx
```

微信 code 换 token 在国内 ECS 可直接访问 `api.weixin.qq.com`，无需代理。

---

## 登录弹窗

配置完成后，登录弹窗会显示：**Google · Apple · 微信扫码 · 账号密码**。

未配置的环境变量对应按钮会自动隐藏。
