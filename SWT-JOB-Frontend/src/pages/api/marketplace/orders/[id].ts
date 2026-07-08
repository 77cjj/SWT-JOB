import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import {
  getMarketOrder,
  performOrderAction,
} from '../../../../lib/marketplace/orders';
import type { DisputeWinner, OrderAction } from '../../../../lib/marketplace/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });

  const user = await getMarketUserFromRequest(req);
  if (!user) return res.status(401).json({ ok: false, message: 'Login required' });

  if (req.method === 'GET') {
    const order = await getMarketOrder(user, id);
    if (!order) return res.status(404).json({ ok: false, message: 'Not found' });
    return res.status(200).json({ ok: true, order });
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as {
      action?: OrderAction;
      proofNote?: string;
      disputeReason?: string;
      winner?: DisputeWinner;
    };
    if (!body.action) return res.status(400).json({ ok: false, message: 'action required' });
    try {
      const order = await performOrderAction(user, id, body.action, body);
      return res.status(200).json({ ok: true, order });
    } catch (error) {
      return res.status(400).json({ ok: false, message: (error as Error).message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
