# server.sh restart 会不会更新代码 / 打 jar？

## 简短答案

`./server.sh restart backend --force` **只会强杀并重启当前已有的 jar**，**不会** `git pull`，**也不会**重新编译。

| 命令 | git pull | 编译 jar | 重启进程 |
|------|----------|----------|----------|
| `./server.sh restart backend --force` | 否 | 否 | 是 |
| `./server.sh restart backend --build --force` | 否* | 是 | 是 |
| `./server.sh restart backend --pull --build --force` | 是 | 是 | 是 |

\* `--build` 只本地编译；要拉代码请先 `git pull` 或加 `--pull`。

## 推荐（更新后端）

```bash
cd /root/SWT-JOB
git pull
./server.sh restart backend --build --force
```

## Google 登录仍是 popup

Google 登录跑在 **Vercel 前端**，与 ECS `server.sh` **无关**。  
控制台若仍出现 `ux_mode=popup`，说明浏览器还在跑 **旧版前端 JS**。需要：

1. 确认本仓库已合并最新 master（强制 `ux_mode: redirect`）
2. **Vercel Redeploy** 生产环境
3. 硬刷新 / 无痕窗口再试
4. Google Console Redirect URI：`https://swtjob.vercel.app/api/auth/google-callback`
