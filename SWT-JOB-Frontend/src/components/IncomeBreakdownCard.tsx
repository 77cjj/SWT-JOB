import { Box, Divider, Paper, Typography } from '@mui/material';
import type { IncomeSummary } from '../utils/jobMetrics';
import { useI18n } from '../context/I18nContext';

function fmtMoney(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function BreakdownRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: valueColor ?? 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function IncomeBreakdownCard({
  income,
  projectWeeks,
  title,
  showNet = true,
}: {
  income: IncomeSummary | null;
  projectWeeks: number;
  title?: string;
  showNet?: boolean;
}) {
  const { t, tWithParams } = useI18n();
  const safeWeeks = Number.isFinite(projectWeeks) ? projectWeeks : 0;
  // 这个卡片默认以"项目周期合计"为口径；如果日期无效，就提示用户修正日期
  const isProjectValid = safeWeeks > 0;
  const scale = safeWeeks;
  const displayTitle = title || t('income.title');

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.paper,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, fontWeight: 700 }}>
        {displayTitle}
      </Typography>

      {!income ? (
        <Typography variant="body2" color="text.secondary">
          {t('income.fillInfoFirst')}
        </Typography>
      ) : !isProjectValid ? (
        <Typography variant="body2" color="text.secondary">
          {t('income.setValidDates')}
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('income.projectTotalGross')}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              +${fmtMoney(income.totalGross * scale)}
            </Typography>
          </Box>

          <Divider
            sx={{
              my: 1.25,
              borderStyle: 'dashed',
              borderColor: (theme) =>
                theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.25)' : theme.palette.divider,
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
            <BreakdownRow
              label={t('income.federalTaxLabel')}
              value={`-$${fmtMoney(income.federalTax * scale)}`}
              valueColor="error.main"
            />
            <BreakdownRow
              label={tWithParams('income.stateTaxLabel', {
                rate: (income.stateTaxRateEffective * 100).toFixed(2),
              })}
              value={`-$${fmtMoney(income.stateTax * scale)}`}
              valueColor="error.main"
            />
            <BreakdownRow
              label={t('income.totalHousing')}
              value={`-$${fmtMoney(income.housing * scale)}`}
              valueColor="error.main"
            />
          </Box>

          {showNet && (
            <>
              <Divider
                sx={{
                  my: 1.25,
                  borderStyle: 'dashed',
                  borderColor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.25)' : theme.palette.divider,
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t('income.estimatedNet')}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +${fmtMoney(income.netIncomeWithSecondJob * scale)}
                </Typography>
              </Box>
            </>
          )}

          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
            {tWithParams('income.footerNote', { weeks: safeWeeks })}
          </Typography>
        </>
      )}
    </Paper>
  );
}


