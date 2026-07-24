import type { GoogleLoginSuccess } from "./googleAuthProxy";
import { resolveRagentApiBase } from "./googleAuthProxy";

type BackendEnvelope = {
  code?: string;
  message?: string;
  data?: {
    userId?: string;
    role?: string;
    token?: string;
    avatar?: string;
    username?: string;
  };
};

export async function exchangeOAuthLogin(
  path: "/auth/apple" | "/auth/wechat",
  body: Record<string, unknown>,
): Promise<GoogleLoginSuccess> {
  const apiBase = resolveRagentApiBase();
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_RAGENT_API_BASE_URL 未配置");
  }

  const upstream = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  let payload: BackendEnvelope | null = null;
  try {
    payload = JSON.parse(text) as BackendEnvelope;
  } catch {
    payload = null;
  }

  if (!upstream.ok) {
    throw new Error(payload?.message || `登录失败 (HTTP ${upstream.status})`);
  }

  if (!payload || payload.code !== "0" || !payload.data?.token) {
    throw new Error(payload?.message || "登录失败");
  }

  const data = payload.data;
  return {
    userId: data.userId || "",
    role: data.role || "user",
    token: data.token || "",
    avatar: data.avatar,
    username: data.username || data.userId,
  };
}

export function oauthCompleteRedirectHtml(data: GoogleLoginSuccess): string {
  const encoded = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>
<script>location.replace("/auth/oauth-complete?payload=${encoded}");</script>
</body></html>`;
}

export function oauthErrorHtml(message: string): string {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>登录失败</title></head><body>
<p>${safe}</p>
<p><a href="/chat">返回 AI 问答</a></p>
</body></html>`;
}
