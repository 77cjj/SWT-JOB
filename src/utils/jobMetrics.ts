import type { JobRecord } from '../types/job';
import dayjs from 'dayjs';

const SECOND_JOB_DEFAULT_WAGE = 13;
const DEFAULT_EXCHANGE_RATE = 7.2;
const DEFAULT_FEDERAL_TAX_RATE = 0.1;

export interface IncomeOptions {
  primaryHours?: number;
  secondHours?: number;
  exchangeRate?: number;
  taxRate?: number; // 州税率
  federalTaxRate?: number; // 联邦税率（简化预估）
  housingCost?: number;
}

export interface IncomeSummary {
  primaryGross: number;
  tipIncome: number;
  overtimeIncome: number;
  secondJobIncome: number;
  totalGross: number;
  federalTax: number;
  stateTax: number;
  tax: number; // federalTax + stateTax
  housing: number;
  netIncomePrimary: number;
  netIncomeWithSecondJob: number;
  incomeRmb: number;
}

export function getProjectDurationWeeks(job: Pick<JobRecord, 'projectStartDate' | 'projectEndDate'>): number {
  const start = dayjs(job.projectStartDate);
  const end = dayjs(job.projectEndDate);

  if (!start.isValid() || !end.isValid()) return 0;

  // 与 JobForm 中预估口径保持一致：按天差向上取整到周
  const diff = end.diff(start, 'day');
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 7));
}

export function computeIncome(job: JobRecord, options: IncomeOptions = {}): IncomeSummary {
  const primaryHours = options.primaryHours ?? job.avgHoursPerWeek;
  const secondHours = options.secondHours ?? job.secondJobHours;
  const stateTaxRate = options.taxRate ?? job.stateTaxRate;
  const federalTaxRate = options.federalTaxRate ?? DEFAULT_FEDERAL_TAX_RATE;
  const housingCost = options.housingCost ?? job.housingCostPerWeek;
  const exchangeRate = options.exchangeRate ?? DEFAULT_EXCHANGE_RATE;

  const overtimeHours = Math.max(primaryHours - 40, 0);
  const regularHours = Math.max(primaryHours - overtimeHours, 0);

  const regularIncome = regularHours * job.hourlyWage;
  const overtimeIncome = overtimeHours * job.hourlyWage * job.overtimeRate;
  const tipIncome = job.tipped
    ? ((job.averageTip?.[0] ?? 0) + (job.averageTip?.[1] ?? 0)) / 2 * primaryHours
    : 0;

  const primaryGross = regularIncome + overtimeIncome + tipIncome;
  const secondJobIncome = secondHours * SECOND_JOB_DEFAULT_WAGE;
  const totalGross = primaryGross + secondJobIncome;

  const taxableBase = Math.max(primaryGross - 150, 0);
  // 简化口径：按主要工作收入估算税基（与当前产品逻辑保持一致）
  const federalTax = taxableBase * federalTaxRate;
  const stateTax = taxableBase * stateTaxRate;
  const tax = federalTax + stateTax;

  const netIncomePrimary = primaryGross - tax - housingCost;
  const netIncomeWithSecondJob = totalGross - tax - housingCost;

  return {
    primaryGross,
    tipIncome,
    overtimeIncome,
    secondJobIncome,
    totalGross,
    federalTax,
    stateTax,
    tax,
    housing: housingCost,
    netIncomePrimary,
    netIncomeWithSecondJob,
    incomeRmb: netIncomeWithSecondJob * exchangeRate,
  };
}

export type SortMetric = 'income' | 'fatigue' | 'risk' | 'hours';

export function getCompositeScore(job: JobRecord): number {
  const income = computeIncome(job).netIncomeWithSecondJob;
  const fatigue = 60 - job.avgHoursPerWeek; // higher is better
  const risk = (job.safetyLevel + job.workStability + job.employerRating) * 10 - (job.lastYearIncidents ? 15 : 0);
  const housing = job.hasHousing ? 20 : Math.max(0, 20 - job.housingCostPerWeek / 10);
  return income * 0.5 + fatigue * 2 + risk * 1.2 + housing;
}

export function fatigueColor(hours: number): string {
  if (hours > 52) return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
  if (hours >= 38) return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
}

export function incomeColor(income: number): string {
  if (income >= 900) return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
  if (income >= 700) return 'bg-sky-500/20 text-sky-200 border-sky-400/30';
  return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
}

export function riskColor(job: JobRecord): string {
  const incidentPenalty = job.lastYearIncidents ? 1 : 0;
  const avg = (job.safetyLevel + job.workStability + job.employerRating) / 3 - incidentPenalty;
  if (avg >= 4) return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30';
  if (avg >= 3) return 'bg-amber-500/15 text-amber-200 border-amber-400/30';
  return 'bg-rose-500/15 text-rose-200 border-rose-400/30';
}

export function secondJobBadge(level: JobRecord['secondJobPossible']): string {
  if (level === '高') return 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30';
  if (level === '中') return 'bg-sky-500/20 text-sky-200 border-sky-400/30';
  return 'bg-slate-500/20 text-slate-200 border-slate-400/30';
}

export function sortJobs(jobs: JobRecord[], metric: SortMetric): JobRecord[] {
  return [...jobs].sort((a, b) => {
    if (metric === 'income') {
      return computeIncome(b).netIncomeWithSecondJob - computeIncome(a).netIncomeWithSecondJob;
    }
    if (metric === 'fatigue') {
      return a.avgHoursPerWeek - b.avgHoursPerWeek;
    }
    if (metric === 'risk') {
      return getCompositeScore(b) - getCompositeScore(a);
    }
    if (metric === 'hours') {
      return b.avgHoursPerWeek - a.avgHoursPerWeek;
    }
    return 0;
  });
}

