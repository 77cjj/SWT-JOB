import {
  AUTO_CONFIRM_DAYS,
  type DisputeWinner,
  type MarketOrder,
  type MarketStoreData,
  type MarketUser,
  type OrderAction,
} from './types';
import { displayName, isAdmin } from './auth';
import { getIntelDetailForBuyer } from './listings';
import { newId, readMarketStore, writeMarketStore } from './store';
import {
  calcPlatformFee,
  getWallet,
  lockFunds,
  refundLocked,
  releaseToBuyer,
  unlockFunds,
} from './wallet';

function bumpStats(
  store: MarketStoreData,
  userId: string,
  field: 'completedAsSeller' | 'completedAsBuyer' | 'disputes',
) {
  store.userStats[userId] ??= {
    completedAsSeller: 0,
    completedAsBuyer: 0,
    disputes: 0,
    rating: 5,
  };
  store.userStats[userId][field] += 1;
}

export async function runAutoConfirmPass(store: MarketStoreData) {
  const now = Date.now();
  for (const order of Object.values(store.orders)) {
    if (order.status !== 'proof_submitted') continue;
    if (!order.autoConfirmDeadline) continue;
    if (new Date(order.autoConfirmDeadline).getTime() > now) continue;
    await completeOrder(store, order.id, 'auto');
  }
}

async function completeOrder(
  store: MarketStoreData,
  orderId: string,
  mode: 'seller' | 'auto' | 'admin',
) {
  const order = store.orders[orderId];
  if (!order) throw new Error('Order not found');
  if (!['proof_submitted', 'seller_confirmed', 'disputed'].includes(order.status)) {
    throw new Error('Order cannot be completed');
  }

  const listing = store.listings[order.listingId];
  if (!listing) throw new Error('Listing missing');

  if (listing.type === 'refer') {
    releaseToBuyer(
      store,
      listing.sellerId,
      order.buyerId,
      order.escrowAmount,
      order.platformFee,
      order.id,
    );
  } else {
    releaseToBuyer(
      store,
      order.buyerId,
      listing.sellerId,
      order.escrowAmount,
      order.platformFee,
      order.id,
    );
    unlockFunds(
      store,
      listing.sellerId,
      listing.escrowPerSlot,
      listing.id,
      `Job intel slot released ${order.id}`,
    );
  }

  order.status = 'completed';
  order.confirmedAt = new Date().toISOString();
  order.completedAt = order.confirmedAt;
  if (mode === 'auto') order.adminNote = 'Auto-confirmed after deadline';
  store.orders[orderId] = order;

  bumpStats(store, order.sellerId, 'completedAsSeller');
  bumpStats(store, order.buyerId, 'completedAsBuyer');
}

async function refundOrder(store: MarketStoreData, orderId: string, reason: string) {
  const order = store.orders[orderId];
  if (!order) throw new Error('Order not found');
  const listing = store.listings[order.listingId];
  if (!listing) throw new Error('Listing missing');

  if (listing.type === 'refer') {
    unlockFunds(
      store,
      listing.sellerId,
      order.escrowAmount,
      listing.id,
      `Refer refund: ${reason}`,
    );
  } else {
    refundLocked(store, order.buyerId, order.escrowAmount, order.id);
  }

  order.status = 'refunded';
  order.adminNote = reason;
  order.completedAt = new Date().toISOString();
  store.orders[orderId] = order;
}

export async function listMarketOrders(user: MarketUser, role: 'buyer' | 'seller' | 'all') {
  const store = await readMarketStore();
  await runAutoConfirmPass(store);
  await writeMarketStore(store);

  let orders = Object.values(store.orders);
  if (role === 'buyer') orders = orders.filter((o) => o.buyerId === user.userId);
  if (role === 'seller') orders = orders.filter((o) => o.sellerId === user.userId);
  if (role === 'all' && !isAdmin(user)) {
    orders = orders.filter(
      (o) => o.buyerId === user.userId || o.sellerId === user.userId,
    );
  }

  orders.sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));

  return orders.map((order) => ({
    ...order,
    intelDetail:
      order.listingType === 'job_intel' && order.status === 'completed'
        ? getIntelDetailForBuyer(store, order.listingId, order.buyerId)
        : undefined,
    referAccess:
      order.listingType === 'refer' &&
      order.buyerId === user.userId &&
      !['refunded', 'cancelled'].includes(order.status)
        ? {
            referLink: store.listings[order.listingId]?.referLink,
            referCode: store.listings[order.listingId]?.referCode,
          }
        : undefined,
  }));
}

export async function claimMarketOrder(user: MarketUser, listingId: string) {
  const store = await readMarketStore();
  await runAutoConfirmPass(store);

  const listing = store.listings[listingId];
  if (!listing) throw new Error('Listing not found');
  if (listing.status !== 'active') throw new Error('Listing not active');
  if (listing.sellerId === user.userId) throw new Error('Cannot claim own listing');
  if (
    !listing.unlimitedSlots &&
    listing.maxSlots > 0 &&
    listing.slotsUsed >= listing.maxSlots
  ) {
    throw new Error('No slots left');
  }

  const existing = Object.values(store.orders).find(
    (o) =>
      o.listingId === listingId &&
      o.buyerId === user.userId &&
      !['completed', 'refunded', 'cancelled'].includes(o.status),
  );
  if (existing) throw new Error('You already have an active order for this listing');

  let buyerLock = 0;
  let escrowAmount = listing.escrowPerSlot;
  let buyerPayout = listing.buyerCashback ?? 0;

  if (listing.type === 'job_intel') {
    buyerLock = listing.buyerPayPerSlot;
    escrowAmount = buyerLock;
    buyerPayout = buyerLock;
    const wallet = getWallet(store, user.userId);
    if (wallet.balance < buyerLock) {
      throw new Error(
        `Insufficient balance. Need $${buyerLock.toFixed(2)} to purchase intel`,
      );
    }
    lockFunds(store, user.userId, buyerLock, listing.id, `Job intel purchase ${listing.title}`);
  }

  const platformFee = calcPlatformFee(buyerPayout);
  const order: MarketOrder = {
    id: newId('ord'),
    listingId: listing.id,
    listingType: listing.type,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    buyerId: user.userId,
    buyerName: displayName(user),
    status: 'claimed',
    escrowAmount,
    buyerPayout,
    platformFee,
    claimedAt: new Date().toISOString(),
  };

  listing.slotsUsed += 1;
  if (
    !listing.unlimitedSlots &&
    listing.maxSlots > 0 &&
    listing.slotsUsed >= listing.maxSlots
  ) {
    listing.status = 'sold_out';
  }
  listing.updatedAt = new Date().toISOString();

  store.orders[order.id] = order;
  store.listings[listing.id] = listing;
  await writeMarketStore(store);

  return {
    ...order,
    referAccess:
      listing.type === 'refer'
        ? { referLink: listing.referLink, referCode: listing.referCode }
        : undefined,
  };
}

export async function performOrderAction(
  user: MarketUser,
  orderId: string,
  action: OrderAction,
  payload?: { proofNote?: string; disputeReason?: string; winner?: DisputeWinner },
) {
  const store = await readMarketStore();
  await runAutoConfirmPass(store);

  const order = store.orders[orderId];
  if (!order) throw new Error('Order not found');

  const isBuyer = order.buyerId === user.userId;
  const isSeller = order.sellerId === user.userId;

  if (action === 'submit_proof') {
    if (!isBuyer) throw new Error('Forbidden');
    if (order.status !== 'claimed') throw new Error('Invalid order status');
    const proofNote = payload?.proofNote?.trim();
    if (!proofNote) throw new Error('Proof note required');
    order.proofNote = proofNote;
    order.status = 'proof_submitted';
    order.proofSubmittedAt = new Date().toISOString();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + AUTO_CONFIRM_DAYS);
    order.autoConfirmDeadline = deadline.toISOString();
  }

  if (action === 'confirm') {
    if (!isSeller) throw new Error('Forbidden');
    if (order.status !== 'proof_submitted') throw new Error('Awaiting proof');
    await completeOrder(store, orderId, 'seller');
  }

  if (action === 'dispute') {
    if (!isBuyer && !isSeller) throw new Error('Forbidden');
    if (!['claimed', 'proof_submitted'].includes(order.status)) {
      throw new Error('Cannot dispute at this stage');
    }
    order.status = 'disputed';
    order.disputeReason = payload?.disputeReason?.trim() || 'No reason provided';
    order.disputeBy = isBuyer ? 'buyer' : 'seller';
    bumpStats(store, user.userId, 'disputes');
  }

  if (action === 'cancel') {
    if (!isBuyer) throw new Error('Forbidden');
    if (order.status !== 'claimed') throw new Error('Can only cancel before proof');
    await refundOrder(store, orderId, 'Buyer cancelled');
    const listing = store.listings[order.listingId];
    if (listing) {
      listing.slotsUsed = Math.max(0, listing.slotsUsed - 1);
      if (listing.status === 'sold_out' && listing.slotsUsed < listing.maxSlots) {
        listing.status = 'active';
      }
      listing.updatedAt = new Date().toISOString();
      store.listings[listing.id] = listing;
    }
    await writeMarketStore(store);
    return order;
  }

  if (action === 'admin_resolve') {
    if (!isAdmin(user)) throw new Error('Admin only');
    if (order.status !== 'disputed') throw new Error('Not in dispute');
    const winner = payload?.winner;
    if (!winner) throw new Error('Winner required');
    order.disputeWinner = winner;
    order.adminNote = payload?.disputeReason?.trim() || `Resolved for ${winner}`;
    if (winner === 'buyer') {
      if (order.listingType === 'refer') {
        await completeOrder(store, orderId, 'admin');
      } else {
        await refundOrder(store, orderId, 'Admin resolved for buyer');
      }
    } else {
      if (order.listingType === 'refer') {
        await refundOrder(store, orderId, 'Admin resolved for seller');
      } else {
        await completeOrder(store, orderId, 'admin');
      }
    }
    await writeMarketStore(store);
    return order;
  }

  store.orders[orderId] = order;
  await writeMarketStore(store);

  const intelDetail =
    order.listingType === 'job_intel' && order.status === 'completed'
      ? getIntelDetailForBuyer(store, order.listingId, order.buyerId)
      : undefined;

  return { ...order, intelDetail };
}

export async function getMarketOrder(user: MarketUser, orderId: string) {
  const store = await readMarketStore();
  await runAutoConfirmPass(store);
  await writeMarketStore(store);

  const order = store.orders[orderId];
  if (!order) return null;
  if (
    order.buyerId !== user.userId &&
    order.sellerId !== user.userId &&
    !isAdmin(user)
  ) {
    return null;
  }

  const listing = store.listings[order.listingId];
  const intelDetail =
    order.listingType === 'job_intel' && order.status === 'completed'
      ? listing?.intelDetail
      : undefined;

  const referAccess =
    order.listingType === 'refer' &&
    order.buyerId === user.userId &&
    !['refunded', 'cancelled'].includes(order.status)
      ? { referLink: listing?.referLink, referCode: listing?.referCode }
      : undefined;

  return {
    ...order,
    intelDetail,
    referAccess,
    listing: listing
      ? {
          ...listing,
          intelDetail: undefined,
          referLink: undefined,
          referCode: undefined,
        }
      : null,
  };
}

export async function getDisputedOrders() {
  const store = await readMarketStore();
  return Object.values(store.orders).filter((o) => o.status === 'disputed');
}
