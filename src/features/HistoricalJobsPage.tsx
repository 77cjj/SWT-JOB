import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Rating,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import { Search as SearchIcon, LocationOn, Business, AttachMoney } from '@mui/icons-material';
import { historicalJobsData } from '../data/historicalJobs';
import { useI18n } from '../context/I18nContext';

export default function HistoricalJobsPage() {
  const { t, tWithParams } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const states = useMemo(() => {
    const stateSet = new Set(historicalJobsData.map((job) => job.state));
    return Array.from(stateSet).sort();
  }, []);

  const filteredJobs = useMemo(() => {
    return historicalJobsData.filter((job) => {
      const matchesSearch =
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.state.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = stateFilter === 'all' || job.state === stateFilter;

      return matchesSearch && matchesState;
    });
  }, [searchTerm, stateFilter]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatRating = (rating: number) => `${rating}/5`;

  const renderTable = () => (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('historicalJobs.jobTitle')}</TableCell>
            <TableCell>{t('historicalJobs.company')}</TableCell>
            <TableCell>{t('historicalJobs.location')}</TableCell>
            <TableCell>{t('historicalJobs.state')}</TableCell>
            <TableCell>{t('historicalJobs.hourlyWage')}</TableCell>
            <TableCell>{t('historicalJobs.secondJob')}</TableCell>
            <TableCell>{t('historicalJobs.weeklyRent')}</TableCell>
            <TableCell>{t('historicalJobs.housingCondition')}</TableCell>
            <TableCell>{t('historicalJobs.culture')}</TableCell>
            <TableCell>{t('historicalJobs.employerAttitude')}</TableCell>
            <TableCell>{t('historicalJobs.employeeBenefits')}</TableCell>
            <TableCell>{t('historicalJobs.rating')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredJobs.map((job) => (
            <TableRow key={job.jobId} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {job.jobTitle}
                </Typography>
              </TableCell>
              <TableCell>{job.company}</TableCell>
              <TableCell>{job.city || '—'}</TableCell>
              <TableCell>
                <Chip label={job.state} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600} color="primary">
                  {formatCurrency(job.hourlyWage)}
                </Typography>
                {job.tipped && job.averageTip && (
                  <Typography variant="caption" color="text.secondary">
                    + 小费 ${job.averageTip[0]}-${job.averageTip[1]}/h
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={job.secondJobPossible}
                  size="small"
                  color={
                    job.secondJobPossible === '高'
                      ? 'success'
                      : job.secondJobPossible === '中'
                        ? 'warning'
                        : 'default'
                  }
                />
              </TableCell>
              <TableCell>
                {job.hasHousing ? (
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(job.housingCostPerWeek)}/周
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t('historicalJobs.needsOwnHousing')}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{job.housingCondition ? <Chip label={job.housingCondition} size="small" /> : '—'}</TableCell>
              <TableCell>
                {job.culture ? <Chip label={job.culture} size="small" variant="outlined" /> : '—'}
              </TableCell>
              <TableCell>{job.employerAttitude ? <Typography variant="body2">{job.employerAttitude}</Typography> : '—'}</TableCell>
              <TableCell>
                {job.employeeBenefits ? (
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {job.employeeBenefits}
                  </Typography>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={job.employerRating} readOnly size="small" />
                  <Typography variant="caption">{formatRating(job.employerRating)}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCards = () => (
    <Box
      sx={{
        mt: 2,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 3,
      }}
    >
      {filteredJobs.map((job) => (
        <Box key={job.jobId}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {job.jobTitle}
                </Typography>
                <Chip label={job.state} size="small" />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {job.company}
                </Typography>
              </Box>

              {job.city && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {job.city}, {job.state}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoney fontSize="small" color="primary" />
                <Typography variant="h6" color="primary">
                  {formatCurrency(job.hourlyWage)}/h
                </Typography>
                {job.tipped && job.averageTip && (
                  <Typography variant="caption" color="text.secondary">
                    + 小费 ${job.averageTip[0]}-${job.averageTip[1]}/h
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  label={`二工: ${job.secondJobPossible}`}
                  size="small"
                  color={
                    job.secondJobPossible === '高'
                      ? 'success'
                      : job.secondJobPossible === '中'
                        ? 'warning'
                        : 'default'
                  }
                />
                {job.hasHousing && (
                  <Chip
                    label={`住宿: ${formatCurrency(job.housingCostPerWeek)}/周`}
                    size="small"
                    color="success"
                  />
                )}
                {job.housingCondition && <Chip label={`住宿: ${job.housingCondition}`} size="small" />}
              </Box>

              {job.culture && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>文化:</strong> {job.culture}
                </Typography>
              )}

              {job.employerAttitude && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>雇主态度:</strong> {job.employerAttitude}
                </Typography>
              )}

              {job.employeeBenefits && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>员工福利:</strong> {job.employeeBenefits}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={job.employerRating} readOnly size="small" />
                <Typography variant="caption">{formatRating(job.employerRating)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('historicalJobs.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('historicalJobs.subtitle')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder={t('historicalJobs.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('historicalJobs.filterByState')}</InputLabel>
          <Select
            value={stateFilter}
            label={t('historicalJobs.filterByState')}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <MenuItem value="all">{t('common.all')}</MenuItem>
            {states.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>{t('historicalJobs.viewMode')}</InputLabel>
          <Select
            value={viewMode}
            label={t('historicalJobs.viewMode')}
            onChange={(e) => setViewMode(e.target.value as 'table' | 'card')}
          >
            <MenuItem value="table">{t('historicalJobs.tableView')}</MenuItem>
            <MenuItem value="card">{t('historicalJobs.cardView')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tWithParams('historicalJobs.foundJobs', { count: filteredJobs.length })}
      </Typography>

      {viewMode === 'table' ? renderTable() : renderCards()}
    </Box>
  );
}
