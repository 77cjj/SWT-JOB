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
  requiresSsn?: boolean;
  minDepositUsd?: number;
  unlimitedSlots?: boolean;
  sellerContactHint?: string;
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
  const unlimited = Boolean(input.unlimitedSlots);
  const maxSlots = unlimited ? 0 : (input.maxSlots ?? 5);
  if (!unlimited && (maxSlots < 1 || maxSlots > 10000)) {
    throw new Error('名额须为 1–10000，或选择无上限');
  }

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

  return { maxSlots, unlimited };
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
  const { maxSlots, unlimited } = validateListingInput(input);
  const store = await readMarketStore();

  const payoutBase =
    input.type === 'refer' ? (input.buyerCashback ?? 0) : (input.intelFee ?? 0);
  // 无上限：仅锁定 1 个名额保证金；有限：按名额锁定
  const escrowSlots = unlimited ? 1 : maxSlots;
  const { escrowPerSlot, buyerPayPerSlot, totalLock } = calcListingEscrow(
    input.type,
    payoutBase,
    escrowSlots,
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
    requiresSsn: input.requiresSsn,
    minDepositUsd: input.minDepositUsd,
    unlimitedSlots: unlimited,
    sellerContactHint: input.sellerContactHint?.trim(),
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
    maxSlots: unlimited ? 0 : maxSlots,
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

  const prev = listing.status;
  if (prev === status) {
    return sanitizeListingForPublic(listing, user.userId);
  }

  // 关闭：退回剩余保证金（仅从 active/paused/sold_out → closed 时执行一次）
  if (status === 'closed' && prev !== 'closed') {
    const remainingSlots = listing.unlimitedSlots
      ? 1
      : Math.max(0, listing.maxSlots - listing.slotsUsed);
    if (remainingSlots > 0 && listing.escrowPerSlot > 0) {
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

  // 从关闭恢复上架：重新锁定剩余名额保证金
  if (status === 'active' && prev === 'closed') {
    const remainingSlots = listing.unlimitedSlots
      ? 1
      : Math.max(0, listing.maxSlots - listing.slotsUsed);
    if (remainingSlots > 0 && listing.escrowPerSlot > 0) {
      const relock = listing.escrowPerSlot * remainingSlots;
      lockFunds(
        store,
        listing.sellerId,
        relock,
        listing.id,
        `Resume listing escrow ${remainingSlots} slots`,
      );
    }
  }

  // 暂停不解锁；从暂停恢复仅改状态
  listing.status = status;
  listing.updatedAt = new Date().toISOString();
  store.listings[listingId] = listing;
  await writeMarketStore(store);
  return sanitizeListingForPublic(listing, user.userId);
}

export type UpdateListingInput = Partial<CreateListingInput> & {
  /** 编辑时不可改类型；由服务端校验 */
};

/** 编辑帖子文案与条件；金额/名额仅在尚无成交时可改（避免破坏已锁定保证金） */
export async function updateMarketListing(
  user: MarketUser,
  listingId: string,
  input: UpdateListingInput,
) {
  const store = await readMarketStore();
  const listing = store.listings[listingId];
  if (!listing) throw new Error('Listing not found');
  if (listing.sellerId !== user.userId && user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  if (listing.status === 'closed') {
    throw new Error('已关闭的帖子请先恢复上架再编辑');
  }

  const type = listing.type;
  if (input.title !== undefined) {
    if (!String(input.title).trim()) throw new Error('Title required');
    listing.title = String(input.title).trim();
  }
  if (input.description !== undefined) {
    if (!String(input.description).trim()) throw new Error('Description required');
    listing.description = String(input.description).trim();
  }
  if (input.sellerContactHint !== undefined) {
    listing.sellerContactHint = String(input.sellerContactHint).trim() || undefined;
  }

  const canChangeMoney = listing.slotsUsed === 0;

  if (type === 'refer') {
    if (input.brand !== undefined) listing.brand = String(input.brand).trim() || undefined;
    if (input.referLink !== undefined) listing.referLink = String(input.referLink).trim() || undefined;
    if (input.referCode !== undefined) listing.referCode = String(input.referCode).trim() || undefined;
    if (input.completionCriteria !== undefined) {
      listing.completionCriteria = String(input.completionCriteria).trim() || undefined;
    }
    if (input.requiresSsn !== undefined) listing.requiresSsn = Boolean(input.requiresSsn);
    if (input.minDepositUsd !== undefined) {
      listing.minDepositUsd = Number(input.minDepositUsd) || undefined;
    }
    if (input.platformReward !== undefined) {
      listing.platformReward = Number(input.platformReward) || undefined;
    }
    if (canChangeMoney && input.buyerCashback !== undefined) {
      const cashback = Number(input.buyerCashback);
      if (!cashback || cashback <= 0) throw new Error('Buyer cashback required');
      listing.buyerCashback = cashback;
      const escrowSlots = listing.unlimitedSlots ? 1 : listing.maxSlots;
      const { escrowPerSlot, buyerPayPerSlot, totalLock } = calcListingEscrow(
        'refer',
        cashback,
        escrowSlots,
      );
      const prevLock = listing.escrowPerSlot * escrowSlots;
      const delta = totalLock - prevLock;
      if (delta > 0) {
        lockFunds(store, listing.sellerId, delta, listing.id, 'Edit listing extra escrow');
      } else if (delta < 0) {
        unlockFunds(store, listing.sellerId, -delta, listing.id, 'Edit listing escrow refund');
      }
      listing.escrowPerSlot = escrowPerSlot;
      listing.buyerPayPerSlot = buyerPayPerSlot;
    }
  }

  if (type === 'job_intel') {
    if (input.state !== undefined) listing.state = String(input.state).trim().toUpperCase() || undefined;
    if (input.city !== undefined) listing.city = String(input.city).trim() || undefined;
    if (input.jobTitle !== undefined) listing.jobTitle = String(input.jobTitle).trim() || undefined;
    if (input.employerHint !== undefined) {
      listing.employerHint = String(input.employerHint).trim() || undefined;
    }
    if (input.intelPreview !== undefined) {
      listing.intelPreview = String(input.intelPreview).trim() || undefined;
    }
    if (input.intelDetail !== undefined) {
      listing.intelDetail = String(input.intelDetail).trim() || undefined;
    }
    if (canChangeMoney && input.intelFee !== undefined) {
      const fee = Number(input.intelFee);
      if (!fee || fee <= 0) throw new Error('Intel fee required');
      listing.intelFee = fee;
      const escrowSlots = listing.unlimitedSlots ? 1 : listing.maxSlots;
      const { escrowPerSlot, buyerPayPerSlot, totalLock } = calcListingEscrow(
        'job_intel',
        fee,
        escrowSlots,
      );
      const prevLock = listing.escrowPerSlot * escrowSlots;
      const delta = totalLock - prevLock;
      if (delta > 0) {
        lockFunds(store, listing.sellerId, delta, listing.id, 'Edit listing extra escrow');
      } else if (delta < 0) {
        unlockFunds(store, listing.sellerId, -delta, listing.id, 'Edit listing escrow refund');
      }
      listing.escrowPerSlot = escrowPerSlot;
      listing.buyerPayPerSlot = buyerPayPerSlot;
    }
  }

  if (canChangeMoney && input.unlimitedSlots !== undefined) {
    listing.unlimitedSlots = Boolean(input.unlimitedSlots);
    if (listing.unlimitedSlots) listing.maxSlots = 0;
  }
  if (canChangeMoney && !listing.unlimitedSlots && input.maxSlots !== undefined) {
    const maxSlots = Number(input.maxSlots);
    if (!Number.isFinite(maxSlots) || maxSlots < 1 || maxSlots > 10000) {
      throw new Error('名额须为 1–10000，或选择无上限');
    }
    const payoutBase =
      type === 'refer' ? (listing.buyerCashback ?? 0) : (listing.intelFee ?? 0);
    const { escrowPerSlot, buyerPayPerSlot, totalLock } = calcListingEscrow(
      type,
      payoutBase,
      maxSlots,
    );
    const prevSlots = listing.unlimitedSlots ? 1 : listing.maxSlots;
    const prevLock = listing.escrowPerSlot * prevSlots;
    const delta = totalLock - prevLock;
    if (delta > 0) {
      lockFunds(store, listing.sellerId, delta, listing.id, 'Edit listing slots escrow');
    } else if (delta < 0) {
      unlockFunds(store, listing.sellerId, -delta, listing.id, 'Edit listing slots refund');
    }
    listing.maxSlots = maxSlots;
    listing.unlimitedSlots = false;
    listing.escrowPerSlot = escrowPerSlot;
    listing.buyerPayPerSlot = buyerPayPerSlot;
  }

  listing.updatedAt = new Date().toISOString();
  store.listings[listingId] = listing;
  await writeMarketStore(store);
  return sanitizeListingForPublic(listing, user.userId);
}

/** 发布者更新已参与人数（slotsUsed） */
export async function updateMarketListingSlotsUsed(
  user: MarketUser,
  listingId: string,
  slotsUsed: number,
) {
  if (!Number.isFinite(slotsUsed) || slotsUsed < 0 || slotsUsed > 100000) {
    throw new Error('参与人数无效');
  }
  const store = await readMarketStore();
  const listing = store.listings[listingId];
  if (!listing) throw new Error('Listing not found');
  if (listing.sellerId !== user.userId && user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  listing.slotsUsed = Math.floor(slotsUsed);
  if (!listing.unlimitedSlots && listing.maxSlots > 0) {
    if (listing.slotsUsed >= listing.maxSlots) {
      listing.status = 'sold_out';
    } else if (listing.status === 'sold_out') {
      listing.status = 'active';
    }
  }
  listing.updatedAt = new Date().toISOString();
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
