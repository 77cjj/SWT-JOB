import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import {
  Search as SearchIcon,
  VolunteerActivism,
} from '@mui/icons-material';
import { historicalJobsData } from '../data/historicalJobs';
import { importIntelJobToCompare } from '../lib/jobs/importToCompare';
import { JobIntelExplorer } from '../components/jobs/JobIntelExplorer';
import { useI18n } from '../context/I18nContext';
import type { JobRecord } from '../types/job';
import { submitJobIntelContribution } from '../lib/jobs/jobIntelApi';
import { useAuthStore } from '@/stores/authStore';
import { US_STATE_OPTIONS } from '../lib/member/profile';

const UNLOCK_STORAGE_KEY = 'swt-job-intel-unlocked-until';

function readUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(UNLOCK_STORAGE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  return Number.isFinite(until) && until > Date.now();
}

function setUnlockedDays(days: number) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(UNLOCK_STORAGE_KEY, String(until));
}

export default function HistoricalJobsPage() {
  const { t, tWithParams } = useI18n();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [unlocked, setUnlocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState({
    state: '',
    jobTitle: '',
    hourlyWage: '',
    notes: '',
  });

  useEffect(() => {
    setUnlocked(readUnlocked());
  }, []);

  const states = useMemo(() => {
    const stateSet = new Set(historicalJobsData.map((job) => job.state));
    return Array.from(stateSet).sort();
  }, []);

  const filteredJobs = useMemo(() => {
    return historicalJobsData.filter((job) => {
      const employer = job.companyMasked ?? job.company;
      const matchesSearch =
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.state.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = stateFilter === 'all' || job.state === stateFilter;
      return matchesSearch && matchesState;
    });
  }, [searchTerm, stateFilter]);

  const handleContribute = async () => {
    if (!isAuthenticated) {
      openLoginDialog('登录后即可提交岗位情报');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const wageRaw = form.hourlyWage.trim();
      const hourlyWage = wageRaw ? Number(wageRaw) : undefined;
      await submitJobIntelContribution({
        state: form.state.trim(),
        jobTitle: form.jobTitle.trim(),
        hourlyWage: hourlyWage != null && Number.isFinite(hourlyWage) ? hourlyWage : undefined,
        notes: form.notes.trim(),
      });
      setUnlockedDays(30);
      setUnlocked(true);
      setDialogOpen(false);
      setForm({ state: '', jobTitle: '', hourlyWage: '', notes: '' });
      setSnackOpen(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t('historicalJobs.contributeApiError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportToCompare = (job: JobRecord) => {
    importIntelJobToCompare(job);
    void router.push('/compare?imported=1');
  };

  const canSubmit =
    form.state.trim().length >= 2 &&
    form.jobTitle.trim().length >= 2 &&
    form.notes.trim().length >= 10;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('historicalJobs.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 720 }}>
        {t('historicalJobs.subtitle')}
      </Typography>

      <Box
        data-tour="jobs-toolbar"
        sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <TextField
          placeholder={t('historicalJobs.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('historicalJobs.filterByState')}</InputLabel>
          <Select
            value={stateFilter}
            label={t('historicalJobs.filterByState')}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {states.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<VolunteerActivism />}
          onClick={() => setDialogOpen(true)}
        >
          {t('historicalJobs.contributeButton')}
        </Button>

        <Button component={Link} href="/compare" variant="outlined" size="medium">
          {t('historicalJobs.compareLink')}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tWithParams('historicalJobs.foundJobs', { count: filteredJobs.length })}
      </Typography>

      {filteredJobs.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('historicalJobs.noResults')}
        </Alert>
      ) : (
        <JobIntelExplorer
          jobs={filteredJobs}
          unlocked={unlocked}
          onImport={handleImportToCompare}
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        scroll="paper"
      >
        <DialogTitle sx={{ pb: 1 }}>{t('historicalJobs.contributeDialogTitle')}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5, pb: 2, maxHeight: 'min(70vh, 520px)' }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <Autocomplete
            freeSolo
            options={[...US_STATE_OPTIONS]}
            value={form.state || null}
            inputValue={form.state}
            onInputChange={(_, value) => setForm((f) => ({ ...f, state: value.toUpperCase() }))}
            onChange={(_, value) => {
              const next = typeof value === 'string' ? value : value ?? '';
              setForm((f) => ({ ...f, state: next.toUpperCase() }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('historicalJobs.state')}
                placeholder="NJ"
                required
                helperText="可输入或选择美国州缩写（2 字母）"
              />
            )}
          />
          <TextField
            label={t('historicalJobs.jobTitle')}
            value={form.jobTitle}
            onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            required
            helperText={form.jobTitle.trim().length > 0 && form.jobTitle.trim().length < 2 ? '至少 2 个字符' : ' '}
          />
          <TextField
            label={t('historicalJobs.hourlyWage')}
            value={form.hourlyWage}
            onChange={(e) => setForm((f) => ({ ...f, hourlyWage: e.target.value }))}
            placeholder="15.5"
          />
          <TextField
            label={t('historicalJobs.culture')}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            multiline
            minRows={3}
            placeholder="时薪、住宿、二工、雇主态度（请勿填写可识别个人隐私）"
            required
            helperText={`${form.notes.trim().length}/10 字以上可提交`}
          />
          {!canSubmit ? (
            <FormHelperText sx={{ mt: -1 }}>
              请填写州（≥2 字）、岗位名（≥2 字）与情报说明（≥10 字）后提交
            </FormHelperText>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button type="button" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            type="button"
            variant="contained"
            disabled={!canSubmit || submitting}
            onClick={() => void handleContribute()}
          >
            {submitting ? t('historicalJobs.contributeSubmitting') : t('historicalJobs.contributeButton')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
        <Alert severity="success" onClose={() => setSnackOpen(false)}>
          {t('historicalJobs.contributeSaved')}
        </Alert>
      </Snackbar>
    </Box>
  );
}
