import { RAGENT_API_BASE_URL } from '@/config/runtimeEnv';
import { storage } from '@/utils/storage';
import { parseRagentResultResponse } from '../api/parseJsonResponse';

export type SiteFeatureKey = 'chat' | 'deals' | 'compare' | 'jobs' | 'docs';

export type SiteFeatureMap = Record<SiteFeatureKey, boolean>;

export type SiteFeatureFlagRecord = {
  key: SiteFeatureKey;
  enabled: boolean;
  labelZh?: string;
  sortOrder?: number;
};

const DEFAULT_FEATURES: SiteFeatureMap = {
  chat: true,
  deals: true,
  compare: true,
  jobs: false,
  docs: false,
};

function baseUrl() {
  return RAGENT_API_BASE_URL.replace(/\/$/, '');
}

function headers(): Record<string, string> {
  const token = storage.getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = token;
  return h;
}

async function parseResult<T>(res: Response): Promise<T> {
  return parseRagentResultResponse<T>(res);
}

export function getDefaultSiteFeatures(): SiteFeatureMap {
  return { ...DEFAULT_FEATURES };
}

export function normalizeFeatureMap(raw: Partial<Record<string, boolean>> | null | undefined): SiteFeatureMap {
  const next = getDefaultSiteFeatures();
  if (!raw) return next;
  (Object.keys(next) as SiteFeatureKey[]).forEach((key) => {
    if (typeof raw[key] === 'boolean') {
      next[key] = raw[key] as boolean;
    }
  });
  return next;
}

export async function fetchPublicSiteFeatures(): Promise<SiteFeatureMap> {
  try {
    const res = await fetch(`${baseUrl()}/public/site-features`, {
      headers: { Accept: 'application/json' },
    });
    const data = await parseResult<Partial<Record<string, boolean>>>(res);
    return normalizeFeatureMap(data);
  } catch {
    return getDefaultSiteFeatures();
  }
}

export async function fetchAdminSiteFeatures(): Promise<SiteFeatureFlagRecord[]> {
  const res = await fetch(`${baseUrl()}/admin/site-features`, { headers: headers() });
  return parseResult<SiteFeatureFlagRecord[]>(res);
}

export async function updateAdminSiteFeatures(
  flags: Partial<Record<SiteFeatureKey, boolean>>,
): Promise<SiteFeatureFlagRecord[]> {
  const res = await fetch(`${baseUrl()}/admin/site-features`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ flags }),
  });
  return parseResult<SiteFeatureFlagRecord[]>(res);
}

/** 根据路由解析对应的功能键 */
export function featureKeyForPath(pathname: string): SiteFeatureKey | null {
  if (!pathname) return null;
  if (pathname === '/' || pathname.startsWith('/chat')) return 'chat';
  if (pathname === '/deals' || pathname.startsWith('/deals/')) return 'deals';
  if (pathname === '/compare' || pathname.startsWith('/compare/')) return 'compare';
  if (pathname === '/jobs' || pathname.startsWith('/jobs/')) return 'jobs';
  if (pathname === '/docs' || pathname.startsWith('/docs/')) return 'docs';
  return null;
}

export const FEATURE_HREFS: Record<SiteFeatureKey, string> = {
  chat: '/',
  deals: '/deals',
  compare: '/compare',
  jobs: '/jobs',
  docs: '/docs',
};

export function firstEnabledHref(features: SiteFeatureMap): string {
  const order: SiteFeatureKey[] = ['chat', 'deals', 'compare', 'jobs', 'docs'];
  for (const key of order) {
    if (features[key] !== false) return FEATURE_HREFS[key];
  }
  return '/';
}
