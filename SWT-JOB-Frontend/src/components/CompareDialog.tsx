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
import { useI18n } from '../context/I18nContext';

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
  const { t, tWithParams } = useI18n();
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
        { label: t('compare.location'), render: (j: JobRecord) => `${j.state}` },
        { label: t('compare.company'), render: (j: JobRecord) => j.company },
        {
          label: t('compare.projectDate'),
          render: (j: JobRecord) => {
            const w = getProjectDurationWeeks(j);
            const range = `${formatShortDate(j.projectStartDate)} ~ ${formatShortDate(j.projectEndDate)}`;
            return w > 0 ? `${range} (${t('savedJobCard.about')}${w}${t('jobForm.perWeek')})` : range;
          },
        },
        { label: t('jobForm.hourlyWage'), render: (j: JobRecord) => `$${j.hourlyWage.toFixed(2)}/h` },
        { label: t('compare.avgHours'), render: (j: JobRecord) => `${j.avgHoursPerWeek}h/${t('jobForm.perWeek')}` },
        {
          label: t('compare.estimatedStateTax'),
          render: (_j: JobRecord, i: number) => percent(items[i]!.income.stateTaxRateEffective),
        },
        {
          label: t('jobForm.housing'),
          render: (j: JobRecord) =>
            j.hasHousing ? `${t('compare.housing')} ${money(j.housingCostPerWeek)}/${t('jobForm.perWeek')} · ${j.housingDistanceKm}km` : t('historicalJobs.needsOwnHousing'),
        },
        {
          label: t('jobForm.secondJob'),
          render: (j: JobRecord) =>
            `${j.secondJobPossible} · +${j.secondJobHours}h/${t('jobForm.perWeek')}${j.secondJobIndustry ? ` · ${j.secondJobIndustry}` : ''}`,
        },
        {
          label: t('compare.tip'),
          render: (j: JobRecord) => (j.tipped && j.averageTip ? `${t('compare.hasTip')} · $${j.averageTip[0]}~${j.averageTip[1]}/h` : t('savedJobCard.noTip')),
        },
        { label: t('compare.weeklyNetIncome'), render: (_j: JobRecord, i: number) => money(items[i]!.income.netIncomeWithSecondJob) + `/${t('jobForm.perWeek')}` },
        {
          label: t('compare.projectTotalIncome'),
          render: (_j: JobRecord, i: number) => {
            const it = items[i]!;
            if (it.total === null || it.totalRmb === null) return t('compare.na');
            return `${money(it.total)} (¥${Math.round(it.totalRmb)})`;
          },
        },
        { label: t('compare.notes'), render: (j: JobRecord) => (j.description ? j.description : t('compare.na')) },
      ] as const,
    [items, t],
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
              {t('compare.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('compare.subtitle')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${jobs.length}/3`} size="small" variant="outlined" />
            <IconButton onClick={onClose} size="small" aria-label={t('compare.closeAria')}>
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
              {t('compare.emptyMessage')}
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
                    {t('compare.field')}
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
                        <Tooltip title={t('home.removeFromCompare')}>
                          <IconButton
                            size="small"
                            onClick={() => onRemove(job.jobId)}
                            aria-label={tWithParams('compare.removeAria', { jobTitle: job.jobTitle })}
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
          {t('common.close')}
        </Button>
      </Box>
    </Dialog>
  );
}


