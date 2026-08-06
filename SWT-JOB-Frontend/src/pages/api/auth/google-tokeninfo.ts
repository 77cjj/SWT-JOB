import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 代理 Google tokeninfo，供国内 ECS 在无法直连 Google 时校验 id_token。
 * 优先用 POST JSON body（id_token 很长，GET query 易被截断）。
 * 仅服务端调用；不做登录态写入。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string'
    ? (() => {
        try {
          return JSON.parse(req.body) as Record<string, unknown>;
        } catch {
          return {} as Record<string, unknown>;
        }
      })()
    : (req.body as Record<string, unknown> | undefined);

  const idToken =
    (typeof req.query.id_token === 'string' && req.query.id_token) ||
    (typeof body?.id_token === 'string' && body.id_token) ||
    (typeof body?.idToken === 'string' && body.idToken) ||
    '';

  if (!idToken.trim()) {
    return res.status(400).json({ error: 'missing_id_token' });
  }

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
    const upstream = await fetch(url, { method: 'GET' });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (error) {
    console.error('[google-tokeninfo]', error);
    return res.status(502).json({ error: 'tokeninfo_proxy_failed' });
  }
}
