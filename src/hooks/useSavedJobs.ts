import { useEffect, useState } from 'react';
import type { JobRecord } from '../types/job';

const STORAGE_KEY = 'swt-saved-jobs';
const DEFAULT_PROJECT_START = '2026-06-01';
const DEFAULT_PROJECT_END = '2026-09-15';

function normalizeJob(job: any): JobRecord {
  // 兼容旧 localStorage 数据：补齐项目日期字段
  const projectStartDate =
    typeof job?.projectStartDate === 'string' && job.projectStartDate
      ? job.projectStartDate
      : typeof job?.startDate === 'string' && job.startDate
        ? job.startDate
        : DEFAULT_PROJECT_START;

  const projectEndDate =
    typeof job?.projectEndDate === 'string' && job.projectEndDate
      ? job.projectEndDate
      : typeof job?.endDate === 'string' && job.endDate
        ? job.endDate
        : DEFAULT_PROJECT_END;

  return {
    ...job,
    projectStartDate,
    projectEndDate,
  } as JobRecord;
}

export function useSavedJobs() {
  // 为了避免 SSR 首屏与 CSR 首屏不一致导致 hydration 失败：
  // - 首次渲染（含客户端第一次渲染）一律返回 []
  // - 挂载后再从 localStorage 读取并 setJobs
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setJobs(Array.isArray(parsed) ? parsed.map(normalizeJob) : []);
    } catch {
      setJobs([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs, hydrated]);

  const addJob = (job: JobRecord) => {
    setJobs((prev) => [...prev, job]);
  };

  const updateJob = (jobId: string, updates: Partial<JobRecord>) => {
    setJobs((prev) =>
      prev.map((job) => (job.jobId === jobId ? { ...job, ...updates } : job)),
    );
  };

  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.jobId !== jobId));
  };

  return {
    jobs,
    addJob,
    updateJob,
    deleteJob,
  };
}

