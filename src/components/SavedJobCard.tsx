import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import type { JobRecord } from '../types/job';
import {
  computeIncome,
  getProjectDurationWeeks,
} from '../utils/jobMetrics';
import { useI18n } from '../context/I18nContext';

function formatShortDate(date: string) {
  // 期望输入：YYYY-MM-DD -> MM-DD（不包含年份）
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
}

export default function SavedJobCard({
  job,
  onSelect,
  onEdit,
  onDelete,
  onToggleCompare,
  isCompared,
}: SavedJobCardProps) {
  const { t, tWithParams } = useI18n();
  const income = computeIncome(job);
  const projectWeeks = getProjectDurationWeeks(job);
  const totalIncome = projectWeeks > 0 ? income.netIncomeWithSecondJob * projectWeeks : null;
  const totalIncomeRmb = projectWeeks > 0 ? income.incomeRmb * projectWeeks : null;

  const getFatigueColor = (hours: number) => {
    if (hours > 52) return 'error';
    if (hours >= 38) return 'warning';
    return 'success';
  };

  const getIncomeColor = (income: number) => {
    if (income >= 900) return 'success';
    if (income >= 700) return 'info';
    return 'warning';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // 去掉玻璃拟态大阴影（会显得“脏/怪”），改成更克制的卡片风格
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.paper,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => theme.shadows[1],
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[3],
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.14)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {job.jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.company} · {job.state}
            </Typography>
          </Box>
          <Chip label={job.jobTitle} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            label={` ${job.avgHoursPerWeek}h/w`}
            size="small"
            color={getFatigueColor(job.avgHoursPerWeek)}
            variant="outlined"
          />
          <Chip
            label={
              totalIncome !== null
                ? `${t('income.totalGross')} $${Math.round(totalIncome)}`
                : `$${Math.round(income.netIncomeWithSecondJob)}/w`
            }
            size="small"
            color={getIncomeColor(Math.round(income.netIncomeWithSecondJob))}
            variant="outlined"
          />
          <Chip
            label={`${formatShortDate(job.projectStartDate)} ~ ${formatShortDate(job.projectEndDate)}${
              projectWeeks > 0 ? ` (${t('savedJobCard.about')}${projectWeeks}${t('jobForm.perWeek')})` : ''
            }`}
            size="small"
            variant="outlined"
          />
         
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', minWidth: 0 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('jobForm.hourlyWage')}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${job.hourlyWage.toFixed(2)}
            </Typography>
            {job.tipped && job.averageTip ? (
              <Typography variant="caption" color="text.secondary">
                {t('jobForm.averageTip')} ${job.averageTip[0]}~{job.averageTip[1]}/h
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t('savedJobCard.noTip')}
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', minWidth: 0 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('jobForm.housing')}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {job.hasHousing ? `$${job.housingCostPerWeek}/w` : t('historicalJobs.needsOwnHousing')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('jobForm.housingDistanceKm')} {job.housingDistanceKm} km
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', minWidth: 0 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('savedJobCard.projectTotalIncome')}
            </Typography>
            {totalIncome !== null && totalIncomeRmb !== null ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  ${Math.round(totalIncome)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ¥{Math.round(totalIncomeRmb)} ({t('savedJobCard.weeklyAbout')} ${Math.round(income.netIncomeWithSecondJob)}/w)
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  ${Math.round(income.netIncomeWithSecondJob)}/w
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ¥{Math.round(income.incomeRmb)}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {job.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {job.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => onSelect(job)}
          sx={{ minWidth: 'auto', px: 1.5 }}
        >
          {t('home.viewDetails')}
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
          <Button
            size="small"
            variant={isCompared ? 'contained' : 'outlined'}
            startIcon={<CompareIcon />}
            onClick={() => onToggleCompare(job.jobId)}
            color={isCompared ? 'primary' : 'inherit'}
            sx={{ minWidth: 'auto', px: 1.5 }}
          >
            {isCompared ? t('home.removeFromCompare') : t('home.addToCompare')}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
