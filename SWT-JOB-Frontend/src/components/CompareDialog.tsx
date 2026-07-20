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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { JobRecord } from '../types/job';
import { computeIncome, getProjectDurationWeeks } from '../utils/jobMetrics';
import { useI18n } from '../context/I18nContext';

function formatShortDate(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(5);
  return date;
}

function money(n: number) {
  return `$${Math.round(n)}`;
}

function percent(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function stars(n: number) {
  return `${n}/5`;
}

const AI_ANALYZE_MS = 5000;

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
  const stackAi = useMediaQuery(theme.breakpoints.down('md'));
  const colWidth = fullScreen ? 200 : 240;
  const fieldColWidth = fullScreen ? 100 : 120;

  const [aiPhase, setAiPhase] = React.useState<'idle' | 'loading' | 'done'>('idle');

  React.useEffect(() => {
    if (!open || jobs.length === 0) {
      setAiPhase('idle');
      return;
    }
    setAiPhase('loading');
    const timer = window.setTimeout(() => setAiPhase('done'), AI_ANALYZE_MS);
    return () => window.clearTimeout(timer);
  }, [open, jobs.map((j) => j.jobId).join('|')]);

  const items = React.useMemo(() => {
    return jobs.map((job) => {
      const income = computeIncome(job);
      const weeks = getProjectDurationWeeks(job);
      const total = weeks > 0 ? income.netIncomeWithSecondJob * weeks : null;
      return { job, income, weeks, total };
    });
  }, [jobs]);

  const bestNetIdx = React.useMemo(() => {
    if (items.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < items.length; i += 1) {
      if (items[i]!.income.netIncomeWithSecondJob > items[best]!.income.netIncomeWithSecondJob) {
        best = i;
      }
    }
    return best;
  }, [items]);

  const rows = React.useMemo(
    () =>
      [
        { label: t('compare.location'), render: (j: JobRecord) => `${j.city ? `${j.city}, ` : ''}${j.state}` },
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
          label: t('compare.hoursRange'),
          render: (j: JobRecord) => `${j.workHoursRange[0]}–${j.workHoursRange[1]}h`,
        },
        {
          label: t('compare.overtime'),
          render: (j: JobRecord) =>
            j.overtimeAvailable
              ? `${t('compare.yes')} · ×${j.overtimeRate}`
              : t('compare.no'),
        },
        {
          label: t('compare.tip'),
          render: (j: JobRecord) =>
            j.tipped && j.averageTip
              ? `${t('compare.hasTip')} · $${j.averageTip[0]}~${j.averageTip[1]}/h`
              : t('savedJobCard.noTip'),
        },
        {
          label: t('compare.tipIncome'),
          render: (_j: JobRecord, i: number) => money(items[i]!.income.tipIncome) + `/${t('jobForm.perWeek')}`,
        },
        {
          label: t('jobForm.housing'),
          render: (j: JobRecord) =>
            j.hasHousing
              ? `${t('compare.housing')} ${money(j.housingCostPerWeek)}/${t('jobForm.perWeek')} · ${j.housingDistanceKm}km`
              : t('historicalJobs.needsOwnHousing'),
        },
        {
          label: t('compare.housingCondition'),
          render: (j: JobRecord) => j.housingCondition ?? t('compare.na'),
        },
        {
          label: t('jobForm.secondJob'),
          render: (j: JobRecord) =>
            `${j.secondJobPossible} · +${j.secondJobHours}h/${t('jobForm.perWeek')}${
              j.secondJobIndustry ? ` · ${j.secondJobIndustry}` : ''
            }`,
        },
        {
          label: t('jobForm.secondJobHourlyWage'),
          render: (j: JobRecord) =>
            j.secondJobHourlyWage != null ? `$${j.secondJobHourlyWage.toFixed(2)}/h` : t('compare.na'),
        },
        {
          label: t('compare.secondJobIncome'),
          render: (_j: JobRecord, i: number) =>
            money(items[i]!.income.secondJobIncome) + `/${t('jobForm.perWeek')}`,
        },
        {
          label: t('compare.estimatedStateTax'),
          render: (_j: JobRecord, i: number) => percent(items[i]!.income.stateTaxRateEffective),
        },
        {
          label: t('compare.weeklyTax'),
          render: (_j: JobRecord, i: number) => money(items[i]!.income.tax) + `/${t('jobForm.perWeek')}`,
        },
        {
          label: t('compare.weeklyNetIncome'),
          render: (_j: JobRecord, i: number) =>
            money(items[i]!.income.netIncomeWithSecondJob) + `/${t('jobForm.perWeek')}`,
        },
        {
          label: t('compare.projectTotalIncome'),
          render: (_j: JobRecord, i: number) => {
            const it = items[i]!;
            if (it.total === null) return t('compare.na');
            return money(it.total);
          },
        },
        { label: t('compare.workStability'), render: (j: JobRecord) => stars(j.workStability) },
        { label: t('compare.safetyLevel'), render: (j: JobRecord) => stars(j.safetyLevel) },
        { label: t('compare.employerRating'), render: (j: JobRecord) => stars(j.employerRating) },
        {
          label: t('compare.costOfLiving'),
          render: (j: JobRecord) => String(j.costOfLivingIndex),
        },
        {
          label: t('compare.incidents'),
          render: (j: JobRecord) => (j.lastYearIncidents ? t('compare.yes') : t('compare.no')),
        },
        {
          label: t('compare.culture'),
          render: (j: JobRecord) => j.culture ?? t('compare.na'),
        },
        {
          label: t('compare.employerAttitude'),
          render: (j: JobRecord) => j.employerAttitude ?? t('compare.na'),
        },
        {
          label: t('compare.benefits'),
          render: (j: JobRecord) => j.employeeBenefits?.trim() || t('compare.na'),
        },
        {
          label: t('compare.notes'),
          render: (j: JobRecord) => (j.description ? j.description : t('compare.na')),
        },
      ] as const,
    [items, t],
  );

  const aiPlaceholder = React.useMemo(() => {
    if (items.length === 0) return '';
    const names = items.map((it) => it.job.jobTitle).join('、');
    const best = bestNetIdx >= 0 ? items[bestNetIdx]! : null;
    return tWithParams('compare.aiPlaceholder', {
      jobs: names,
      best: best?.job.jobTitle ?? '—',
      weekly: best ? Math.round(best.income.netIncomeWithSecondJob) : 0,
      count: items.length,
    });
  }, [bestNetIdx, items, tWithParams]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          overflow: 'hidden',
          width: fullScreen ? '100vw' : 'min(1100px, 96vw)',
          maxWidth: fullScreen ? '100vw' : '96vw',
          height: fullScreen ? '100dvh' : 'auto',
          maxHeight: fullScreen ? '100dvh' : '90vh',
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
          display: 'flex',
          flexDirection: stackAi ? 'column' : 'row',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {items.length === 0 ? (
          <Box sx={{ p: 3, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('compare.emptyMessage')}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1, maxHeight: fullScreen ? '46vh' : stackAi ? '42vh' : '70vh', overflow: 'auto' }}>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    tableLayout: 'fixed',
                    minWidth: fieldColWidth + items.length * colWidth,
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
                        }}
                      >
                        {t('compare.field')}
                      </TableCell>
                      {items.map(({ job }, idx) => (
                        <TableCell
                          key={job.jobId}
                          sx={{
                            bgcolor: idx === bestNetIdx ? alpha(theme.palette.text.primary, 0.04) : 'background.paper',
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
                              {idx === bestNetIdx ? (
                                <Chip
                                  size="small"
                                  label={t('compare.bestNet')}
                                  sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                                />
                              ) : null}
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
                            fontSize: '0.75rem',
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
                              bgcolor: idx === bestNetIdx ? alpha(theme.palette.text.primary, 0.03) : undefined,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'anywhere',
                                fontSize: '0.8125rem',
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
            </Box>

            <Box
              sx={{
                width: stackAi ? '100%' : 300,
                flexShrink: 0,
                borderLeft: stackAi ? 0 : '1px solid',
                borderTop: stackAi ? '1px solid' : 0,
                borderColor: 'divider',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                minHeight: stackAi ? 200 : undefined,
                bgcolor: alpha(theme.palette.text.primary, 0.02),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AutoAwesomeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  {t('compare.aiTitle')}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t('compare.aiSubtitle')}
              </Typography>

              {aiPhase === 'loading' ? (
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {t('compare.aiAnalyzing')}
                    </Typography>
                  </Box>
                  <LinearProgress />
                  <Typography variant="caption" color="text.disabled">
                    {t('compare.aiAnalyzingHint')}
                  </Typography>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, lineHeight: 1.65, whiteSpace: 'pre-wrap', flex: 1 }}
                >
                  {aiPlaceholder}
                </Typography>
              )}
            </Box>
          </>
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
