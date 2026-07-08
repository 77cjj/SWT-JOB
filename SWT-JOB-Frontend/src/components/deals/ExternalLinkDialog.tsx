import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { OpenInNew, WarningAmber } from '@mui/icons-material';
import { useI18n } from '../../context/I18nContext';

interface ExternalLinkDialogProps {
  open: boolean;
  targetLabel: string;
  targetUrl: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ExternalLinkDialog({
  open,
  targetLabel,
  targetUrl,
  onClose,
  onConfirm,
}: ExternalLinkDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmber color="warning" fontSize="small" />
        {t('deals.externalLink.title')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('deals.externalLink.body')}
        </Typography>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {targetLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {targetUrl}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          {t('deals.referDisclosure')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" startIcon={<OpenInNew />} onClick={onConfirm}>
          {t('deals.externalLink.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
