'use client';

import { Drawer, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { JobRecord } from '../../types/job';
import { JobIntelDetailPanel } from './JobIntelDetailPanel';

export function JobIntelCompareDrawer({
  open,
  intelJob,
  unlocked,
  onClose,
}: {
  open: boolean;
  intelJob: JobRecord | null;
  unlocked: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer
      anchor="right"
      open={open && Boolean(intelJob)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 480 },
          maxWidth: '100vw',
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
        <IconButton onClick={onClose} aria-label="close" size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      {intelJob ? (
        <JobIntelDetailPanel
          job={intelJob}
          unlocked={unlocked}
          onImport={() => onClose()}
          compact
        />
      ) : null}
    </Drawer>
  );
}
