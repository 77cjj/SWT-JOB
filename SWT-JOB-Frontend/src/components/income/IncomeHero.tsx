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
        gap: compact ? 0.65 : 0.85,
        width: '100%',
      }}
    >
      {rows.map((row) => (
        <Box
          key={row.key}
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            columnGap: 1.5,
            minHeight: compact ? 26 : 30,
          }}
        >
          <Typography
            component="span"
            color="text.secondary"
            sx={{
              fontSize: compact ? '0.6875rem' : '0.75rem',
              lineHeight: 1.25,
              fontWeight: 500,
              minWidth: 0,
            }}
          >
            {row.label}
          </Typography>
          <Typography
            component="span"
            fontWeight={700}
            color={row.value === '—' ? 'text.disabled' : 'error.main'}
            sx={{
              fontSize: compact ? '0.8125rem' : '0.875rem',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
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
  /** 窄屏用折叠；≥sm 右侧内联明细，填满金额旁空白 */
  const useInlineDetails = useMediaQuery(theme.breakpoints.up('sm'));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const weeks = Number.isFinite(projectWeeks) && projectWeeks > 0 ? projectWeeks : 0;
  const scale = weeks > 0 ? weeks : 1;
  const projectNet = income ? income.netIncomeWithSecondJob * scale : 0;
  const weeklyNet = income?.netIncomeWithSecondJob ?? 0;
  const ready = Boolean(income && weeks > 0);
  const showMobileCollapse = ready && Boolean(income) && !useInlineDetails;

  return (
    <Paper
      data-tour="income-preview"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: (th) =>
          th.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.28)' : 'divider',
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
        sx={{
          fontWeight: 700,
          display: 'block',
          mb: { xs: 1, sm: 1.5 },
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {t('income.heroLabel')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(0, 1.15fr) minmax(200px, 0.85fr)',
          },
          gap: { xs: 1.25, sm: 2.5 },
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <RollingCurrency
            value={ready ? projectNet : 0}
            sx={{
              fontSize: { xs: 'clamp(2rem, 9vw, 2.75rem)', sm: 'clamp(2.35rem, 3.6vw, 3.15rem)' },
              fontWeight: 800,
              color: ready ? 'success.main' : 'text.disabled',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
            }}
          />
          <Typography
            color="text.secondary"
            sx={{ mt: 0.85, fontSize: '0.8125rem', lineHeight: 1.4, fontWeight: 500 }}
          >
            {ready
              ? tWithParams('income.heroWeekly', {
                  weekly: fmt(weeklyNet),
                  weeks,
                })
              : t('income.heroHint')}
          </Typography>
          {ready && income ? (
            <Typography color="text.secondary" sx={{ display: 'block', mt: 0.35, fontSize: '0.75rem', lineHeight: 1.35 }}>
              {tWithParams('income.heroRmb', { amount: fmt(income.incomeRmb * scale) })}
            </Typography>
          ) : null}
        </Box>

        {ready && income && useInlineDetails ? (
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderRadius: 2,
              border: '1px solid',
              borderColor: (th) =>
                th.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.18)' : 'divider',
              bgcolor: (th) =>
                th.palette.mode === 'light' ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.22)',
              px: { sm: 1.75, md: 2 },
              py: { sm: 1.5, md: 1.75 },
            }}
          >
            <Typography
              color="text.secondary"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: 'block',
                fontSize: '0.6875rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
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
            component="button"
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
              mt: 1.25,
              width: '100%',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              py: 0.25,
              color: 'text.secondary',
            }}
          >
            <Typography
              component="span"
              sx={{ fontSize: '0.75rem', fontWeight: 600, userSelect: 'none' }}
            >
              {t('income.heroDetails')}
            </Typography>
            <IconButton
              size="small"
              tabIndex={-1}
              aria-hidden
              sx={{
                pointerEvents: 'none',
                transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                color: 'inherit',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Box>
          <Collapse in={detailsOpen}>
            <Box
              sx={{
                mt: 0.75,
                pt: 1.25,
                borderTop: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <DeductionLines income={income!} scale={scale} compact />
            </Box>
          </Collapse>
        </>
      ) : null}

      {ready && income ? (
        <Typography
          color="text.disabled"
          sx={{ display: 'block', mt: 1.25, fontSize: '0.6875rem', lineHeight: 1.45 }}
        >
          {tWithParams('income.footerNote', { weeks })}
        </Typography>
      ) : null}
    </Paper>
  );
}
