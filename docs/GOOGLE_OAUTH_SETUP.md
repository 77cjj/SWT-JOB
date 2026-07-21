# Google OAuth 配置（SWT-JOB）

适用于前端 `https://swtjob.vercel.app` + 后端经 Vercel 反代 `/api/ragent`。

## 1. Google Cloud Console

1. 打开 [Google Cloud Console](https://console.cloud.google.com/) → **API 和服务** → **凭据**
2. **创建凭据** → **OAuth 客户端 ID**
3. 应用类型：**Web 应用**

### 已获授权的 JavaScript 来源

```
https://swtjob.vercel.app
http://localhost:3000
```

### 已获授权的重定向 URI

Google Identity Services（前端按钮）通常**可不填重定向 URI**；若控制台强制要求，可填：

```
https://swtjob.vercel.app
http://localhost:3000
```

（本项目使用前端 `GoogleLogin` 组件 + 后端验证 `idToken`，不是服务端 redirect 回调。）

4. 保存后复制 **客户端 ID** 与 **客户端密钥**

## 2. 环境变量

### Vercel（前端）

| 变量 | 值 |
|------|-----|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` |
| `NEXT_PUBLIC_RAGENT_API_BASE_URL` | `https://swtjob.vercel.app/api/ragent` |

保存后 **Redeploy**。

### 阿里云后端（`.env` 或 `SERVER_ENV_FILE`）

```env
GOOGLE_CLIENT_ID=与上面相同的客户端 ID
GOOGLE_CLIENT_SECRET=客户端密钥
```

`GOOGLE_CLIENT_SECRET` 仅后端验证扩展接口时使用；当前实现用 `tokeninfo` 校验 `idToken`，**必须配置 `GOOGLE_CLIENT_ID`**。

重启后端：

```bash
./server.sh restart backend --force
```

## 3. 验证

1. 打开 `https://swtjob.vercel.app/chat`（未登录）
2. 右上角应显示 **请登录**
3. 可看到示例问题；点击发送应弹出登录窗
4. 登录窗内应出现 **Google 登录** 按钮

## 4. 知识库上传与 RocketMQ

文档分块依赖 RocketMQ。若日志出现 `文档分块 - 事务消息发送失败`：

```bash
./server.sh status
./server.sh broker    # 重建 Broker（2G 机器可能仍不稳定）
./server.sh doctor
```

管理后台上传知识库前，请确认 RocketMQ 与相关容器健康。
