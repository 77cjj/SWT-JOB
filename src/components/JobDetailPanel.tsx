import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { JobRecord } from '../types/job';
import { computeIncome, getProjectDurationWeeks } from '../utils/jobMetrics';

interface Props {
  job: JobRecord | null;
  onClose: () => void;
}

export default function JobDetailPanel({ job, onClose }: Props) {
  if (!job) return null;

  const income = computeIncome(job);
  const projectWeeks = getProjectDurationWeeks(job);
  const scale = projectWeeks > 0 ? projectWeeks : 1;
  const fmtMoney = (value: number) => Math.round(value).toLocaleString('en-US');
  const grossTotal = income.totalGross * scale;
  const federalTaxTotal = income.federalTax * scale;
  const stateTaxTotal = income.stateTax * scale;
  const housingTotal = income.housing * scale;
  const netTotal = income.netIncomeWithSecondJob * scale;

  return (
    <Dialog open={!!job} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.1em' }}>
              岗位详情
            </Typography>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mt: 0.5 }}>
              {job.jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {job.company}  {job.state}{' '}
              <Chip
                label={`州税率 ${(job.stateTaxRate * 100).toFixed(1)}%`}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Typography>
          </Box>
          <Button onClick={onClose} startIcon={<CloseIcon />} size="small">
            关闭
          </Button>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                薪资结构
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <DetailRow label="基础时薪" value={`$${job.hourlyWage.toFixed(2)}`} />
                <DetailRow label="OT 倍率" value={`x${job.overtimeRate}`} />
                <DetailRow
                  label="小费"
                  value={
                    job.tipped && job.averageTip
                      ? `$${job.averageTip[0]}~${job.averageTip[1]}/h`
                      : '无'
                  }
                />
                <DetailRow
                  label="平均工时"
                  value={`${job.avgHoursPerWeek}h（浮动 ${job.workHoursRange[0]}~${job.workHoursRange[1]}）`}
                />
              </Box>
            </Paper>
          <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                住宿与生活
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <DetailRow label="雇主宿舍" value={job.hasHousing ? '提供' : '不提供'} />
                <DetailRow
                  label="住宿费用"
                  value={job.hasHousing ? `$${job.housingCostPerWeek}/周` : '需自理'}
                />
                <DetailRow label="距离" value={`${job.housingDistanceKm} km`} />
                <DetailRow label="物价指数" value={job.costOfLivingIndex.toString()} />
              </Box>
            </Paper>
          <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
                风险洞察
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <DetailRow label="工时稳定性" value={`${job.workStability}/5`} />
                <DetailRow label="治安评分" value={`${job.safetyLevel}/5`} />
                <DetailRow label="雇主评分" value={`${job.employerRating}/5`} />
                <DetailRow
                  label="去年事故"
                  value={job.lastYearIncidents ? '出现砍工时 / 被开除' : '无异常'}
                />
              </Box>
            </Paper>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
              二工与OT
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DetailRow label="二工难度" value={job.secondJobPossible} />
              <DetailRow label="默认工时" value={`+${job.secondJobHours}h`} />
              <DetailRow label="常见行业" value={job.secondJobIndustry} />
              <DetailRow label="OT 支持" value={job.overtimeAvailable ? '是' : '否'} />
            </Box>
          </Paper>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                税前总收入 Gross
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                +${fmtMoney(grossTotal)}
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
                label={`联邦税 (Fed 10%)`}
                value={`-$${fmtMoney(federalTaxTotal)}`}
                valueColor="error.main"
              />
              <BreakdownRow
                label={`州税 (State ${(job.stateTaxRate * 100).toFixed(2)}%)`}
                value={`-$${fmtMoney(stateTaxTotal)}`}
                valueColor="error.main"
              />
              <BreakdownRow
                label="总住宿费 Housing"
                value={`-$${fmtMoney(housingTotal)}`}
                valueColor="error.main"
              />
            </Box>

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
                +${fmtMoney(netTotal)}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              *{projectWeeks > 0 ? `按项目周期约 ${projectWeeks} 周合计；` : '按每周估算；'}
              FICA 默认按 J-1 免除，税费为简化预估
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 600 }}>
              地图定位
            </Typography>
            <Box
              sx={{
                aspectRatio: '4/3',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                 {job.state} · 近似地理位置
              </Typography>
              <Typography variant="caption" color="text.disabled">
                此处可对接实际地图组件
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
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
