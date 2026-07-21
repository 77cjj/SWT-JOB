import type { JobRecord } from '../../types/job';
import { historicalJobsData } from '../../data/historicalJobs';

/** 从对比列表中的 jobId（含 -import- 后缀）解析情报库原始条目 */
export function resolveIntelLibraryJob(job: JobRecord): JobRecord | null {
  const rawId = job.jobId.replace(/-import-\d+$/, '');
  const byId = historicalJobsData.find((h) => h.jobId === rawId);
  if (byId) return byId;

  const norm = (s: string) => s.trim().toLowerCase();
  const title = norm(job.jobTitle);
  const company = norm(job.company);
  const state = norm(job.state);

  const fuzzy = historicalJobsData.find((h) => {
    if (norm(h.state) !== state) return false;
    if (norm(h.jobTitle) === title) return true;
    if (company && (norm(h.company) === company || norm(h.companyMasked ?? '') === company)) return true;
    return false;
  });
  return fuzzy ?? null;
}

export function isJobFromIntelLibrary(job: JobRecord): boolean {
  return resolveIntelLibraryJob(job) !== null;
}

export function readIntelUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem('swt-job-intel-unlocked-until');
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && until > Date.now();
}
