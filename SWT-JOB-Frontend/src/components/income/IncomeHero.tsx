'use client';

import { useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { IncomeSummary } from '../../utils/jobMetrics';
import { useI18n } from '../../context/I18nContext';
import { RollingCurrency } from './RollingCurrency';

function fmt(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function DeductionLines({
  income,
  scale,
  compact,
}: {
  income: IncomeSummary;
  scale: number;
  compact?: boolean;
}) {
  const { t, tWithParams } = useI18n();
  const rows = [
    {
      key: 'federal',
      label: t('income.federalTaxLabel'),
      value: `−$${fmt(income.federalTax * scale)}`,
    },
    {
      key: 'state',
      label: tWithParams('income.stateTaxLabel', {
        rate: (income.stateTaxRateEffective * 100).toFixed(1),
      }),
      value: `−$${fmt(income.stateTax * scale)}`,
    },
    {
      key: 'housing',
      label: t('income.totalHousing'),
      value: income.housing * scale > 0 ? `−$${fmt(income.housing * scale)}` : '—',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 0.75 : 1,
        width: '100%',
      }}
    >
      {rows.map((row) => (
        <Box
          key={row.key}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            minHeight: compact ? 28 : 32,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: compact ? '0.6875rem' : '0.75rem',
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {row.label}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            color={row.value === '—' ? 'text.disabled' : 'error.main'}
            sx={{
              fontSize: compact ? '0.8125rem' : '0.875rem',
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function IncomeHero({
  income,
  projectWeeks,
}: {
  income: IncomeSummary | null;
  projectWeeks: number;
}) {
  const { t, tWithParams } = useI18n();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const weeks = Number.isFinite(projectWeeks) && projectWeeks > 0 ? projectWeeks : 0;
  const scale = weeks > 0 ? weeks : 1;
  const projectNet = income ? income.netIncomeWithSecondJob * scale : 0;
  const weeklyNet = income?.netIncomeWithSecondJob ?? 0;
  const ready = Boolean(income && weeks > 0);
  const showMobileCollapse = ready && income && isMobile;

  return (
    <Paper
      data-tour="income-preview"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: (th) =>
          th.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.35)' : 'divider',
        background: (th) =>
          th.palette.mode === 'light'
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
        sx={{ fontWeight: 700, display: 'block', mb: 1.25, fontSize: '0.8125rem', letterSpacing: '0.02em' }}
      >
        {t('income.heroLabel')}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'stretch' },
          gap: { xs: 1.5, sm: 2.5 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <RollingCurrency
            value={ready ? projectNet : 0}
            sx={{
              fontSize: { xs: 'clamp(2rem, 9vw, 2.75rem)', sm: 'clamp(2.25rem, 4vw, 3.25rem)' },
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

        {ready && income && !isMobile ? (
          <Box
            sx={{
              flex: { sm: '0 0 auto', md: '0 0 240px' },
              width: { sm: '100%', md: 240 },
              maxWidth: '100%',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: (th) =>
                th.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.2)' : 'divider',
              bgcolor: (th) =>
                th.palette.mode === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.2)',
              px: 1.75,
              py: 1.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, mb: 0.75, display: 'block', fontSize: '0.6875rem' }}
            >
              {t('income.heroDetails')}
            </Typography>
            <DeductionLines income={income} scale={scale} />
          </Box>
        ) : null}
      </Box>

      {showMobileCollapse ? (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
              mt: 1.25,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}
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
          <Collapse in={detailsOpen}>
            <Box
              sx={{
                mt: 1,
                pt: 1.25,
                borderTop: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <DeductionLines income={income} scale={scale} compact />
            </Box>
          </Collapse>
        </>
      ) : null}

      {ready && income ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.25, lineHeight: 1.45 }}>
          {tWithParams('income.footerNote', { weeks })}
        </Typography>
      ) : null}
    </Paper>
  );
}
