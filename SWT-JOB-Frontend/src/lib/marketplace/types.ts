export type ListingType = 'refer' | 'job_intel';

export type ListingStatus = 'active' | 'paused' | 'sold_out' | 'closed';

export type OrderStatus =
  | 'claimed'
  | 'proof_submitted'
  | 'seller_confirmed'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export type OrderAction =
  | 'submit_proof'
  | 'confirm'
  | 'dispute'
  | 'cancel'
  | 'admin_resolve';

export type DisputeWinner = 'buyer' | 'seller';

export const PLATFORM_FEE_RATE = 0.1;
export const AUTO_CONFIRM_DAYS = 7;
export const MIN_WALLET_DEPOSIT = 5;
export const JOB_INTEL_SELLER_DEPOSIT_RATE = 0.2;
export const JOB_INTEL_MIN_SELLER_DEPOSIT = 5;

export interface MarketListing {
  id: string;
  type: ListingType;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  brand?: string;
  referLink?: string;
  referCode?: string;
  platformReward?: number;
  buyerCashback?: number;
  completionCriteria?: string;
  /** 是否需要 SSN */
  requiresSsn?: boolean;
  /** 最低存款要求（USD） */
  minDepositUsd?: number;
  /** true = 名额不限（maxSlots 仅作展示上限时可忽略） */
  unlimitedSlots?: boolean;
  /** 发布者公开联系方式（按隐私设置） */
  sellerContactHint?: string;
  sellerAvatarUrl?: string;
  state?: string;
  city?: string;
  jobTitle?: string;
  employerHint?: string;
  intelFee?: number;
  intelPreview?: string;
  intelDetail?: string;
  escrowPerSlot: number;
  buyerPayPerSlot: number;
  priceCurrency: 'USD';
  maxSlots: number;
  slotsUsed: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface MarketOrder {
  id: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  status: OrderStatus;
  escrowAmount: number;
  buyerPayout: number;
  platformFee: number;
  proofNote?: string;
  disputeReason?: string;
  disputeBy?: 'buyer' | 'seller';
  adminNote?: string;
  disputeWinner?: DisputeWinner;
  claimedAt: string;
  proofSubmittedAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  autoConfirmDeadline?: string;
}

export interface WalletAccount {
  userId: string;
  balance: number;
  locked: number;
  deposited: number;
  earned: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type:
    | 'deposit'
    | 'lock'
    | 'unlock'
    | 'release_to_buyer'
    | 'release_to_seller'
    | 'platform_fee'
    | 'refund';
  amount: number;
  orderId?: string;
  listingId?: string;
  note?: string;
  createdAt: string;
}

export interface UserMarketStats {
  completedAsSeller: number;
  completedAsBuyer: number;
  disputes: number;
  rating: number;
}

export interface MarketStoreData {
  listings: Record<string, MarketListing>;
  orders: Record<string, MarketOrder>;
  wallets: Record<string, WalletAccount>;
  transactions: WalletTransaction[];
  userStats: Record<string, UserMarketStats>;
}

export interface MarketUser {
  userId: string;
  username?: string;
  role?: string;
}
