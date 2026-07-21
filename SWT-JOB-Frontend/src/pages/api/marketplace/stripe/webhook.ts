import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';

import { readMarketStore, writeMarketStore } from '../../../../lib/marketplace/store';
import { depositWallet } from '../../../../lib/marketplace/wallet';
import { getStripe, getStripeWebhookSecret } from '../../../../lib/stripe/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function alreadyProcessed(store: Awaited<ReturnType<typeof readMarketStore>>, sessionId: string) {
  return store.transactions.some(
    (tx) => tx.type === 'deposit' && tx.note?.includes(sessionId),
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return res.status(503).json({ ok: false, message: 'STRIPE_WEBHOOK_SECRET 未配置' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    return res.status(400).json({ ok: false, message: 'Missing stripe-signature' });
  }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (error) {
    console.error('[stripe/webhook] signature', error);
    return res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Webhook signature failed',
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.purpose !== 'marketplace_wallet_deposit') {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const userId = session.metadata.userId;
    const amountUsd = Number(session.metadata.amountUsd);
    if (!userId || !Number.isFinite(amountUsd) || amountUsd <= 0) {
      return res.status(400).json({ ok: false, message: 'Invalid session metadata' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ ok: true, skipped: 'not_paid' });
    }

    try {
      const store = await readMarketStore();
      if (alreadyProcessed(store, session.id)) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
      depositWallet(
        store,
        userId,
        amountUsd,
        `Stripe Checkout ${session.id}`,
      );
      await writeMarketStore(store);
    } catch (error) {
      console.error('[stripe/webhook] deposit', error);
      return res.status(500).json({ ok: false, message: 'Failed to credit wallet' });
    }
  }

  return res.status(200).json({ ok: true, received: true });
}
