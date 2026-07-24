import type { NextApiRequest, NextApiResponse } from "next";

import { verifyAppleIdToken } from "../../../lib/auth/appleVerify";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const idToken =
    (typeof req.query.id_token === "string" && req.query.id_token) ||
    (typeof req.body?.id_token === "string" && req.body.id_token) ||
    (typeof req.body?.idToken === "string" && req.body.idToken) ||
    "";

  const clientId =
    (process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "").trim();

  if (!idToken.trim()) {
    return res.status(400).json({ error: "missing_id_token" });
  }
  if (!clientId) {
    return res.status(503).json({ error: "apple_client_id_not_configured" });
  }

  try {
    const claims = await verifyAppleIdToken(idToken.trim(), clientId);
    return res.status(200).json({ ok: true, ...claims });
  } catch (error) {
    console.error("[apple-verify]", error);
    return res.status(401).json({
      error: "invalid_token",
      message: error instanceof Error ? error.message : "Apple 登录无效",
    });
  }
}
