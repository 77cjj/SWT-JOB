import type { NextApiRequest, NextApiResponse } from "next";

import { exchangeOAuthLogin, oauthCompleteRedirectHtml, oauthErrorHtml } from "../../../lib/auth/oauthAuthProxy";

function readCookie(req: NextApiRequest, name: string): string {
  const raw = req.headers.cookie || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method Not Allowed");
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const cookieState = readCookie(req, "wechat_oauth_state");

  if (!code) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(oauthErrorHtml("微信登录未完成（缺少 code）"));
  }

  if (cookieState && state && cookieState !== state) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(oauthErrorHtml("微信登录 state 校验失败，请重试"));
  }

  try {
    const data = await exchangeOAuthLogin("/auth/wechat", { code });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Set-Cookie", "wechat_oauth_state=; Path=/; Max-Age=0");
    return res.status(200).send(oauthCompleteRedirectHtml(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "微信登录失败";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(401).send(oauthErrorHtml(message));
  }
}
