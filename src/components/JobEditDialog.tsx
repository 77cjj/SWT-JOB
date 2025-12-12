import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import JobForm from './JobForm';
import type { JobRecord } from '../types/job';

interface Props {
  open: boolean;
  job: JobRecord | null;
  onClose: () => void;
  onSubmit: (job: JobRecord) => void;
}

export default function JobEditDialog({ open, job, onClose, onSubmit }: Props) {
  const handleSubmit = (updatedJob: JobRecord) => {
    onSubmit(updatedJob);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        编辑岗位信息
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, overflow: 'auto' }}>
        {job && (
          <Box
            sx={{
              '& .MuiCard-root': {
                boxShadow: 'none',
                border: 'none',
              },
            }}
          >
            <JobForm
              onSubmit={handleSubmit}
              initialData={job}
              onCancel={onClose}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

