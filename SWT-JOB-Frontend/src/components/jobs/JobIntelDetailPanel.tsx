'use client';

import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import {
  Calculate,
  LocationOn,
  Lock,
  Verified,
  WorkOutline,
} from '@mui/icons-material';
import type { JobRecord } from '../../types/job';
import { useI18n } from '../../context/I18nContext';
import { IntelSourceContributors } from './IntelSourceContributors';
import { JobIntelDocumentsSection } from './JobIntelDocumentsSection';
import { JobCardComments } from './JobCardComments';

function tierLabel(t: (k: string) => string, tier?: JobRecord['accessTier']) {
  if (tier === 'premium') return t('historicalJobs.tierLabelPremium');
  if (tier === 'community') return t('historicalJobs.tierLabelCommunity');
  return t('historicalJobs.tierLabelPublic');
}

export function JobIntelDetailPanel({
  job,
  unlocked,
  onImport,
  compact = false,
}: {
  job: JobRecord | null;
  unlocked: boolean;
  onImport: (job: JobRecord) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();

  if (!job) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: compact ? 2 : 3,
          height: '100%',
          minHeight: compact ? 0 : 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('historicalJobs.selectHint')}
        </Typography>
      </Paper>
    );
  }

  const tier = job.accessTier ?? 'public';
  const employerLocked = tier === 'premium' || (tier === 'community' && !unlocked);
  const employerText = employerLocked
    ? job.companyMasked ?? t('historicalJobs.lockedEmployer')
    : job.company;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 2 : 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        animation: 'jobDetailIn 0.32s ease',
        '@keyframes jobDetailIn': {
          from: { opacity: 0, transform: 'translateX(12px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            <Chip size="small" label={job.state} />
            <Chip size="small" label={tierLabel(t, tier)} variant="outlined" />
            {job.year ? <Chip size="small" label={`${job.year}`} variant="outlined" /> : null}
          </Box>
          <Typography variant={compact ? 'h6' : 'h5'} fontWeight={800} gutterBottom>
            {job.jobTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {employerLocked ? <Lock fontSize="small" color="disabled" /> : <Verified fontSize="small" color="primary" />}
            <Typography variant="body2" color={employerLocked ? 'text.secondary' : 'text.primary'}>
              {employerText}
            </Typography>
          </Box>
          {job.city ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {job.city}, {job.state}
              </Typography>
            </Box>
          ) : null}
        </Box>
        {job.intelSource ? <IntelSourceContributors source={job.intelSource} /> : null}
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          {t('historicalJobs.compensation')}
        </Typography>
        <Typography variant="h6" color="primary.main" fontWeight={700}>
          ${job.hourlyWage.toFixed(2)}/h
          {job.tipped && job.averageTip
            ? ` + $${job.averageTip[0]}–${job.averageTip[1]} ${t('historicalJobs.tipPerHour')}`
            : ''}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          <Chip size="small" icon={<WorkOutline sx={{ fontSize: '14px !important' }} />} label={`${job.avgHoursPerWeek}h/w`} />
          <Chip size="small" label={`${t('historicalJobs.secondJob')}: ${job.secondJobPossible}`} variant="outlined" />
          <Chip
            size="small"
            label={
              job.hasHousing
                ? `$${job.housingCostPerWeek}/w ${t('historicalJobs.housingShort')}`
                : t('historicalJobs.needsOwnHousing')
            }
            variant="outlined"
          />
        </Box>
      </Box>

      {job.description ? (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
          {job.description}
        </Typography>
      ) : null}

      <JobIntelDocumentsSection jobId={job.jobId} />

      <JobCardComments jobId={job.jobId} />

      <Button
        variant="contained"
        fullWidth
        startIcon={<Calculate />}
        onClick={() => onImport(job)}
        sx={{ mt: 'auto' }}
      >
        {t('historicalJobs.importToCompare')}
      </Button>
    </Paper>
  );
}
