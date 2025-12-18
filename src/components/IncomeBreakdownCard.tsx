import { Box, Divider, Paper, Typography } from '@mui/material';
import type { IncomeSummary } from '../utils/jobMetrics';

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
  title = '收入拆解',
  showNet = true,
}: {
  income: IncomeSummary | null;
  projectWeeks: number;
  title?: string;
  showNet?: boolean;
}) {
  const safeWeeks = Number.isFinite(projectWeeks) ? projectWeeks : 0;
  // 这个卡片默认以“项目周期合计”为口径；如果日期无效，就提示用户修正日期
  const isProjectValid = safeWeeks > 0;
  const scale = safeWeeks;

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
        {title}
      </Typography>

      {!income ? (
        <Typography variant="body2" color="text.secondary">
          先填写时薪/工时等信息，才会显示预估拆解。
        </Typography>
      ) : !isProjectValid ? (
        <Typography variant="body2" color="text.secondary">
          请先设置有效的项目开始/结束日期（结束日期需要晚于开始日期），才能显示项目总额。
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              项目税前总收入 Gross
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
              label="联邦税 (Fed 10%)"
              value={`-$${fmtMoney(income.federalTax * scale)}`}
              valueColor="error.main"
            />
            <BreakdownRow
              label={`州税 (State ${(income.stateTaxRateEffective * 100).toFixed(2)}%)`}
              value={`-$${fmtMoney(income.stateTax * scale)}`}
              valueColor="error.main"
            />
            <BreakdownRow
              label="总住宿费 Housing"
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
                  预计到手 Net
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +${fmtMoney(income.netIncomeWithSecondJob * scale)}
                </Typography>
              </Box>
            </>
          )}

          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
            *按项目周期约 {safeWeeks} 周合计；FICA 默认按 J-1 免除，税费为简化预估
          </Typography>
        </>
      )}
    </Paper>
  );
}


