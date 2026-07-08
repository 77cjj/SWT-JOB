import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import {
  getMarketListing,
  updateMarketListingStatus,
} from '../../../../lib/marketplace/listings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });

  const user = await getMarketUserFromRequest(req);

  if (req.method === 'GET') {
    const listing = await getMarketListing(id, user?.userId);
    if (!listing) return res.status(404).json({ ok: false, message: 'Not found' });
    return res.status(200).json({ ok: true, listing });
  }

  if (req.method === 'PATCH') {
    if (!user) return res.status(401).json({ ok: false, message: 'Login required' });
    const status = (req.body as { status?: string })?.status;
    if (status !== 'active' && status !== 'paused' && status !== 'closed') {
      return res.status(400).json({ ok: false, message: 'Invalid status' });
    }
    try {
      const listing = await updateMarketListingStatus(user, id, status);
      return res.status(200).json({ ok: true, listing });
    } catch (error) {
      return res.status(400).json({ ok: false, message: (error as Error).message });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
