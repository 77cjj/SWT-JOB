import { RAGENT_API_BASE_URL } from '@/config/runtimeEnv';
import { storage } from '@/utils/storage';
import type { JobRecord } from '../../types/job';

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

function sanitizeText(value: string, maxLen: number): string {
  return value
    .trim()
    .replace(/[;\u0000-\u001f<>\\`$]/g, '')
    .replace(/--/g, '')
    .slice(0, maxLen);
}

/** 前端校验 + 清洗后提交到后端（后端仍会二次校验，使用参数化入库） */
export async function submitCompareJobToServer(job: JobRecord): Promise<string | null> {
  const state = sanitizeText(job.state || '', 8).toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) {
    throw new Error('州代码无效');
  }
  const hourlyWage = Number(job.hourlyWage);
  if (!Number.isFinite(hourlyWage) || hourlyWage < 1 || hourlyWage > 200) {
    throw new Error('时薪超出允许范围');
  }

  const tip =
    job.tipped && Array.isArray(job.averageTip) && job.averageTip.length > 0
      ? Number(job.averageTip[0])
      : undefined;

  const payload = {
    jobId: sanitizeText(job.jobId || '', 64).replace(/[^A-Za-z0-9_-]/g, ''),
    jobTitle: sanitizeText(job.jobTitle || '未命名岗位', 120),
    company: sanitizeText(job.company || '未知公司', 120),
    state,
    hourlyWage,
    avgHoursPerWeek: Number.isFinite(job.avgHoursPerWeek) ? job.avgHoursPerWeek : undefined,
    tipped: Boolean(job.tipped),
    averageTip: Number.isFinite(tip as number) ? tip : undefined,
    hasHousing: Boolean(job.hasHousing),
    housingCostPerWeek: Number.isFinite(job.housingCostPerWeek) ? job.housingCostPerWeek : undefined,
    secondJobHours: Number.isFinite(job.secondJobHours) ? job.secondJobHours : undefined,
    secondJobHourlyWage: Number.isFinite(job.secondJobHourlyWage as number)
      ? job.secondJobHourlyWage
      : undefined,
    projectStartDate: job.projectStartDate,
    projectEndDate: job.projectEndDate,
    source: 'compare_form',
    extras: {
      overtimeRate: job.overtimeRate,
      workHoursRange: job.workHoursRange,
      overtimeAvailable: job.overtimeAvailable,
      housingDistanceKm: job.housingDistanceKm,
      secondJobPossible: job.secondJobPossible,
      secondJobIndustry: sanitizeText(job.secondJobIndustry || '', 120),
      workStability: job.workStability,
      costOfLivingIndex: job.costOfLivingIndex,
      safetyLevel: job.safetyLevel,
      employerRating: job.employerRating,
      lastYearIncidents: job.lastYearIncidents,
      description: sanitizeText(job.description || '', 500),
      city: job.city ? sanitizeText(job.city, 80) : undefined,
    },
  };

  const res = await fetch(`${baseUrl()}/public/compare/jobs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  return parseResult<string>(res);
}
