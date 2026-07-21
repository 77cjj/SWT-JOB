import path from 'node:path';

/** Vercel 仅 /tmp 可写；本地默认 .data/marketplace.json */
export function getMarketplaceStorePath(): string {
  const custom = process.env.MARKETPLACE_STORE_PATH?.trim();
  if (custom) return custom;
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return path.join('/tmp', 'swt-marketplace.json');
  }
  return path.join(process.cwd(), '.data', 'marketplace.json');
}
