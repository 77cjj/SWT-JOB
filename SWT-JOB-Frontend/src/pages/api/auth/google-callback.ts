import type { NextApiRequest, NextApiResponse } from "next";

import { exchangeGoogleIdToken, extractGoogleCredential } from "../../../lib/auth/googleAuthProxy";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Google redirect 模式：POST credential 到此路由，再跳转 google-complete */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const credential = extractGoogleCredential(req.body);
  if (!credential) {
    return res.status(400).send("Missing Google credential（请确认 Google Console 已配置 redirect URI）");
  }

  try {
    const data = await exchangeGoogleIdToken(credential);
    const encoded = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>
<script>location.replace("/auth/google-complete?payload=${encoded}");</script>
</body></html>`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google 登录失败";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(401).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>登录失败</title></head><body>
<p>${escapeHtml(message)}</p>
<p><a href="/chat">返回 AI 问答</a></p>
</body></html>`);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};
