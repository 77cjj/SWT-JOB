import { api } from "@/services/api";

export type SwtParticipationRankItem = {
  rank: number;
  name: string;
  count: number;
};

export type SwtParticipationYear = {
  year: number;
  totalVisitors: number;
  source: string;
  sendingCountries: SwtParticipationRankItem[];
  usDestinations: SwtParticipationRankItem[];
};

export type SwtParticipationStats = {
  years: SwtParticipationYear[];
};

export async function getSwtParticipationStats(): Promise<SwtParticipationStats> {
  return api.get<SwtParticipationStats, SwtParticipationStats>("/admin/swt-participation/stats");
}
