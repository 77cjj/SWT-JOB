import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import { readMarketStore, writeMarketStore } from '../../../../lib/marketplace/store';
import { depositWallet, getWallet } from '../../../../lib/marketplace/wallet';
import { MIN_WALLET_DEPOSIT } from '../../../../lib/marketplace/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getMarketUserFromRequest(req);
  if (!user) return res.status(401).json({ ok: false, message: 'Login required' });

  if (req.method === 'GET') {
    const store = await readMarketStore();
    const wallet = getWallet(store, user.userId);
    const txs = store.transactions.filter((t) => t.userId === user.userId).slice(0, 30);
    const stats = store.userStats[user.userId] ?? {
      completedAsSeller: 0,
      completedAsBuyer: 0,
      disputes: 0,
      rating: 5,
    };
    return res.status(200).json({ ok: true, wallet, transactions: txs, stats });
  }

  if (req.method === 'POST') {
    const amount = Number((req.body as { amount?: number })?.amount);
    if (!Number.isFinite(amount) || amount < MIN_WALLET_DEPOSIT) {
      return res.status(400).json({
        ok: false,
        message: `Minimum deposit is $${MIN_WALLET_DEPOSIT}`,
      });
    }
    if (amount > 500) {
      return res.status(400).json({ ok: false, message: 'Max $500 per deposit (demo)' });
    }

    const store = await readMarketStore();
    depositWallet(
      store,
      user.userId,
      amount,
      'Simulated deposit (Phase 2 demo — replace with Stripe later)',
    );
    await writeMarketStore(store);
    const wallet = getWallet(store, user.userId);
    return res.status(200).json({ ok: true, wallet });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, message: 'Method not allowed' });
}
