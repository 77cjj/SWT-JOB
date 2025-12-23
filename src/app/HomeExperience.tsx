import { useCallback, useState } from 'react';
import { Container, Typography, Box, Paper, Alert, Button } from '@mui/material';
import JobForm from '../components/JobForm';
import SavedJobCard from '../components/SavedJobCard';
import CompareDialog from '../components/CompareDialog';
import JobDetailPanel from '../components/JobDetailPanel';
import JobEditDialog from '../components/JobEditDialog';
import IncomeBreakdownCard from '../components/IncomeBreakdownCard';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useI18n } from '../context/I18nContext';
import type { JobRecord } from '../types/job';
import type { IncomeSummary } from '../utils/jobMetrics';

export default function HomeExperience() {
  const { t, tWithParams } = useI18n();
  const { jobs, addJob, updateJob, deleteJob } = useSavedJobs();
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

  const comparedJobs = jobs.filter((job) => compareIds.includes(job.jobId));

  const toggleCompare = (jobId: string) => {
    // 如果正在打开对比弹窗，且当前只剩最后一个对比项，那么移除后自动关窗（避免空对比弹窗）
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 两列区域整体居中：外层居中，内层限制最大宽度 */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: '110rem' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'minmax(0, 520px) minmax(0, 1fr)',
                },
                alignItems: 'start',
                gap: { xs: 3, md: 4 },
              }}
            >
              {/* 左侧：新建岗位表单 */}
              <Box
                sx={{
                  gridColumn: { xs: '1', md: '1' },
                  gridRow: { xs: 'auto', md: '1' },
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
                    {t('home.addJob')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('jobForm.createSubtitle')}
                  </Typography>
                </Box>
                <JobForm
                  onSubmit={handleSubmit}
                  onPreviewChange={handlePreviewChange}
                />
              </Box>

              {/* 右侧：我的岗位 */}
              <Box
                sx={{
                  gridColumn: { xs: '1', md: '2' },
                  gridRow: { xs: 'auto', md: '1' },
                  minWidth: { xs: 0, md: 360 },
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <IncomeBreakdownCard
                    title={t('income.title')}
                    income={preview?.income ?? null}
                    projectWeeks={preview?.projectWeeks ?? 0}
                  />
                </Box>
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
                    <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
                      {t('home.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[50]
                          : theme.palette.background.paper,
                    }}
                  >
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {t('home.noJobs')}
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                      {t('home.noJobsDescription')}
                    </Typography>
                  </Paper>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    {jobs.map((job) => (
                      <Box
                        key={job.jobId}
                        sx={{
                          // 一行只显示一个岗位卡片
                          flex: { xs: '1 1 100%' },
                          minWidth: 240,
                        }}
                      >
                        <SavedJobCard
                          job={job}
                          onSelect={setDetailJob}
                          onEdit={handleEdit}
                          onDelete={deleteJob}
                          onToggleCompare={toggleCompare}
                          isCompared={compareIds.includes(job.jobId)}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
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
      </Box>
    </Container>
  );
}

