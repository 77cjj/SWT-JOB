import { useEffect, useState } from 'react';
import type { JobRecord } from '../types/job';

const STORAGE_KEY = 'swt-saved-jobs';

export function useSavedJobs() {
  const [jobs, setJobs] = useState<JobRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

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

