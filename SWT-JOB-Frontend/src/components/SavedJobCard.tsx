import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CompareArrows as CompareIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import type { JobRecord } from '../types/job';
import {
  computeIncome,
  getProjectDurationWeeks,
} from '../utils/jobMetrics';
import { useI18n } from '../context/I18nContext';
import { JobCardComments } from './jobs/JobCardComments';

function formatShortDate(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(5);
  return date;
}

interface SavedJobCardProps {
  job: JobRecord;
  onSelect: (job: JobRecord) => void;
  onEdit: (job: JobRecord) => void;
  onDelete: (jobId: string) => void;
  onToggleCompare: (jobId: string) => void;
  isCompared: boolean;
  isDemo?: boolean;
}

export default function SavedJobCard({
  job,
  onSelect,
  onEdit,
  onDelete,
  onToggleCompare,
  isCompared,
  isDemo = false,
}: SavedJobCardProps) {
  const { t, tWithParams } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const income = computeIncome(job);
  const projectWeeks = getProjectDurationWeeks(job);
  const totalIncome = projectWeeks > 0 ? income.netIncomeWithSecondJob * projectWeeks : null;

  const getFatigueColor = (hours: number) => {
    if (hours > 52) return 'error';
    if (hours >= 38) return 'warning';
    return 'success';
  };

  const incomeLabel =
    totalIncome !== null
      ? `$${Math.round(totalIncome)}`
      : `$${Math.round(income.netIncomeWithSecondJob)}/w`;

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: 'hidden',
        bgcolor: (theme) =>
          isCompared
            ? theme.palette.mode === 'light'
              ? 'rgba(99, 102, 241, 0.06)'
              : 'rgba(99, 102, 241, 0.12)'
            : theme.palette.mode === 'light'
              ? theme.palette.grey[50]
              : theme.palette.background.paper,
        borderColor: isCompared ? 'primary.main' : 'divider',
        transition: 'border-color 160ms ease',
      }}
    >
      <CardContent sx={{ py: 1.25, px: 1.5, '&:last-child': { pb: expanded ? 1.25 : 1.25 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: '100%' }}>
                {job.jobTitle}
              </Typography>
              {isDemo ? (
                <Chip label={t('savedJobCard.demoBadge')} size="small" color="default" sx={{ height: 20, fontSize: '0.65rem' }} />
              ) : null}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {job.company} · {job.state}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
              <Chip
                label={`${job.avgHoursPerWeek}h/w`}
                size="small"
                color={getFatigueColor(job.avgHoursPerWeek)}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
              <Chip
                label={`$${job.hourlyWage.toFixed(2)}/h`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
              <Chip
                label={incomeLabel}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Box>
          </Box>
          <IconButton
            size="small"
            aria-label={expanded ? t('savedJobCard.collapse') : t('savedJobCard.expand')}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            sx={{
              mt: -0.25,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {formatShortDate(job.projectStartDate)} ~ {formatShortDate(job.projectEndDate)}
            {projectWeeks > 0 ? ` · ${projectWeeks}${t('jobForm.perWeek')}` : ''}
          </Typography>
          <Button
            size="small"
            variant={isCompared ? 'contained' : 'outlined'}
            startIcon={<CompareIcon sx={{ fontSize: '1rem !important' }} />}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(job.jobId);
            }}
            color={isCompared ? 'primary' : 'inherit'}
            sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem', flexShrink: 0 }}
          >
            {isCompared ? t('home.removeFromCompare') : t('home.addToCompare')}
          </Button>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.25 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('jobForm.hourlyWage')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  ${job.hourlyWage.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {job.tipped && job.averageTip
                    ? `${t('jobForm.averageTip')} $${job.averageTip[0]}~${job.averageTip[1]}/h`
                    : t('savedJobCard.noTip')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('jobForm.housing')}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {job.hasHousing ? `$${job.housingCostPerWeek}/w` : t('historicalJobs.needsOwnHousing')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {job.housingDistanceKm} km
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('savedJobCard.projectTotalIncome')}
                </Typography>
                {totalIncome !== null ? (
                  <>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ${Math.round(totalIncome)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${Math.round(income.netIncomeWithSecondJob)}/w
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    ${Math.round(income.netIncomeWithSecondJob)}/w
                  </Typography>
                )}
              </Box>
            </Box>

            {job.description ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.6 }}>
                {job.description}
              </Typography>
            ) : null}

            <JobCardComments jobId={job.jobId} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.25 }}>
              <Button
                size="small"
                variant="text"
                startIcon={<ViewIcon fontSize="small" />}
                onClick={() => onSelect(job)}
                sx={{ fontSize: '0.75rem' }}
              >
                {t('home.viewDetails')}
              </Button>
              {!isDemo ? (
                <>
                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => onEdit(job)} color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (window.confirm(tWithParams('savedJobCard.confirmDelete', { jobTitle: job.jobTitle }))) {
                          onDelete(job.jobId);
                        }
                      }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : null}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
