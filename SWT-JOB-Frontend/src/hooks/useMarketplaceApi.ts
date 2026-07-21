import { useCallback } from 'react';
import { storage } from '@/utils/storage';
import type {
  DisputeWinner,
  MarketListing,
  MarketOrder,
  OrderAction,
  UserMarketStats,
  WalletAccount,
  WalletTransaction,
} from '../lib/marketplace/types';

function authHeaders(): HeadersInit {
  const token = storage.getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function parseJson<T>(res: Response): Promise<T & { ok?: boolean; message?: string }> {
  const data = (await res.json()) as T & { ok?: boolean; message?: string };
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export function useMarketplaceApi() {
  const fetchListings = useCallback(
    async (opts?: { type?: 'refer' | 'job_intel'; mine?: boolean }) => {
      const params = new URLSearchParams();
      if (opts?.type) params.set('type', opts.type);
      if (opts?.mine) params.set('mine', 'true');
      const qs = params.toString();
      const res = await fetch(`/api/marketplace/listings${qs ? `?${qs}` : ''}`, {
        headers: authHeaders(),
      });
      const data = await parseJson<{ listings: MarketListing[] }>(res);
      return data.listings;
    },
    [],
  );

  const createListing = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await parseJson<{ listing: MarketListing }>(res);
    return data.listing;
  }, []);

  const updateListingStatus = useCallback(
    async (id: string, status: 'active' | 'paused' | 'closed') => {
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await parseJson<{ listing: MarketListing }>(res);
      return data.listing;
    },
    [],
  );

  const fetchOrders = useCallback(async (role: 'buyer' | 'seller' | 'all' = 'all') => {
    const res = await fetch(`/api/marketplace/orders?role=${role}`, {
      headers: authHeaders(),
    });
    const data = await parseJson<{ orders: MarketOrder[] }>(res);
    return data.orders;
  }, []);

  const claimOrder = useCallback(async (listingId: string) => {
    const res = await fetch('/api/marketplace/orders', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ listingId }),
    });
    const data = await parseJson<{ order: MarketOrder }>(res);
    return data.order;
  }, []);

  const orderAction = useCallback(
    async (
      orderId: string,
      action: OrderAction,
      payload?: { proofNote?: string; disputeReason?: string; winner?: DisputeWinner },
    ) => {
      const res = await fetch(`/api/marketplace/orders/${orderId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await parseJson<{ order: MarketOrder & { intelDetail?: string } }>(res);
      return data.order;
    },
    [],
  );

  const fetchWallet = useCallback(async () => {
    const res = await fetch('/api/marketplace/wallet', { headers: authHeaders() });
    const data = await parseJson<{
      wallet: WalletAccount;
      transactions: WalletTransaction[];
      stats: UserMarketStats;
    }>(res);
    return data;
  }, []);

  const deposit = useCallback(async (amount: number) => {
    const res = await fetch('/api/marketplace/wallet', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ amount }),
    });
    const data = await parseJson<{ wallet: WalletAccount }>(res);
    return data.wallet;
  }, []);

  const startStripeCheckout = useCallback(async (amount: number) => {
    const res = await fetch('/api/marketplace/wallet/checkout', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ amount }),
    });
    const data = await parseJson<{ url: string }>(res);
    if (!data.url) throw new Error('未返回 Checkout 链接');
    window.location.href = data.url;
  }, []);

  const fetchPaymentsConfig = useCallback(async () => {
    const res = await fetch('/api/marketplace/payments-config');
    const data = await parseJson<{ stripeEnabled: boolean }>(res);
    return data.stripeEnabled;
  }, []);

  return {
    fetchListings,
    createListing,
    updateListingStatus,
    fetchOrders,
    claimOrder,
    orderAction,
    fetchWallet,
    deposit,
    startStripeCheckout,
    fetchPaymentsConfig,
  };
}
