import fs from 'node:fs/promises';
import path from 'node:path';

import type { MarketStoreData } from './types';
import { buildSeedListings, DEMO_SELLER_ID, isSeedListing } from './seed';

const STORE_PATH = path.join(process.cwd(), '.data/marketplace.json');

export function emptyMarketStore(): MarketStoreData {
  return {
    listings: {},
    orders: {},
    wallets: {},
    transactions: [],
    userStats: {},
  };
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(emptyMarketStore(), null, 2), 'utf8');
  }
}

async function readRawMarketStore(): Promise<MarketStoreData> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as MarketStoreData;
    return {
      listings: parsed.listings ?? {},
      orders: parsed.orders ?? {},
      wallets: parsed.wallets ?? {},
      transactions: parsed.transactions ?? [],
      userStats: parsed.userStats ?? {},
    };
  } catch {
    return emptyMarketStore();
  }
}

function ensureDemoListings(store: MarketStoreData): { store: MarketStoreData; changed: boolean } {
  const seeds = buildSeedListings();
  let changed = false;
  const listings = { ...store.listings };

  for (const [id, listing] of Object.entries(seeds)) {
    if (!listings[id]) {
      listings[id] = listing;
      changed = true;
    }
  }

  if (!changed) return { store, changed: false };

  return {
    store: {
      ...store,
      listings,
      userStats: {
        ...store.userStats,
        [DEMO_SELLER_ID]: store.userStats[DEMO_SELLER_ID] ?? {
          completedAsSeller: 11,
          completedAsBuyer: 2,
          disputes: 0,
          rating: 4.9,
        },
      },
    },
    changed: true,
  };
}

export async function readMarketStore(): Promise<MarketStoreData> {
  const data = await readRawMarketStore();
  const hasAnyListing = Object.keys(data.listings).length > 0;
  const hasOnlySeeds =
    hasAnyListing && Object.keys(data.listings).every((id) => isSeedListing(id));

  if (!hasAnyListing || hasOnlySeeds) {
    const { store: seeded, changed } = ensureDemoListings(data);
    if (changed) {
      await writeMarketStore(seeded);
    }
    return seeded;
  }

  return data;
}

export async function writeMarketStore(data: MarketStoreData) {
  await ensureStoreFile();
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
