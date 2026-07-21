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

export type GoogleLoginSuccess = {
  userId: string;
  role: string;
  token: string;
  avatar?: string;
  username?: string;
};

export function resolveRagentApiBase(): string {
  const server =
    (process.env.RAGENT_SERVER_API_BASE_URL || "").trim() ||
    (process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL || "").trim();
  return server.replace(/\/$/, "");
}

export function extractGoogleCredential(body: unknown): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }
  if (!body || typeof body !== "object") {
    return "";
  }
  const record = body as Record<string, unknown>;
  for (const key of ["credential", "id_token", "idToken"]) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return "";
}

export async function exchangeGoogleIdToken(idToken: string): Promise<GoogleLoginSuccess> {
  const apiBase = resolveRagentApiBase();
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_RAGENT_API_BASE_URL 未配置");
  }
  if (!idToken) {
    throw new Error("缺少 Google 登录凭证");
  }

  const upstream = await fetch(`${apiBase}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const text = await upstream.text();
  let payload: BackendEnvelope | null = null;
  try {
    payload = JSON.parse(text) as BackendEnvelope;
  } catch {
    payload = null;
  }

  if (!upstream.ok) {
    const msg =
      payload?.message ||
      (upstream.status === 404
        ? "后端未部署 Google 登录接口，请在服务器执行 ./server.sh restart backend --build --force"
        : `Google 登录失败 (HTTP ${upstream.status})`);
    throw new Error(msg);
  }

  if (!payload || payload.code !== "0" || !payload.data?.token) {
    throw new Error(payload?.message || "Google 登录失败");
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
