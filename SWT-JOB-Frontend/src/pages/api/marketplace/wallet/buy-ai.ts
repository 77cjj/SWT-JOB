import type { NextApiRequest, NextApiResponse } from 'next';

import { getMarketUserFromRequest } from '../../../../lib/marketplace/auth';
import { readMarketStore, writeMarketStore, newId } from '../../../../lib/marketplace/store';
import { getWallet } from '../../../../lib/marketplace/wallet';

const AI_CHAT_USD = Number(process.env.AI_CHAT_PRICE_USD || '0.5');

/**
 * 用市集钱包余额购买 AI 问答次数，并调用后端增加 freeChatRemaining。
 * 后端额度同步失败时回滚扣款，避免「钱扣了次数没到」。
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const user = await getMarketUserFromRequest(req);
  if (!user) return res.status(401).json({ ok: false, message: 'Login required' });

  const count = Math.floor(Number((req.body as { count?: number })?.count ?? 1));
  if (!Number.isFinite(count) || count < 1 || count > 100) {
    return res.status(400).json({ ok: false, message: '购买次数须为 1–100' });
  }

  const unit = Number.isFinite(AI_CHAT_USD) && AI_CHAT_USD > 0 ? AI_CHAT_USD : 0.5;
  const cost = Math.round(unit * count * 100) / 100;

  try {
    const store = await readMarketStore();
    const wallet = getWallet(store, user.userId);
    if (wallet.balance < cost) {
      return res.status(400).json({
        ok: false,
        message: `余额不足：需要 $${cost.toFixed(2)}，当前 $${wallet.balance.toFixed(2)}`,
      });
    }

    const base = process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL?.replace(/\/$/, '');
    if (!base || !req.headers.authorization) {
      return res.status(503).json({
        ok: false,
        message: 'AI 额度服务未配置，请稍后重试或联系站长',
      });
    }

    let backendOk = false;
    let backendMessage = '';
    try {
      const r = await fetch(`${base}/user/chat-credits/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify({ userId: user.userId, count }),
      });
      backendOk = r.ok;
      if (!r.ok) {
        backendMessage = await r.text();
      }
    } catch (e) {
      backendMessage = e instanceof Error ? e.message : 'backend error';
    }

    if (!backendOk) {
      return res.status(502).json({
        ok: false,
        message: `额度同步失败，未扣款${backendMessage ? `：${backendMessage.slice(0, 200)}` : ''}`,
      });
    }

    wallet.balance -= cost;
    store.wallets[user.userId] = wallet;
    store.transactions.unshift({
      id: newId('tx'),
      userId: user.userId,
      type: 'platform_fee',
      amount: cost,
      note: `购买 AI 问答 ×${count}（$${unit}/次）`,
      createdAt: new Date().toISOString(),
    });
    await writeMarketStore(store);

    return res.status(200).json({
      ok: true,
      cost,
      count,
      wallet,
      backendCredited: true,
      message: `已购买 ${count} 次 AI 问答`,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Purchase failed',
    });
  }
}
