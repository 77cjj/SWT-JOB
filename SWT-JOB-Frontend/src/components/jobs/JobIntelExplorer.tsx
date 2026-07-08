'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import type { JobRecord } from '../../types/job';
import { JobIntelListItem } from './JobIntelListItem';
import { JobIntelDetailPanel } from './JobIntelDetailPanel';

export function JobIntelExplorer({
  jobs,
  unlocked,
  onImport,
}: {
  jobs: JobRecord[];
  unlocked: boolean;
  onImport: (job: JobRecord) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.jobId ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.jobId === selectedId) ?? null,
    [jobs, selectedId],
  );

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !jobs.some((j) => j.jobId === selectedId)) {
      setSelectedId(jobs[0]!.jobId);
    }
  }, [jobs, selectedId]);

  const handleSelect = (jobId: string) => {
    setSelectedId(jobId);
    if (isMobile) setMobileOpen(true);
  };

  const listNode = (
    <Box
      data-tour="jobs-explorer-list"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxHeight: isMobile ? 'none' : 'min(72vh, 720px)',
        overflowY: isMobile ? 'visible' : 'auto',
        pr: isMobile ? 0 : 0.5,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: 'action.disabled' },
      }}
    >
      {jobs.map((job) => (
        <JobIntelListItem
          key={job.jobId}
          job={job}
          selected={selectedId === job.jobId}
          onSelect={() => handleSelect(job.jobId)}
        />
      ))}
    </Box>
  );

  if (isMobile) {
    return (
      <Box data-tour="jobs-explorer">
        {listNode}
        <Drawer
          anchor="bottom"
          open={mobileOpen && Boolean(selectedJob)}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '88vh',
              px: 2,
              pt: 1,
              pb: 3,
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'divider',
              mx: 'auto',
              mb: 1.5,
            }}
          />
          <JobIntelDetailPanel
            job={selectedJob}
            unlocked={unlocked}
            onImport={(job) => {
              onImport(job);
              setMobileOpen(false);
            }}
            compact
          />
        </Drawer>
      </Box>
    );
  }

  return (
    <Box
      data-tour="jobs-explorer"
      sx={{
        display: 'grid',
        gridTemplateColumns: { md: 'minmax(0, 340px) minmax(0, 1fr)' },
        gap: 2.5,
        alignItems: 'start',
      }}
    >
      {listNode}
      <Box sx={{ position: 'sticky', top: 80 }}>
        <JobIntelDetailPanel job={selectedJob} unlocked={unlocked} onImport={onImport} />
      </Box>
    </Box>
  );
}
