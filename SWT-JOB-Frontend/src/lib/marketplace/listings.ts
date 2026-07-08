import type { MarketListing, MarketStoreData, MarketUser } from './types';
import { displayName } from './auth';
import { newId, readMarketStore, writeMarketStore } from './store';
import {
  calcListingEscrow,
  calcPlatformFee,
  getWallet,
  lockFunds,
  unlockFunds,
} from './wallet';

export type CreateListingInput = {
  type: 'refer' | 'job_intel';
  title: string;
  description: string;
  brand?: string;
  referLink?: string;
  referCode?: string;
  platformReward?: number;
  buyerCashback?: number;
  completionCriteria?: string;
  state?: string;
  city?: string;
  jobTitle?: string;
  employerHint?: string;
  intelFee?: number;
  intelPreview?: string;
  intelDetail?: string;
  maxSlots?: number;
  expiresAt?: string;
};

function validateListingInput(input: CreateListingInput) {
  if (!input.title?.trim()) throw new Error('Title required');
  if (!input.description?.trim()) throw new Error('Description required');
  const maxSlots = input.maxSlots ?? 5;
  if (maxSlots < 1 || maxSlots > 20) throw new Error('maxSlots must be 1–20');

  if (input.type === 'refer') {
    if (!input.brand?.trim()) throw new Error('Brand required');
    if (!input.referLink?.trim() && !input.referCode?.trim()) {
      throw new Error('Refer link or code required');
    }
    if (!input.buyerCashback || input.buyerCashback <= 0) {
      throw new Error('Buyer cashback required');
    }
    if (!input.completionCriteria?.trim()) throw new Error('Completion criteria required');
  }

  if (input.type === 'job_intel') {
    if (!input.state?.trim()) throw new Error('State required');
    if (!input.jobTitle?.trim()) throw new Error('Job title required');
    if (!input.intelFee || input.intelFee <= 0) throw new Error('Intel fee required');
    if (!input.intelPreview?.trim()) throw new Error('Intel preview required');
    if (!input.intelDetail?.trim()) throw new Error('Intel detail required');
  }

  return maxSlots;
}

export async function listMarketListings(filters?: {
  type?: 'refer' | 'job_intel';
  status?: string;
  sellerId?: string;
}) {
  const store = await readMarketStore();
  let items = Object.values(store.listings);
  if (filters?.type) items = items.filter((l) => l.type === filters.type);
  if (filters?.status) items = items.filter((l) => l.status === filters.status);
  if (filters?.sellerId) items = items.filter((l) => l.sellerId === filters.sellerId);
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.map((listing) => sanitizeListingForPublic(listing));
}

function sanitizeListingForPublic(listing: MarketListing, viewerId?: string): MarketListing {
  const copy = { ...listing };
  if (listing.type === 'job_intel' && listing.sellerId !== viewerId) {
    delete copy.intelDetail;
  }
  return copy;
}

export async function getMarketListing(id: string, viewerId?: string) {
  const store = await readMarketStore();
  const listing = store.listings[id];
  if (!listing) return null;
  return sanitizeListingForPublic(listing, viewerId);
}

export async function createMarketListing(user: MarketUser, input: CreateListingInput) {
  const maxSlots = validateListingInput(input);
  const store = await readMarketStore();

  const payoutBase =
    input.type === 'refer' ? (input.buyerCashback ?? 0) : (input.intelFee ?? 0);
  const { escrowPerSlot, buyerPayPerSlot, totalLock } = calcListingEscrow(
    input.type,
    payoutBase,
    maxSlots,
  );

  const wallet = getWallet(store, user.userId);
  if (wallet.balance < totalLock) {
    throw new Error(
      `Insufficient balance. Need $${totalLock.toFixed(2)} escrow, have $${wallet.balance.toFixed(2)}`,
    );
  }

  const now = new Date().toISOString();
  const listing: MarketListing = {
    id: newId('lst'),
    type: input.type,
    sellerId: user.userId,
    sellerName: displayName(user),
    title: input.title.trim(),
    description: input.description.trim(),
    brand: input.brand?.trim(),
    referLink: input.referLink?.trim(),
    referCode: input.referCode?.trim(),
    platformReward: input.platformReward,
    buyerCashback: input.buyerCashback,
    completionCriteria: input.completionCriteria?.trim(),
    state: input.state?.trim().toUpperCase(),
    city: input.city?.trim(),
    jobTitle: input.jobTitle?.trim(),
    employerHint: input.employerHint?.trim(),
    intelFee: input.intelFee,
    intelPreview: input.intelPreview?.trim(),
    intelDetail: input.intelDetail?.trim(),
    escrowPerSlot,
    buyerPayPerSlot,
    priceCurrency: 'USD',
    maxSlots,
    slotsUsed: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    expiresAt: input.expiresAt,
  };

  lockFunds(store, user.userId, totalLock, listing.id, `Listing escrow: ${listing.title}`);
  store.listings[listing.id] = listing;
  await writeMarketStore(store);
  return sanitizeListingForPublic(listing, user.userId);
}

export async function updateMarketListingStatus(
  user: MarketUser,
  listingId: string,
  status: 'active' | 'paused' | 'closed',
) {
  const store = await readMarketStore();
  const listing = store.listings[listingId];
  if (!listing) throw new Error('Listing not found');
  if (listing.sellerId !== user.userId && user.role !== 'admin') {
    throw new Error('Forbidden');
  }

  listing.status = status;
  listing.updatedAt = new Date().toISOString();

  if (status === 'closed') {
    const remainingSlots = listing.maxSlots - listing.slotsUsed;
    if (remainingSlots > 0) {
      const refundAmount = listing.escrowPerSlot * remainingSlots;
      unlockFunds(
        store,
        listing.sellerId,
        refundAmount,
        listing.id,
        `Close listing refund ${remainingSlots} slots`,
      );
    }
  }

  store.listings[listingId] = listing;
  await writeMarketStore(store);
  return sanitizeListingForPublic(listing, user.userId);
}

export function getIntelDetailForBuyer(
  store: MarketStoreData,
  listingId: string,
  buyerId: string,
) {
  const listing = store.listings[listingId];
  if (!listing || listing.type !== 'job_intel') return null;
  const hasCompleted = Object.values(store.orders).some(
    (o) =>
      o.listingId === listingId &&
      o.buyerId === buyerId &&
      o.status === 'completed',
  );
  if (!hasCompleted) return null;
  return listing.intelDetail ?? null;
}

export { calcPlatformFee };
