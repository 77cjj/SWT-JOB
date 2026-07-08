import type { JobRecord } from '../../types/job';
import { SAVED_JOBS_UPDATED_EVENT } from '../../hooks/useSavedJobs';

const STORAGE_KEY = 'swt-saved-jobs';
const DEFAULT_PROJECT_START = '2026-06-01';
const DEFAULT_PROJECT_END = '2026-09-15';

function normalizeJob(job: Record<string, unknown>): JobRecord {
  const projectStartDate =
    typeof job?.projectStartDate === 'string' && job.projectStartDate
      ? job.projectStartDate
      : DEFAULT_PROJECT_START;
  const projectEndDate =
    typeof job?.projectEndDate === 'string' && job.projectEndDate
      ? job.projectEndDate
      : DEFAULT_PROJECT_END;
  return { ...job, projectStartDate, projectEndDate } as JobRecord;
}

function readSavedJobs(): JobRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeJob) : [];
  } catch {
    return [];
  }
}

function writeSavedJobs(jobs: JobRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

/** 将岗位情报库条目导入「选岗计算器」已保存列表 */
export function importIntelJobToCompare(source: JobRecord): JobRecord {
  const imported: JobRecord = {
    ...source,
    jobId: `${source.jobId}-import-${Date.now()}`,
  };
  const existing = readSavedJobs();
  writeSavedJobs([...existing, imported]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SAVED_JOBS_UPDATED_EVENT));
  }
  return imported;
}
