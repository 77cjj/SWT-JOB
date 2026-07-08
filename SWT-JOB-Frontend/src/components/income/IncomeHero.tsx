'use client';

import { useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { IncomeSummary } from '../../utils/jobMetrics';
import { useI18n } from '../../context/I18nContext';
import { RollingCurrency } from './RollingCurrency';

function fmt(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

export default function IncomeHero({
  income,
  projectWeeks,
}: {
  income: IncomeSummary | null;
  projectWeeks: number;
}) {
  const { t, tWithParams } = useI18n();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const weeks = Number.isFinite(projectWeeks) && projectWeeks > 0 ? projectWeeks : 0;
  const scale = weeks > 0 ? weeks : 1;
  const projectNet = income ? income.netIncomeWithSecondJob * scale : 0;
  const weeklyNet = income?.netIncomeWithSecondJob ?? 0;
  const ready = Boolean(income && weeks > 0);

  return (
    <Paper
      data-tour="income-preview"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.35)' : 'divider',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.06) 100%)'
            : 'linear-gradient(145deg, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.08) 100%)',
        position: { xs: 'sticky', md: 'static' },
        top: { xs: 56, md: 'auto' },
        zIndex: { xs: 20, md: 'auto' },
        mb: { xs: 2, md: 3 },
      }}
    >
      <Typography
        variant="subtitle2"
        color="primary"
        sx={{ fontWeight: 700, display: 'block', mb: 0.75, fontSize: '0.8125rem' }}
      >
        {t('income.heroLabel')}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <RollingCurrency
            value={ready ? projectNet : 0}
            sx={{
              fontSize: { xs: 'clamp(2.25rem, 10vw, 3.5rem)', md: 'clamp(2.5rem, 4.5vw, 3.75rem)' },
              fontWeight: 800,
              color: ready ? 'success.main' : 'text.disabled',
              lineHeight: 1.05,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontSize: '0.8125rem' }}>
            {ready
              ? tWithParams('income.heroWeekly', {
                  weekly: fmt(weeklyNet),
                  weeks,
                })
              : t('income.heroHint')}
          </Typography>
          {ready && income ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {tWithParams('income.heroRmb', { amount: fmt(income.incomeRmb * scale) })}
            </Typography>
          ) : null}
        </Box>

        {ready && income ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setDetailsOpen((o) => !o)}
            >
              {t('income.heroDetails')}
            </Typography>
            <IconButton
              size="small"
              aria-expanded={detailsOpen}
              aria-label={t('income.heroDetails')}
              onClick={() => setDetailsOpen((o) => !o)}
              sx={{
                transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : null}
      </Box>

      {ready && income ? (
        <Collapse in={detailsOpen}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px dashed',
              borderColor: 'divider',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('income.federalTaxLabel')}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                −${fmt(income.federalTax * scale)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {tWithParams('income.stateTaxLabel', {
                  rate: (income.stateTaxRateEffective * 100).toFixed(1),
                })}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                −${fmt(income.stateTax * scale)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('income.totalHousing')}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                −${fmt(income.housing * scale)}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
            {tWithParams('income.footerNote', { weeks })}
          </Typography>
        </Collapse>
      ) : null}
    </Paper>
  );
}
