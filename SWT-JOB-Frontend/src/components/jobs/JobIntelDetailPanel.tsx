'use client';

import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Rating,
  Typography,
} from '@mui/material';
import {
  Calculate,
  LocationOn,
  Lock,
  Shield,
  Verified,
  WorkOutline,
} from '@mui/icons-material';
import type { JobRecord } from '../../types/job';
import { computeJobTrust } from '../../lib/jobs/jobTrust';
import { useI18n } from '../../context/I18nContext';

function tierLabel(t: (k: string) => string, tier?: JobRecord['accessTier']) {
  if (tier === 'premium') return t('historicalJobs.tierLabelPremium');
  if (tier === 'community') return t('historicalJobs.tierLabelCommunity');
  return t('historicalJobs.tierLabelPublic');
}

function TrustBar({
  label,
  value,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <Box sx={{ mb: 1.25 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" fontWeight={600}>
          {value}/{max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { borderRadius: 3 },
        }}
      />
    </Box>
  );
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
  const { t, tWithParams } = useI18n();

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

  const trust = computeJobTrust(job);
  const tier = job.accessTier ?? 'public';
  const employerLocked = tier === 'premium' || (tier === 'community' && !unlocked);
  const employerText = employerLocked
    ? job.companyMasked ?? t('historicalJobs.lockedEmployer')
    : job.company;

  const trustColor =
    trust.level === 'high' ? 'success.main' : trust.level === 'medium' ? 'warning.main' : 'error.main';

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
      <Box>
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

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.12)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {t('historicalJobs.trustScore')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: trustColor, lineHeight: 1 }}>
            {trust.score}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ color: trustColor }}>
            {t(`historicalJobs.trustLevel.${trust.level}`)}
          </Typography>
        </Box>
        {trust.verifiedCount > 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {tWithParams('historicalJobs.verified', { count: trust.verifiedCount })}
          </Typography>
        ) : null}
      </Box>

      <Box>
        <TrustBar label={t('historicalJobs.rating')} value={trust.employerRating} />
        <TrustBar label={t('historicalJobs.workStability')} value={trust.workStability} />
        <TrustBar label={t('historicalJobs.safetyLevel')} value={trust.safetyLevel} />
        {trust.hasIncidents ? (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<Shield fontSize="small" />}
            label={t('historicalJobs.incidentsLastYear')}
            sx={{ mt: 0.5 }}
          />
        ) : null}
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
        <Rating value={job.employerRating} readOnly size="small" />
        <Typography variant="caption" color="text.secondary">
          {job.employerRating}/5
        </Typography>
      </Box>

      <Button
        variant="contained"
        fullWidth
        startIcon={<Calculate />}
        onClick={() => onImport(job)}
      >
        {t('historicalJobs.importToCompare')}
      </Button>
    </Paper>
  );
}
