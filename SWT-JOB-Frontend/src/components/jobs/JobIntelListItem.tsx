'use client';

import { useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import type { JobRecord } from '../../types/job';
import { computeJobTrust } from '../../lib/jobs/jobTrust';
import { useI18n } from '../../context/I18nContext';

export function JobIntelListItem({
  job,
  selected,
  onSelect,
}: {
  job: JobRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t, tWithParams } = useI18n();
  const [popping, setPopping] = useState(false);
  const trust = computeJobTrust(job);

  const trustColor =
    trust.level === 'high' ? 'success.main' : trust.level === 'medium' ? 'warning.main' : 'error.main';

  const handleActivate = () => {
    setPopping(true);
    onSelect();
    window.setTimeout(() => setPopping(false), 480);
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={handleActivate}
      sx={{
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 1.5,
        bgcolor: selected ? 'action.selected' : 'background.paper',
        boxShadow: selected ? 2 : 0,
        transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
        animation: popping ? 'jellyPop 0.48s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        '@keyframes jellyPop': {
          '0%': { transform: 'scale(1)' },
          '28%': { transform: 'scale(0.94, 1.06)' },
          '48%': { transform: 'scale(1.07, 0.93)' },
          '68%': { transform: 'scale(0.98, 1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: 1,
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {job.jobTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {job.city ? `${job.city}, ` : ''}
            {job.state} · ${job.hourlyWage.toFixed(2)}/h
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            minWidth: 40,
            textAlign: 'center',
            px: 0.75,
            py: 0.25,
            borderRadius: 1.5,
            bgcolor: (theme) =>
              theme.palette.mode === 'light' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.15)',
          }}
        >
          <Typography variant="caption" fontWeight={800} sx={{ color: trustColor, display: 'block', lineHeight: 1.2 }}>
            {trust.score}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            {t('historicalJobs.trustShort')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {job.verifiedCount ? (
          <Chip
            size="small"
            label={tWithParams('historicalJobs.verified', { count: job.verifiedCount })}
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        ) : null}
        <Chip
          size="small"
          label={`${t('historicalJobs.secondJob')} ${job.secondJobPossible}`}
          variant="outlined"
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      </Box>
    </Box>
  );
}
