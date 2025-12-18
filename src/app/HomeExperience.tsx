import { useState } from 'react';
import { Container, Typography, Box, Paper, Alert, Button } from '@mui/material';
import JobForm from '../components/JobForm';
import SavedJobCard from '../components/SavedJobCard';
import CompareDialog from '../components/CompareDialog';
import JobDetailPanel from '../components/JobDetailPanel';
import JobEditDialog from '../components/JobEditDialog';
import { useSavedJobs } from '../hooks/useSavedJobs';
import type { JobRecord } from '../types/job';

export default function HomeExperience() {
  const { jobs, addJob, updateJob, deleteJob } = useSavedJobs();
  const [detailJob, setDetailJob] = useState<JobRecord | null>(null);
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

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
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                gap: { xs: 3, md: 4 },
              }}
            >
              {/* 左侧：新建岗位表单 */}
              <Box
                sx={{
                  // 左侧表单列不要太宽，否则会挤压右侧“我的岗位”
                  flex: { xs: '1 1 100%', md: '0 0 480px', lg: '0 0 900px' },
                  minWidth: 0,
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
                    新建岗位表单
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    填写岗位信息，保存后出现在右侧“我的岗位”
                  </Typography>
                </Box>
                <JobForm onSubmit={handleSubmit} />
              </Box>

              {/* 右侧：我的岗位 */}
              <Box sx={{ flex: '1 1 auto', minWidth: { xs: 0, md: 360 } }}>
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
                      我的岗位
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      已保存 {jobs.length} 个岗位，在卡片上点击“加入对比”，再打开对比弹窗查看
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant={compareIds.length ? 'contained' : 'outlined'}
                    disabled={!compareIds.length}
                    onClick={() => setCompareOpen(true)}
                  >
                    打开对比（{compareIds.length}/3）
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
                      还没有保存任何岗位
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                      在左侧表单填写信息并点击“保存岗位”
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

