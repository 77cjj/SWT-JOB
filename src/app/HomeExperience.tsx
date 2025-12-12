import { useState } from 'react';
import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import JobForm from '../components/JobForm';
import SavedJobCard from '../components/SavedJobCard';
import ComparisonWithSimulator from '../components/ComparisonWithSimulator';
import JobDetailPanel from '../components/JobDetailPanel';
import JobEditDialog from '../components/JobEditDialog';
import { useSavedJobs } from '../hooks/useSavedJobs';
import type { JobRecord } from '../types/job';

export default function HomeExperience() {
  const { jobs, addJob, updateJob, deleteJob } = useSavedJobs();
  const [detailJob, setDetailJob] = useState<JobRecord | null>(null);
  const [editingJob, setEditingJob] = useState<JobRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const comparedJobs = jobs.filter((job) => compareIds.includes(job.jobId));

  const toggleCompare = (jobId: string) => {
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
                新建岗位表单
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                填写岗位信息，保存后出现在下方面板
              </Typography>
            </Box>
            <JobForm
              onSubmit={handleSubmit}
            />
          </Box>

          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
                我的岗位
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                已保存 {jobs.length} 个岗位，点击"加入对比"进行对比
              </Typography>
            </Box>
            {jobs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  还没有保存任何岗位
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  在上方表单填写信息并点击"保存岗位"
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
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', minWidth: 0 },
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

        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
              岗位对比器 & 收入模拟器
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              选择 1~3 个岗位后，调整参数实时对比差异（最高收入会高亮显示）
            </Typography>
          </Box>
          <ComparisonWithSimulator jobs={comparedJobs} onRemove={toggleCompare} />
        </Box>

        <JobDetailPanel job={detailJob} onClose={() => setDetailJob(null)} />
        
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

