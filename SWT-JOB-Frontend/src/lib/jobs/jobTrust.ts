import type { JobRecord } from '../../types/job';

export type JobTrustLevel = 'high' | 'medium' | 'low';

export type JobTrustMetrics = {
  score: number;
  level: JobTrustLevel;
  verifiedCount: number;
  employerRating: number;
  workStability: number;
  safetyLevel: number;
  hasIncidents: boolean;
};

export function computeJobTrust(job: JobRecord): JobTrustMetrics {
  const verifiedCount = job.verifiedCount ?? 0;
  const employerRating = job.employerRating ?? 3;
  const workStability = job.workStability ?? 3;
  const safetyLevel = job.safetyLevel ?? 3;

  let score =
    employerRating * 14 +
    workStability * 11 +
    safetyLevel * 9 +
    Math.min(verifiedCount, 6) * 5;

  if (job.accessTier === 'public') score += 8;
  else if (job.accessTier === 'community') score += 5;

  if (job.lastYearIncidents) score -= 12;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: JobTrustLevel = score >= 78 ? 'high' : score >= 55 ? 'medium' : 'low';

  return {
    score,
    level,
    verifiedCount,
    employerRating,
    workStability,
    safetyLevel,
    hasIncidents: Boolean(job.lastYearIncidents),
  };
}
