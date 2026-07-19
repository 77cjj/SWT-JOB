import type { DealExperience } from '../../data/dealExperiences';
import {
  createDealExperience,
  fetchDealExperiences,
  mapDealExperienceApi,
  type DealExperienceCreatePayload,
} from '@/services/dealExperienceService';
import { api } from '@/services/api';
import type { DealExperienceApi } from '@/services/dealExperienceService';

export async function getExperiencesForProgram(
  programId: string,
  editionId?: string,
): Promise<DealExperience[]> {
  return fetchDealExperiences(programId, editionId);
}

export async function getExperiencesForUser(userId: string): Promise<DealExperience[]> {
  const list = await api.get<DealExperienceApi[]>(`/public/deal-experiences/by-user/${userId}`);
  return list.map(mapDealExperienceApi);
}

export async function addDealExperience(payload: DealExperienceCreatePayload) {
  return createDealExperience(payload);
}
