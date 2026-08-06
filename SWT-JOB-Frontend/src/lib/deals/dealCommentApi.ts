import { RAGENT_API_BASE_URL } from '@/config/runtimeEnv';
import { storage } from '@/utils/storage';

export type DealCommentRecord = {
  id: string;
  dealId: string;
  userId: string;
  parentId?: string | null;
  body: string;
  status: string;
  helpfulCount?: number;
  dislikeCount?: number;
  createTime?: string;
  updateTime?: string;
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
  const json = (await res.json()) as { code?: number; data?: T; message?: string };
  if (json.code === 0 || json.code === 200) {
    return json.data as T;
  }
  throw new Error(json.message || `HTTP ${res.status}`);
}

export async function fetchPublicDealComments(dealId: string): Promise<DealCommentRecord[]> {
  const res = await fetch(
    `${baseUrl()}/public/deal-comments?dealId=${encodeURIComponent(dealId)}`,
    { headers: { Accept: 'application/json' } },
  );
  return parseResult<DealCommentRecord[]>(res);
}

export async function submitDealComment(payload: {
  dealId: string;
  body: string;
  parentId?: string;
}): Promise<string> {
  const res = await fetch(`${baseUrl()}/deal-comments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return parseResult<string>(res);
}

export async function fetchAdminDealComments(dealId?: string): Promise<DealCommentRecord[]> {
  const q = dealId ? `?dealId=${encodeURIComponent(dealId)}` : '';
  const res = await fetch(`${baseUrl()}/admin/deal-comments${q}`, { headers: headers() });
  return parseResult<DealCommentRecord[]>(res);
}

export async function updateAdminDealComment(
  id: string,
  body: { status?: string; body?: string },
): Promise<void> {
  const res = await fetch(`${baseUrl()}/admin/deal-comments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  await parseResult<null>(res);
}

export async function deleteAdminDealComment(id: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/admin/deal-comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  await parseResult<null>(res);
}
