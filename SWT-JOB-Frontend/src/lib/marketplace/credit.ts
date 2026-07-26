import type { UserMarketStats } from './types';

export type SellerCreditTier = 'new' | 'good' | 'excellent' | 'gold' | 'caution';

export function defaultSellerStats(): UserMarketStats {
  return {
    completedAsSeller: 0,
    completedAsBuyer: 0,
    disputes: 0,
    rating: 5,
  };
}

/** 根据 refer 履约与争议记录计算 1–5 信誉分 */
export function computeSellerRating(stats: UserMarketStats): number {
  const completed = stats.completedAsSeller ?? 0;
  const disputes = stats.disputes ?? 0;
  if (completed === 0 && disputes === 0) return 5;

  const total = completed + disputes;
  const completionRate = completed / total;
  const score = completionRate * 5 - disputes * 0.35;
  return Math.round(Math.max(1, Math.min(5, score)) * 10) / 10;
}

export function getSellerCreditTier(stats: UserMarketStats): SellerCreditTier {
  const completed = stats.completedAsSeller ?? 0;
  const disputes = stats.disputes ?? 0;
  const rating = computeSellerRating(stats);

  if (disputes >= 2 || (disputes >= 1 && completed < 3)) return 'caution';
  if (completed >= 10 && disputes === 0 && rating >= 4.8) return 'gold';
  if (completed >= 5 && rating >= 4.2) return 'excellent';
  if (completed >= 1) return 'good';
  return 'new';
}

export function listingTotalEscrow(listing: {
  escrowPerSlot: number;
  unlimitedSlots?: boolean;
  maxSlots: number;
}): number {
  const slots = listing.unlimitedSlots || listing.maxSlots <= 0 ? 1 : listing.maxSlots;
  return listing.escrowPerSlot * slots * 1.1;
}
