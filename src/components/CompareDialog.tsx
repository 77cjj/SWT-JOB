import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Tooltip,
  Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { JobRecord } from '../types/job';
import { computeIncome, getProjectDurationWeeks } from '../utils/jobMetrics';

function formatShortDate(date: string) {
  // YYYY-MM-DD -> MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(5);
  return date;
}

function money(n: number) {
  return `$${Math.round(n)}`;
}

function percent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

interface Props {
  open: boolean;
  jobs: JobRecord[];
  onClose: () => void;
  onRemove: (jobId: string) => void;
}

export default function CompareDialog({ open, jobs, onClose, onRemove }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const colWidth = fullScreen ? 220 : 280;
  const fieldColWidth = fullScreen ? 108 : 124;
  const desiredWidthPx = React.useMemo(() => {
    // 给左右边距/滚动条/操作按钮留一点余量
    const cols = Math.max(jobs.length, 1);
    return fieldColWidth + cols * colWidth + 80;
  }, [jobs.length, fieldColWidth, colWidth]);

  const items = React.useMemo(() => {
    return jobs.map((job) => {
      const income = computeIncome(job);
      const weeks = getProjectDurationWeeks(job);
      const total = weeks > 0 ? income.netIncomeWithSecondJob * weeks : null;
      const totalRmb = weeks > 0 ? income.incomeRmb * weeks : null;
      return { job, income, weeks, total, totalRmb };
    });
  }, [jobs]);

  const rows = React.useMemo(
    () =>
      [
        { label: '地点', render: (j: JobRecord) => `${j.state}` },
        { label: '公司', render: (j: JobRecord) => j.company },
        {
          label: '项目日期',
          render: (j: JobRecord) => {
            const w = getProjectDurationWeeks(j);
            const range = `${formatShortDate(j.projectStartDate)} ~ ${formatShortDate(j.projectEndDate)}`;
            return w > 0 ? `${range}（约${w}周）` : range;
          },
        },
        { label: '基础时薪', render: (j: JobRecord) => `$${j.hourlyWage.toFixed(2)}/h` },
        { label: '平均工时', render: (j: JobRecord) => `${j.avgHoursPerWeek}h/周` },
        { label: '州税率', render: (j: JobRecord) => percent(j.stateTaxRate) },
        {
          label: '住宿',
          render: (j: JobRecord) =>
            j.hasHousing ? `宿舍 ${money(j.housingCostPerWeek)}/周 · ${j.housingDistanceKm}km` : '需自找',
        },
        {
          label: '二工',
          render: (j: JobRecord) =>
            `${j.secondJobPossible} · +${j.secondJobHours}h/周${j.secondJobIndustry ? ` · ${j.secondJobIndustry}` : ''}`,
        },
        {
          label: '小费',
          render: (j: JobRecord) => (j.tipped && j.averageTip ? `有 · $${j.averageTip[0]}~${j.averageTip[1]}/h` : '无'),
        },
        { label: '每周净收入（含二工）', render: (_j: JobRecord, i: number) => money(items[i]!.income.netIncomeWithSecondJob) + '/周' },
        {
          label: '项目总收入（含二工）',
          render: (_j: JobRecord, i: number) => {
            const it = items[i]!;
            if (it.total === null || it.totalRmb === null) return '—';
            return `${money(it.total)}（¥${Math.round(it.totalRmb)}）`;
          },
        },
        { label: '备注', render: (j: JobRecord) => (j.description ? j.description : '—') },
      ] as const,
    [items],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
          width: fullScreen ? '100vw' : desiredWidthPx,
          maxWidth: fullScreen ? '100vw' : '96vw',
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              岗位对比
            </Typography>
            <Typography variant="caption" color="text.secondary">
              每列一个岗位，每行一个字段（最多 3 个岗位）
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${jobs.length}/3`} size="small" variant="outlined" />
            <IconButton onClick={onClose} size="small" aria-label="关闭对比">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.45) }} />
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 0,
          borderColor: alpha(theme.palette.divider, 0.45),
        }}
      >
        {items.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              还没有加入对比的岗位。请在“我的岗位”卡片上点击“加入对比”。
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: fullScreen ? 'calc(100vh - 120px)' : '70vh', overflowX: 'auto' }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                tableLayout: 'fixed',
                '& th, & td': {
                  borderBottomColor: alpha(theme.palette.divider, 0.35),
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      bgcolor: 'background.paper',
                      fontWeight: 700,
                      width: fieldColWidth,
                      maxWidth: fieldColWidth,
                      minWidth: fieldColWidth,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    字段
                  </TableCell>
                  {items.map(({ job }) => (
                    <TableCell
                      key={job.jobId}
                      sx={{
                        bgcolor: 'background.paper',
                        width: colWidth,
                        maxWidth: colWidth,
                        minWidth: colWidth,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap title={job.jobTitle}>
                            {job.jobTitle}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap title={job.company}>
                            {job.company}
                          </Typography>
                        </Box>
                        <Tooltip title="移出对比">
                          <IconButton
                            size="small"
                            onClick={() => onRemove(job.jobId)}
                            aria-label={`移出对比：${job.jobTitle}`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label} hover>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        fontWeight: 600,
                        width: fieldColWidth,
                        maxWidth: fieldColWidth,
                        minWidth: fieldColWidth,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.label}
                    </TableCell>
                    {items.map(({ job }, idx) => (
                      <TableCell
                        key={`${row.label}-${job.jobId}`}
                        sx={{
                          verticalAlign: 'top',
                          width: colWidth,
                          maxWidth: colWidth,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {row.render(job, idx)}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onClose} variant="contained">
          关闭
        </Button>
      </Box>
    </Dialog>
  );
}


