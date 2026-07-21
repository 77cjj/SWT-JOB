import { api } from '@/services/api';
import type { ReferralProgram } from '../../data/referralDeals';
import { referralPrograms as staticPrograms } from '../../data/referralDeals';

export interface ReferralDealRecord {
  id: string;
  siteRebateUsd?: number | null;
  siteRebateLabelZh?: string | null;
  siteRebateLabelEn?: string | null;
  program: ReferralProgram;
  sortOrder?: number;
  published?: number;
}

export interface ReferralDealSavePayload {
  id: string;
  siteRebateUsd?: number | null;
  siteRebateLabelZh?: string;
  siteRebateLabelEn?: string;
  programJson: string;
  sortOrder?: number;
  published?: number;
}

function applyRecord(base: ReferralProgram, record: ReferralDealRecord): ReferralProgram {
  const merged: ReferralProgram = {
    ...base,
    ...record.program,
    id: record.id,
    editions: record.program.editions?.length ? record.program.editions : base.editions,
  };
  if (record.siteRebateUsd != null) {
    merged.siteRebateUsd = Number(record.siteRebateUsd);
  }
  if (record.siteRebateLabelZh || record.siteRebateLabelEn) {
    merged.siteRebateLabel = {
      zh: record.siteRebateLabelZh || merged.siteRebateLabel?.zh || '',
      en: record.siteRebateLabelEn || merged.siteRebateLabel?.en || '',
    };
  }
  return merged;
}

export function mergeReferralPrograms(records: ReferralDealRecord[]): ReferralProgram[] {
  const map = new Map(staticPrograms.map((p) => [p.id, p]));
  for (const record of records) {
    if (!record?.id || !record.program) continue;
    const base = map.get(record.id) || record.program;
    map.set(record.id, applyRecord(base, record));
  }
  return Array.from(map.values());
}

export async function fetchPublicReferralDeals(): Promise<ReferralDealRecord[]> {
  return api.get<ReferralDealRecord[]>('/referral-deals/public');
}

export async function fetchPublicReferralDeal(id: string): Promise<ReferralDealRecord> {
  return api.get<ReferralDealRecord>(`/referral-deals/public/${id}`);
}

export async function fetchAdminReferralDeals(): Promise<ReferralDealRecord[]> {
  return api.get<ReferralDealRecord[]>('/referral-deals');
}

export async function saveReferralDeal(id: string, payload: ReferralDealSavePayload, isNew: boolean) {
  if (isNew) {
    return api.post<string>('/referral-deals', payload);
  }
  await api.put(`/referral-deals/${id}`, payload);
}

export async function deleteReferralDeal(id: string) {
  await api.delete(`/referral-deals/${id}`);
}

export async function bulkUpsertReferralDeals(items: ReferralDealSavePayload[]) {
  await api.post('/referral-deals/bulk-upsert', { items });
}

export function programToSavePayload(program: ReferralProgram, published = 1, sortOrder = 0): ReferralDealSavePayload {
  const { siteRebateUsd, siteRebateLabel, ...jsonProgram } = program;
  return {
    id: program.id,
    siteRebateUsd: siteRebateUsd ?? null,
    siteRebateLabelZh: siteRebateLabel?.zh ?? '',
    siteRebateLabelEn: siteRebateLabel?.en ?? '',
    programJson: JSON.stringify(jsonProgram, null, 2),
    sortOrder,
    published,
  };
}
