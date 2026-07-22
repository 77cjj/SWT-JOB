import type { NextApiRequest } from 'next';

import { parseJsonResponse, unwrapRagentResult } from '../api/parseJsonResponse';
import type { MarketUser } from './types';

function resolveRagentApiBase() {
  const raw = process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL?.trim().replace(/\/$/, '');
  if (raw) return raw;
  if (process.env.NODE_ENV !== 'production') return 'https://ragent.nageoffer.com';
  return null;
}

export async function getMarketUserFromRequest(req: NextApiRequest): Promise<MarketUser | null> {
  const bypass = process.env.NEXT_PUBLIC_RAGENT_BYPASS_AUTH === 'true';
  if (bypass && process.env.NODE_ENV !== 'production') {
    const auth = req.headers.authorization;
    if (auth?.includes('local-dev-token')) {
      return { userId: 'local-admin', username: 'admin', role: 'admin' };
    }
  }

  const auth = req.headers.authorization;
  if (!auth) return null;

  const base = resolveRagentApiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/user/me`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) return null;
    const body = await parseJsonResponse<unknown>(res);
    const data = unwrapRagentResult<{
      userId?: string;
      id?: string;
      username?: string;
      role?: string;
    }>(body);
    const userId = data?.userId || data?.id;
    if (userId) {
      return {
        userId: String(userId),
        username: data.username,
        role: data.role,
      };
    }
    // 兼容部分 Result 直接展开字段
    const raw = body as { userId?: string; id?: string; data?: { userId?: string } };
    const fallbackId = raw?.data?.userId || raw?.userId || raw?.id;
    if (fallbackId) {
      return { userId: String(fallbackId), username: data?.username, role: data?.role };
    }
    return null;
  } catch {
    return null;
  }
}

export function displayName(user: MarketUser) {
  const fallback = user.username || user.userId || '用户';
  return /^\d+$/.test(fallback) ? '用户' : fallback;
}

export function isAdmin(user: MarketUser) {
  return user.role === 'admin';
}
