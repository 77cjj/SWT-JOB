import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const credential =
    (typeof req.body?.credential === "string" && req.body.credential) ||
    (typeof req.body?.id_token === "string" && req.body.id_token) ||
    "";

  if (!credential) {
    return res.status(400).send("Missing Google credential");
  }

  const apiBase = (process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (!apiBase) {
    return res.status(500).send("NEXT_PUBLIC_RAGENT_API_BASE_URL not configured");
  }

  try {
    const upstream = await fetch(`${apiBase}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: credential }),
    });
    const payload = await upstream.json();
    if (!payload || payload.code !== "0" || !payload.data) {
      return res.status(401).send(payload?.message || "Google login failed");
    }
    const encoded = Buffer.from(JSON.stringify(payload.data), "utf8").toString("base64url");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>
<script>location.replace("/auth/google-complete?payload=${encoded}");</script>
</body></html>`);
  } catch {
    res.status(502).send("Backend auth unavailable");
  }
}
