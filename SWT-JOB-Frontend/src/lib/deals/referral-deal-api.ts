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
  aiEnabled?: number;
}

export interface ReferralDealSavePayload {
  id: string;
  siteRebateUsd?: number | null;
  siteRebateLabelZh?: string;
  siteRebateLabelEn?: string;
  programJson: string;
  sortOrder?: number;
  published?: number;
  aiEnabled?: number;
}

export type DealRecordSource = 'static' | 'database';

export interface AdminDealRow {
  program: ReferralProgram;
  source: DealRecordSource;
  inDatabase: boolean;
  published: number;
  sortOrder: number;
  aiEnabled: number;
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

/** 前台合并：静态 + 数据库上架项，排除已隐藏 ID */
export function mergeReferralPrograms(
  records: ReferralDealRecord[],
  excludedIds: string[] = [],
): ReferralProgram[] {
  const excluded = new Set(excludedIds);
  const recordMap = new Map(records.map((r) => [r.id, r]));
  const map = new Map<string, ReferralProgram>();

  for (const base of staticPrograms) {
    if (excluded.has(base.id)) continue;
    const record = recordMap.get(base.id);
    if (record && record.published === 0) continue;
    map.set(base.id, record ? applyRecord(base, record) : base);
  }

  for (const record of records) {
    if (!record?.id || !record.program || record.published === 0) continue;
    if (map.has(record.id)) continue;
    map.set(record.id, applyRecord(record.program, record));
  }

  return Array.from(map.values());
}

/** 后台列表：静态 + 数据库，带来源与上下架状态 */
export function buildAdminDealRows(records: ReferralDealRecord[]): AdminDealRow[] {
  const recordMap = new Map(records.map((r) => [r.id, r]));
  const rows: AdminDealRow[] = [];
  const seen = new Set<string>();

  for (const base of staticPrograms) {
    const record = recordMap.get(base.id);
    seen.add(base.id);
    rows.push({
      program: record ? applyRecord(base, record) : base,
      source: record ? 'database' : 'static',
      inDatabase: Boolean(record),
      published: record?.published ?? 1,
      sortOrder: record?.sortOrder ?? 9999,
      aiEnabled: record != null ? (record.aiEnabled ?? 1) : 0,
    });
  }

  for (const record of records) {
    if (seen.has(record.id)) continue;
    rows.push({
      program: applyRecord(record.program, record),
      source: 'database',
      inDatabase: true,
      published: record.published ?? 1,
      sortOrder: record.sortOrder ?? 9999,
      aiEnabled: record.aiEnabled ?? 1,
    });
  }

  return rows.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.program.brandName.zh.localeCompare(b.program.brandName.zh, 'zh');
  });
}

export function tombstonePayload(id: string, title: string): ReferralDealSavePayload {
  const program: ReferralProgram = {
    id,
    category: 'other',
    offerKind: 'refer',
    brandName: { zh: title, en: title },
    editions: [
      {
        id: `${id}-hidden`,
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '已隐藏', en: 'Hidden' },
        summary: { zh: '管理员已从前台隐藏', en: 'Hidden by admin' },
        requirements: { zh: [], en: [] },
      },
    ],
  };
  return programToSavePayload(program, 0, 9999);
}

export async function fetchPublicReferralDeals(): Promise<ReferralDealRecord[]> {
  return api.get<ReferralDealRecord[]>('/referral-deals/public');
}

export async function fetchExcludedDealIds(): Promise<string[]> {
  try {
    return await api.get<string[]>('/referral-deals/public/excluded-ids');
  } catch {
    try {
      return await api.get<string[]>('/referral-deals/excluded-ids');
    } catch {
      return [];
    }
  }
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

export async function hideReferralDeal(id: string, title: string, isNew: boolean) {
  await saveReferralDeal(id, tombstonePayload(id, title), isNew);
}

export async function bulkUpsertReferralDeals(items: ReferralDealSavePayload[]) {
  await api.post('/referral-deals/bulk-upsert', { items });
}

export async function setReferralDealAiEnabled(id: string, enabled: number) {
  await api.post(`/referral-deals/${id}/ai-enabled?enabled=${enabled}`);
}

export async function bulkSetReferralDealAiEnabled(enabled: number, ids?: string[]) {
  return api.post<number>('/referral-deals/bulk-ai-enabled', { aiEnabled: enabled, ids });
}

export async function seedMissingReferralDeals() {
  return api.post<number>('/referral-deals/seed-missing');
}

export function programToSavePayload(
  program: ReferralProgram,
  published = 1,
  sortOrder = 0,
  aiEnabled = 1,
): ReferralDealSavePayload {
  const { siteRebateUsd, siteRebateLabel, ...jsonProgram } = program;
  return {
    id: program.id,
    siteRebateUsd: siteRebateUsd ?? null,
    siteRebateLabelZh: siteRebateLabel?.zh ?? '',
    siteRebateLabelEn: siteRebateLabel?.en ?? '',
    programJson: JSON.stringify(jsonProgram, null, 2),
    sortOrder,
    published,
    aiEnabled,
  };
}
