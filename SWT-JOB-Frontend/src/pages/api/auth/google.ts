import type { NextApiRequest, NextApiResponse } from "next";

import { exchangeGoogleIdToken, extractGoogleCredential } from "../../../lib/auth/googleAuthProxy";

/** 弹窗 / fetch 登录：同源代理，避免浏览器直连后端 CORS */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const idToken = extractGoogleCredential(req.body);
  try {
    const data = await exchangeGoogleIdToken(idToken);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google 登录失败";
    return res.status(401).json({ ok: false, message });
  }
}
