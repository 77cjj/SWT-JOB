import type { NextApiRequest, NextApiResponse } from "next";

import { verifyAppleIdToken } from "../../../lib/auth/appleVerify";
import { exchangeOAuthLogin, oauthCompleteRedirectHtml, oauthErrorHtml } from "../../../lib/auth/oauthAuthProxy";

function readCookie(req: NextApiRequest, name: string): string {
  const raw = req.headers.cookie || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const clientId = (process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "").trim();
  const idToken =
    (typeof req.body?.id_token === "string" && req.body.id_token) ||
    (typeof req.body?.idToken === "string" && req.body.idToken) ||
    "";
  const state = typeof req.body?.state === "string" ? req.body.state : "";
  const cookieState = readCookie(req, "apple_oauth_state");

  if (!idToken) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(oauthErrorHtml("Apple 登录未完成（缺少 id_token）"));
  }

  if (cookieState && state && cookieState !== state) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(oauthErrorHtml("Apple 登录 state 校验失败，请重试"));
  }

  try {
    await verifyAppleIdToken(idToken, clientId);
    const data = await exchangeOAuthLogin("/auth/apple", { idToken });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Set-Cookie", "apple_oauth_state=; Path=/; Max-Age=0");
    return res.status(200).send(oauthCompleteRedirectHtml(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Apple 登录失败";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(401).send(oauthErrorHtml(message));
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};
