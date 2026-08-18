import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  return res.status(503).json({ ok: false, message: "Apple 登录未开放，请使用 Google 或账号密码登录" });
}
