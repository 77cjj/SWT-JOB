import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 代理 Google tokeninfo，供国内 ECS 在无法直连 Google 时校验 id_token。
 * 仅服务端调用；不做登录态写入。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const idToken =
    (typeof req.query.id_token === 'string' && req.query.id_token) ||
    (typeof req.body?.id_token === 'string' && req.body.id_token) ||
    (typeof req.body?.idToken === 'string' && req.body.idToken) ||
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
    return res.send(text);
  } catch (error) {
    console.error('[google-tokeninfo]', error);
    return res.status(502).json({ error: 'tokeninfo_proxy_failed' });
  }
}
