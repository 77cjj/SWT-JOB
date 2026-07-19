import { api } from '@/services/api';
import type { DealExperience } from '../../src/data/dealExperiences';
import type { BilingualList, BilingualText } from '../../src/data/referralDeals';
import type { ProfileVisibility } from '../../src/lib/member/types';

export interface DealExperienceApi {
  id: string;
  userId: string;
  programId: string;
  editionId?: string;
  reportedAt: string;
  bodyZh: string;
  bodyEn: string;
  detailJson?: string | null;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  authorAvatarColor?: string;
}

export type DealExperienceCreatePayload = {
  programId: string;
  editionId?: string;
  bodyZh: string;
  bodyEn: string;
  openingMethodZh?: string;
  openingMethodEn?: string;
  ddMethodZh?: string;
  ddMethodEn?: string;
  materialsZh?: string;
  materialsEn?: string;
  ddDate?: string;
  bonusReceivedDate?: string;
  bonusAmount?: string;
  profileVisibility?: ProfileVisibility;
};

type DetailJson = {
  openingMethod?: BilingualText;
  ddMethod?: BilingualText;
  materials?: BilingualList;
  ddDate?: string;
  bonusReceivedDate?: string;
  bonusAmount?: string;
};

export function mapDealExperienceApi(item: DealExperienceApi): DealExperience {
  let detail: DetailJson = {};
  if (item.detailJson) {
    try {
      detail = JSON.parse(item.detailJson) as DetailJson;
    } catch {
      detail = {};
    }
  }
  return {
    id: item.id,
    userId: item.userId,
    programId: item.programId,
    editionId: item.editionId,
    reportedAt: item.reportedAt,
    body: { zh: item.bodyZh, en: item.bodyEn },
    openingMethod: detail.openingMethod,
    materials: detail.materials,
    ddMethod: detail.ddMethod,
    ddDate: detail.ddDate,
    bonusReceivedDate: detail.bonusReceivedDate,
    bonusAmount: detail.bonusAmount,
    authorDisplayName: item.authorDisplayName,
    authorAvatarUrl: item.authorAvatarUrl,
    authorAvatarColor: item.authorAvatarColor,
  };
}

export async function fetchDealExperiences(programId: string, editionId?: string) {
  const list = await api.get<DealExperienceApi[]>('/public/deal-experiences', {
    params: { programId, editionId: editionId || undefined },
  });
  return list.map(mapDealExperienceApi);
}

export async function createDealExperience(payload: DealExperienceCreatePayload) {
  return api.post<string, string>('/deal-experiences', payload);
}

export async function deleteDealExperience(id: string) {
  return api.delete<void>(`/deal-experiences/${id}`);
}
