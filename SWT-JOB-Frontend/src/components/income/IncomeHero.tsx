'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  convertFromUsd,
  currenciesForLanguage,
  CURRENCIES,
  nextCurrency,
  type CurrencyCode,
} from '../../utils/displayCurrency';

function fmtUsd(value: number) {
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
      value: `−$${fmtUsd(income.federalTax * scale)}`,
    },
    {
      key: 'state',
      label: tWithParams('income.stateTaxLabel', {
        rate: (income.stateTaxRateEffective * 100).toFixed(1),
      }),
      value: `−$${fmtUsd(income.stateTax * scale)}`,
    },
    {
      key: 'housing',
      label: t('income.totalHousing'),
      value: income.housing * scale > 0 ? `−$${fmtUsd(income.housing * scale)}` : '—',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 0.5 : 0.75,
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
            minHeight: compact ? 24 : 28,
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
            color={row.value === '—' ? 'text.disabled' : 'text.primary'}
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
  const { t, tWithParams, language } = useI18n();
  const theme = useTheme();
  const useInlineDetails = useMediaQuery(theme.breakpoints.up('sm'));
  const [detailsOpen, setDetailsOpen] = useState(false);

  const availableCurrencies = useMemo(() => currenciesForLanguage(language), [language]);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(
    () => availableCurrencies[0] ?? 'USD',
  );

  useEffect(() => {
    if (!availableCurrencies.includes(displayCurrency)) {
      setDisplayCurrency(availableCurrencies[0] ?? 'USD');
    }
  }, [availableCurrencies, displayCurrency]);

  const weeks = Number.isFinite(projectWeeks) && projectWeeks > 0 ? projectWeeks : 0;
  const scale = weeks > 0 ? weeks : 1;
  const projectNetUsd = income ? income.netIncomeWithSecondJob * scale : 0;
  const weeklyNetUsd = income?.netIncomeWithSecondJob ?? 0;
  const ready = Boolean(income && weeks > 0);
  const showMobileCollapse = ready && Boolean(income) && !useInlineDetails;
  const currencyMeta = CURRENCIES[displayCurrency];
  const canCycleCurrency = availableCurrencies.length > 1;

  const handleCycleCurrency = () => {
    if (!ready || !canCycleCurrency) return;
    setDisplayCurrency((prev) => nextCurrency(prev, language));
  };

  return (
    <Paper
      data-tour="income-preview"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.25 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: { xs: 'sticky', md: 'static' },
        top: { xs: 56, md: 'auto' },
        zIndex: { xs: 20, md: 'auto' },
        mb: { xs: 2, md: 3 },
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          display: 'block',
          mb: { xs: 1, sm: 1.25 },
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {t('income.heroLabel')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(0, 1.15fr) minmax(180px, 0.85fr)',
          },
          gap: { xs: 1.25, sm: 3 },
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box
            {...(ready && canCycleCurrency
              ? {
                  component: 'button' as const,
                  type: 'button' as const,
                  onClick: handleCycleCurrency,
                  'aria-label': tWithParams('income.cycleCurrency', { currency: displayCurrency }),
                  title: t('income.cycleCurrencyHint'),
                }
              : {})}
            sx={{
              display: 'inline-flex',
              alignItems: 'flex-start',
              alignSelf: 'flex-start',
              border: 0,
              background: 'transparent',
              p: 0,
              m: 0,
              cursor: ready && canCycleCurrency ? 'pointer' : 'default',
              textAlign: 'left',
              color: 'inherit',
              borderRadius: 1,
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'text.primary',
                outlineOffset: 2,
              },
            }}
          >
            <RollingCurrency
              value={ready ? convertFromUsd(projectNetUsd, displayCurrency) : 0}
              prefix={currencyMeta.symbol}
              sx={{
                fontSize: { xs: 'clamp(2rem, 9vw, 2.75rem)', sm: 'clamp(2.35rem, 3.6vw, 3.15rem)' },
                fontWeight: 800,
                color: ready ? 'text.primary' : 'text.disabled',
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
              }}
            />
          </Box>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75, fontSize: '0.8125rem', lineHeight: 1.4, fontWeight: 500 }}
          >
            {ready
              ? tWithParams('income.heroWeekly', {
                  weekly: fmtUsd(weeklyNetUsd),
                  weeks,
                })
              : t('income.heroHint')}
          </Typography>
        </Box>

        {ready && income && useInlineDetails ? (
          <Box
            sx={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: { sm: 2.5 },
              borderLeft: { sm: '1px solid' },
              borderColor: { sm: 'divider' },
            }}
          >
            <Typography
              color="text.secondary"
              sx={{
                fontWeight: 600,
                mb: 0.85,
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
                borderTop: '1px solid',
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
