'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { RAGENT_API_BASE_URL } from '@/config/runtimeEnv';
import { storage } from '@/utils/storage';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '../../context/I18nContext';

export type JobIntelDocumentItem = {
  id: string;
  jobId: string;
  kind: string;
  title?: string | null;
  body: string;
  uploaderId: string;
  status: string;
  createTime?: string;
};

function authHeaders(): Record<string, string> {
  const token = storage.getToken();
  return token ? { Authorization: token } : {};
}

async function fetchDocuments(jobId: string): Promise<JobIntelDocumentItem[]> {
  const base = RAGENT_API_BASE_URL.replace(/\/$/, '');
  const res = await fetch(`${base}/public/job-intel/jobs/${encodeURIComponent(jobId)}/documents`);
  const json = (await res.json()) as { code?: number; data?: JobIntelDocumentItem[] };
  if (json.code === 0 || json.code === 200) {
    return json.data ?? [];
  }
  return [];
}

export function JobIntelDocumentsSection({ jobId }: { jobId: string }) {
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const [items, setItems] = useState<JobIntelDocumentItem[]>([]);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'job_rules' | 'employer_posting'>('job_rules');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const list = await fetchDocuments(jobId);
      setItems(list);
    } catch {
      setItems([]);
    }
  }, [jobId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const kindLabel = (k: string) =>
    k === 'employer_posting' ? t('historicalJobs.docKindEmployer') : t('historicalJobs.docKindRules');

  const submit = async () => {
    if (!isAuthenticated) {
      openLoginDialog(t('historicalJobs.loginToUpload'));
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length < 20) {
      setError(t('historicalJobs.uploadMinLength'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const base = RAGENT_API_BASE_URL.replace(/\/$/, '');
      const res = await fetch(`${base}/job-intel/jobs/${encodeURIComponent(jobId)}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ kind, title: title.trim() || undefined, body: trimmed }),
      });
      const json = (await res.json()) as { code?: number; message?: string };
      if (json.code !== 0 && json.code !== 200) {
        throw new Error(json.message || t('historicalJobs.uploadFailed'));
      }
      setOpen(false);
      setBody('');
      setTitle('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('historicalJobs.uploadFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {t('historicalJobs.jobDetailsSection')}
        </Typography>
        <Button size="small" startIcon={<CloudUpload />} onClick={() => setOpen(true)}>
          {t('historicalJobs.uploadDetail')}
        </Button>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('historicalJobs.noJobDetailsYet')}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((doc) => (
            <Box
              key={doc.id}
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" color="primary.main" fontWeight={700} display="block">
                {kindLabel(doc.kind)}
                {doc.title ? ` · ${doc.title}` : ''}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {doc.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('historicalJobs.uploadDetail')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('historicalJobs.docKindLabel')}</InputLabel>
              <Select
                label={t('historicalJobs.docKindLabel')}
                value={kind}
                onChange={(e) => setKind(e.target.value as 'job_rules' | 'employer_posting')}
              >
                <MenuItem value="job_rules">{t('historicalJobs.docKindRules')}</MenuItem>
                <MenuItem value="employer_posting">{t('historicalJobs.docKindEmployer')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t('historicalJobs.docTitleOptional')}
              size="small"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label={t('historicalJobs.docBody')}
              multiline
              minRows={5}
              fullWidth
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('historicalJobs.cancel')}</Button>
          <Button variant="contained" disabled={saving} onClick={() => void submit()}>
            {t('historicalJobs.submitUpload')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
