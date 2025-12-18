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
} from '../utils/jobMetrics';

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
  const income = computeIncome(job);

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
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 3,
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          transition: 'left 0.6s ease',
        },
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
          '&::before': {
            opacity: 1,
          },
          '&::after': {
            left: '100%',
          },
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {job.jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {job.company} · {job.city}
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
            label={`$${Math.round(income.netIncomeWithSecondJob)}/w`}
            size="small"
            color={getIncomeColor(Math.round(income.netIncomeWithSecondJob))}
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
              基础时薪
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${job.hourlyWage.toFixed(2)}
            </Typography>
            {job.tipped && job.averageTip ? (
              <Typography variant="caption" color="text.secondary">
                小费 ${job.averageTip[0]}~{job.averageTip[1]}/h
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                无小费
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', minWidth: 0 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              住宿
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {job.hasHousing ? `$${job.housingCostPerWeek}/w` : '需自找'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              距离 {job.housingDistanceKm} km
            </Typography>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)', minWidth: 0 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              净收入（含二工）
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
              ${Math.round(income.netIncomeWithSecondJob)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ¥{Math.round(income.incomeRmb)}
            </Typography>
          </Box>
        </Box>

        {job.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {job.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, position: 'relative', zIndex: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={() => onSelect(job)}
          sx={{ minWidth: 'auto', px: 1.5 }}
        >
          查看详情
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="编辑">
            <IconButton size="small" onClick={() => onEdit(job)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="删除">
            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm(`确定要删除 "${job.jobTitle}" 吗？`)) {
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
            {isCompared ? '移出对比' : '加入对比'}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
