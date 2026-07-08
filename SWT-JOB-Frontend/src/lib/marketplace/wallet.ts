import {
  JOB_INTEL_MIN_SELLER_DEPOSIT,
  JOB_INTEL_SELLER_DEPOSIT_RATE,
  PLATFORM_FEE_RATE,
  type ListingType,
  type MarketStoreData,
  type WalletAccount,
  type WalletTransaction,
} from './types';
import { newId } from './store';

function defaultWallet(userId: string): WalletAccount {
  return { userId, balance: 0, locked: 0, deposited: 0, earned: 0 };
}

export function getWallet(store: MarketStoreData, userId: string): WalletAccount {
  return store.wallets[userId] ?? defaultWallet(userId);
}

function pushTx(
  store: MarketStoreData,
  tx: Omit<WalletTransaction, 'id' | 'createdAt'>,
) {
  store.transactions.unshift({
    ...tx,
    id: newId('tx'),
    createdAt: new Date().toISOString(),
  });
  if (store.transactions.length > 500) {
    store.transactions.length = 500;
  }
}

export function depositWallet(
  store: MarketStoreData,
  userId: string,
  amount: number,
  note?: string,
) {
  if (amount <= 0) throw new Error('Invalid deposit amount');
  const wallet = getWallet(store, userId);
  wallet.balance += amount;
  wallet.deposited += amount;
  store.wallets[userId] = wallet;
  pushTx(store, { userId, type: 'deposit', amount, note });
}

export function lockFunds(
  store: MarketStoreData,
  userId: string,
  amount: number,
  listingId?: string,
  note?: string,
) {
  if (amount <= 0) throw new Error('Invalid lock amount');
  const wallet = getWallet(store, userId);
  if (wallet.balance < amount) throw new Error('Insufficient balance');
  wallet.balance -= amount;
  wallet.locked += amount;
  store.wallets[userId] = wallet;
  pushTx(store, { userId, type: 'lock', amount, listingId, note });
}

export function unlockFunds(
  store: MarketStoreData,
  userId: string,
  amount: number,
  listingId?: string,
  note?: string,
) {
  if (amount <= 0) throw new Error('Invalid unlock amount');
  const wallet = getWallet(store, userId);
  if (wallet.locked < amount) throw new Error('Insufficient locked balance');
  wallet.locked -= amount;
  wallet.balance += amount;
  store.wallets[userId] = wallet;
  pushTx(store, { userId, type: 'unlock', amount, listingId, note });
}

export function releaseToBuyer(
  store: MarketStoreData,
  fromUserId: string,
  toUserId: string,
  grossAmount: number,
  platformFee: number,
  orderId: string,
) {
  const net = grossAmount - platformFee;
  if (net < 0) throw new Error('Invalid payout');

  const fromWallet = getWallet(store, fromUserId);
  if (fromWallet.locked < grossAmount) throw new Error('Insufficient escrow');

  fromWallet.locked -= grossAmount;
  store.wallets[fromUserId] = fromWallet;

  const toWallet = getWallet(store, toUserId);
  toWallet.balance += net;
  toWallet.earned += net;
  store.wallets[toUserId] = toWallet;

  pushTx(store, {
    userId: toUserId,
    type: 'release_to_buyer',
    amount: net,
    orderId,
    note: `Payout (fee $${platformFee.toFixed(2)})`,
  });

  if (platformFee > 0) {
    pushTx(store, {
      userId: fromUserId,
      type: 'platform_fee',
      amount: platformFee,
      orderId,
    });
  }
}

export function releaseEscrowToSeller(
  store: MarketStoreData,
  sellerId: string,
  amount: number,
  orderId: string,
) {
  const wallet = getWallet(store, sellerId);
  if (wallet.locked < amount) throw new Error('Insufficient locked escrow');
  wallet.locked -= amount;
  wallet.balance += amount;
  wallet.earned += amount;
  store.wallets[sellerId] = wallet;
  pushTx(store, {
    userId: sellerId,
    type: 'release_to_seller',
    amount,
    orderId,
  });
}

export function refundLocked(
  store: MarketStoreData,
  userId: string,
  amount: number,
  orderId: string,
) {
  unlockFunds(store, userId, amount, undefined, `Refund order ${orderId}`);
  pushTx(store, { userId, type: 'refund', amount, orderId });
}

export function calcReferListingEscrow(buyerCashback: number, maxSlots: number) {
  const perSlot = buyerCashback;
  const total = perSlot * maxSlots * (1 + PLATFORM_FEE_RATE);
  return { escrowPerSlot: perSlot, buyerPayPerSlot: 0, totalLock: total };
}

export function calcJobIntelListingEscrow(intelFee: number, maxSlots: number) {
  const depositPerSlot = Math.max(
    JOB_INTEL_MIN_SELLER_DEPOSIT,
    intelFee * JOB_INTEL_SELLER_DEPOSIT_RATE,
  );
  return {
    escrowPerSlot: depositPerSlot,
    buyerPayPerSlot: intelFee,
    totalLock: depositPerSlot * maxSlots,
  };
}

export function calcListingEscrow(
  type: ListingType,
  buyerCashbackOrFee: number,
  maxSlots: number,
) {
  if (type === 'refer') {
    return calcReferListingEscrow(buyerCashbackOrFee, maxSlots);
  }
  return calcJobIntelListingEscrow(buyerCashbackOrFee, maxSlots);
}

export function calcPlatformFee(payout: number) {
  return Math.round(payout * PLATFORM_FEE_RATE * 100) / 100;
}
