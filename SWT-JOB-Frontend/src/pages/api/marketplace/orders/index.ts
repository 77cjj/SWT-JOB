import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import { claimMarketOrder, listMarketOrders } from '../../../../lib/marketplace/orders';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getMarketUserFromRequest(req);

  if (req.method === 'GET') {
    if (!user) return res.status(401).json({ ok: false, message: 'Login required' });
    const role =
      req.query.role === 'buyer' || req.query.role === 'seller' || req.query.role === 'all'
        ? req.query.role
        : 'all';
    const orders = await listMarketOrders(user, role);
    return res.status(200).json({ ok: true, orders });
  }

  if (req.method === 'POST') {
    if (!user) return res.status(401).json({ ok: false, message: 'Login required' });
    const listingId = (req.body as { listingId?: string })?.listingId;
    if (!listingId) return res.status(400).json({ ok: false, message: 'listingId required' });
    try {
      const order = await claimMarketOrder(user, listingId);
      return res.status(201).json({ ok: true, order });
    } catch (error) {
      return res.status(400).json({ ok: false, message: (error as Error).message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
