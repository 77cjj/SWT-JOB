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

  const handleContribute = () => {
    setUnlockedDays(30);
    setUnlocked(true);
    setDialogOpen(false);
    setForm({ state: '', jobTitle: '', hourlyWage: '', notes: '' });
    setSnackOpen(true);
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('historicalJobs.contributeDialogTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="warning">{t('historicalJobs.contributePrototypeNote')}</Alert>
          <TextField
            label={t('historicalJobs.state')}
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            placeholder="NJ"
            required
          />
          <TextField
            label={t('historicalJobs.jobTitle')}
            value={form.jobTitle}
            onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            required
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" disabled={!canSubmit} onClick={handleContribute}>
            {t('historicalJobs.contributeButton')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
        <Alert severity="success" onClose={() => setSnackOpen(false)}>
          {t('historicalJobs.contributeSuccess')}
        </Alert>
      </Snackbar>
    </Box>
  );
}
