import { RAGENT_API_BASE_URL } from '@/config/runtimeEnv';
import { storage } from '@/utils/storage';

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

export type JobIntelContributionPayload = {
  jobId?: string;
  state: string;
  jobTitle: string;
  hourlyWage?: number;
  notes: string;
};

export async function submitJobIntelContribution(payload: JobIntelContributionPayload): Promise<string> {
  const res = await fetch(`${baseUrl()}/job-intel/contributions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return parseResult<string>(res);
}

export type JobIntelContributionRecord = {
  id: string;
  jobId?: string | null;
  submitterId: string;
  stateCode?: string | null;
  jobTitle?: string | null;
  hourlyWage?: number | null;
  notes: string;
  status: string;
  adminSummary?: string | null;
  published?: boolean;
  createTime?: string;
  updateTime?: string;
};

export async function fetchAdminContributions(status?: string): Promise<JobIntelContributionRecord[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${baseUrl()}/job-intel/contributions${q}`, { headers: headers() });
  return parseResult<JobIntelContributionRecord[]>(res);
}

export async function reviewContribution(
  id: string,
  body: { status?: string; adminSummary?: string; published?: boolean; jobId?: string },
): Promise<void> {
  const res = await fetch(`${baseUrl()}/job-intel/contributions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  await parseResult<null>(res);
}

export type JobIntelDocumentRecord = {
  id: string;
  jobId: string;
  kind: string;
  title?: string | null;
  body: string;
  uploaderId: string;
  status: string;
  createTime?: string;
};

export async function fetchAdminDocuments(status?: string): Promise<JobIntelDocumentRecord[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${baseUrl()}/job-intel/documents${q}`, { headers: headers() });
  return parseResult<JobIntelDocumentRecord[]>(res);
}

export async function reviewDocument(
  id: string,
  body: { status?: string; title?: string; body?: string },
): Promise<void> {
  const res = await fetch(`${baseUrl()}/job-intel/documents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  await parseResult<null>(res);
}
