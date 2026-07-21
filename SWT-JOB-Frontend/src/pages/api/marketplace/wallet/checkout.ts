import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import { MIN_WALLET_DEPOSIT } from '../../../../lib/marketplace/types';
import { getStripe, isStripeConfigured } from '../../../../lib/stripe/server';

function siteOrigin(req: NextApiRequest): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  if (!isStripeConfigured()) {
    return res.status(503).json({ ok: false, message: 'Stripe 未配置' });
  }

  const user = await getMarketUserFromRequest(req);
  if (!user) return res.status(401).json({ ok: false, message: 'Login required' });

  const amount = Number((req.body as { amount?: number })?.amount);
  if (!Number.isFinite(amount) || amount < MIN_WALLET_DEPOSIT) {
    return res.status(400).json({
      ok: false,
      message: `Minimum deposit is $${MIN_WALLET_DEPOSIT}`,
    });
  }
  if (amount > 500) {
    return res.status(400).json({ ok: false, message: 'Max $500 per deposit' });
  }

  try {
    const stripe = getStripe();
    const origin = siteOrigin(req);
    const amountCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: 'SWT 交易市集 · 钱包充值',
              description: `用户 ${user.userId} · 充值 $${amount.toFixed(2)} USD`,
            },
          },
        },
      ],
      success_url: `${origin}/deals/market?tab=wallet&deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/deals/market?tab=wallet&deposit=cancel`,
      metadata: {
        userId: user.userId,
        amountUsd: String(amount),
        purpose: 'marketplace_wallet_deposit',
      },
    });

    if (!session.url) {
      return res.status(500).json({ ok: false, message: '无法创建 Stripe Checkout' });
    }

    return res.status(200).json({ ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('[stripe/checkout]', error);
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Stripe checkout failed',
    });
  }
}
