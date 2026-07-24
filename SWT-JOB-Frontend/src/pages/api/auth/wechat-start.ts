import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

function siteOrigin(req: NextApiRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const appId = (process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID || "").trim();
  if (!appId) {
    return res.status(503).json({ ok: false, message: "未配置微信登录（WECHAT_APP_ID）" });
  }

  const origin = siteOrigin(req);
  const redirectUri = encodeURIComponent(`${origin}/api/auth/wechat-callback`);
  const state = crypto.randomBytes(16).toString("hex");

  res.setHeader("Set-Cookie", `wechat_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(
    302,
    `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`,
  );
}
