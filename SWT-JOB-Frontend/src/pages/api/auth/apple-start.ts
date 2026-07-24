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

  const clientId = (process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "").trim();
  if (!clientId) {
    return res.status(503).json({ ok: false, message: "未配置 Apple 登录（APPLE_CLIENT_ID）" });
  }

  const origin = siteOrigin(req);
  const redirectUri = `${origin}/api/auth/apple-callback`;
  const state = crypto.randomBytes(16).toString("hex");

  res.setHeader("Set-Cookie", `apple_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  res.redirect(302, `https://appleid.apple.com/auth/authorize?${params.toString()}`);
}
