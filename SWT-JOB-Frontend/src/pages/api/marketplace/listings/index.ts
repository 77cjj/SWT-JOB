import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import {
  createMarketListing,
  listMarketListings,
  type CreateListingInput,
} from '../../../../lib/marketplace/listings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getMarketUserFromRequest(req);

  if (req.method === 'GET') {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const mine = req.query.mine === 'true';
    const listings = await listMarketListings({
      type: type === 'refer' || type === 'job_intel' ? type : undefined,
      status: mine ? undefined : 'active',
      sellerId: mine && user ? user.userId : undefined,
    });
    return res.status(200).json({ ok: true, listings });
  }

  if (req.method === 'POST') {
    if (!user) return res.status(401).json({ ok: false, message: 'Login required' });
    try {
      const body = (req.body ?? {}) as CreateListingInput;
      const listing = await createMarketListing(user, body);
      return res.status(201).json({ ok: true, listing });
    } catch (error) {
      return res.status(400).json({ ok: false, message: (error as Error).message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
