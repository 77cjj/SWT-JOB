import type { NextApiRequest, NextApiResponse } from 'next';

import { isStripeConfigured } from '../../../lib/stripe/server';

/** 公开：前台是否应走 Stripe Checkout（不暴露密钥） */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    ok: true,
    stripeEnabled: isStripeConfigured(),
  });
}
