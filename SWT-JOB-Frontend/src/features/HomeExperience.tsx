import { useCallback, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Container, Typography, Box, Paper, Alert, Button, Snackbar } from '@mui/material';
import JobForm from '../components/JobForm';
import SavedJobCard from '../components/SavedJobCard';
import CompareDialog from '../components/CompareDialog';
import JobDetailPanel from '../components/JobDetailPanel';
import JobEditDialog from '../components/JobEditDialog';
import IncomeHero from '../components/income/IncomeHero';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useI18n } from '../context/I18nContext';
import type { JobRecord } from '../types/job';
import type { IncomeSummary } from '../utils/jobMetrics';
import { DEMO_SAVED_JOBS } from '../lib/jobs/demoJobs';

export default function HomeExperience() {
  const { t, tWithParams } = useI18n();
  const router = useRouter();
  const { jobs, addJob, updateJob, deleteJob } = useSavedJobs();
  const [importSnack, setImportSnack] = useState(false);
  const [detailJob, setDetailJob] = useState<JobRecord | null>(null);
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [preview, setPreview] = useState<{
    income: IncomeSummary | null;
    projectWeeks: number;
  } | null>(null);

  const handlePreviewChange = useCallback(
    (payload: { income: IncomeSummary | null; projectWeeks: number } | null) => {
      setPreview(payload);
    },
    [],
  );

  useEffect(() => {
    if (router.query.imported !== '1') return;
    setImportSnack(true);
    void router.replace('/compare', undefined, { shallow: true });
  }, [router.query.imported, router]);

  const comparedJobs = useMemo(() => {
    const pool = [...jobs, ...DEMO_SAVED_JOBS];
    return pool.filter((job) => compareIds.includes(job.jobId));
  }, [jobs, compareIds]);

  const toggleCompare = (jobId: string) => {
    if (compareOpen && compareIds.length === 1 && compareIds[0] === jobId) {
      setCompareOpen(false);
    }
    setCompareIds((prev) => {
      if (prev.includes(jobId)) {
        return prev.filter((id) => id !== jobId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, jobId];
    });
  };

  const handleSubmit = (job: JobRecord) => {
    addJob(job);
  };

  const handleEdit = (job: JobRecord) => {
    setEditingJob(job);
  };

  const handleEditSubmit = (job: JobRecord) => {
    if (editingJob) {
      updateJob(editingJob.jobId, job);
      setEditingJob(null);
    }
  };

  const handleCloseEdit = () => {
    setEditingJob(null);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 0, pb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
        <Box data-tour="compare-header">
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
            {t('home.pageTitle')}
          </Typography>
        </Box>

        <IncomeHero
          income={preview?.income ?? null}
          projectWeeks={preview?.projectWeeks ?? 0}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 1fr) minmax(0, 360px)',
            },
            alignItems: 'start',
            gap: { xs: 2, md: 2.5 },
          }}
        >
          <Box data-tour="job-form">
            <JobForm onSubmit={handleSubmit} onPreviewChange={handlePreviewChange} />
          </Box>

          <Box data-tour="saved-jobs" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('home.title')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                  {tWithParams('home.compareSelected', { count: jobs.length })}
                </Typography>
              </Box>
              <Button
                size="small"
                variant={compareIds.length ? 'contained' : 'outlined'}
                disabled={!compareIds.length}
                onClick={() => setCompareOpen(true)}
              >
                {t('home.compare')} ({compareIds.length}/3)
              </Button>
            </Box>

            {jobs.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 2, mb: 1.5, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  {t('home.noJobsDescription')}
                </Typography>
                <Button component={Link} href="/jobs" variant="outlined" size="small">
                  {t('home.browseJobIntel')}
                </Button>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {jobs.map((job) => (
                  <SavedJobCard
                    key={job.jobId}
                    job={job}
                    onSelect={setDetailJob}
                    onEdit={handleEdit}
                    onDelete={deleteJob}
                    onToggleCompare={toggleCompare}
                    isCompared={compareIds.includes(job.jobId)}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ mt: jobs.length > 0 ? 2 : 0 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {t('savedJobCard.demoSection')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {DEMO_SAVED_JOBS.map((job) => (
                  <SavedJobCard
                    key={job.jobId}
                    job={job}
                    isDemo
                    onSelect={setDetailJob}
                    onEdit={handleEdit}
                    onDelete={deleteJob}
                    onToggleCompare={toggleCompare}
                    isCompared={compareIds.includes(job.jobId)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <JobDetailPanel job={detailJob} onClose={() => setDetailJob(null)} />

        <CompareDialog
          open={compareOpen}
          jobs={comparedJobs}
          onClose={() => setCompareOpen(false)}
          onRemove={toggleCompare}
        />

        <JobEditDialog
          open={editingJob !== null}
          job={editingJob}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />

        <Snackbar
          open={importSnack}
          autoHideDuration={4000}
          onClose={() => setImportSnack(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setImportSnack(false)}>
            {t('home.importedFromIntel')}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}
