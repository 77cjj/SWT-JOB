import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Box,
  Divider,
  Alert,
  Slider,
  Autocomplete,
} from '@mui/material';
import { Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import type { JobRecord, SecondJobDifficulty } from '../types/job';
import taxTable from '../data/tax.json';
import { computeIncome, type IncomeSummary } from '../utils/jobMetrics';
import { getStateMaxMarginalRate } from '../utils/stateTax';
import { useI18n } from '../context/I18nContext';

const JOB_TITLE_OPTIONS = [
  'Host',
  'Server',
  'Housekeeping',
  'Food & Beverage',
  'Barista',
  'Retail',
];

const STATE_OPTIONS = (taxTable as { personal_income_tax_rates: Array<{ state: string }> })
  .personal_income_tax_rates
  .map((x) => x.state)
  .sort();

interface Props {
  onSubmit: (job: JobRecord) => void;
  initialData?: JobRecord;
  onCancel?: () => void;
  onPreviewChange?: (payload: {
    income: IncomeSummary | null;
    projectWeeks: number;
  }) => void;
}

export default function JobForm({ onSubmit, initialData, onCancel, onPreviewChange }: Props) {
  const { t, tWithParams } = useI18n();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Partial<JobRecord>>(
    initialData ?? {
      jobTitle: '',
      company: '',
      state: 'CA',
      hourlyWage: 15,
      overtimeRate: 1.5,
      tipped: false,
      avgHoursPerWeek: 40,
      workHoursRange: [35, 45],
      overtimeAvailable: false,
      hasHousing: false,
      housingCostPerWeek: 120,
      housingDistanceKm: 2,
      secondJobPossible: '中',
      secondJobHours: 15,
      secondJobIndustry: '',
      workStability: 3,
      costOfLivingIndex: 100,
      safetyLevel: 3,
      employerRating: 3,
      lastYearIncidents: false,
      description: '',
      projectStartDate: '2026-06-01',
      projectEndDate: '2026-09-15',
    },
  );

  const estimatedIncome = useMemo(() => {
    const hourlyWage = formData.hourlyWage ?? 0;
    const primaryHours = formData.avgHoursPerWeek ?? 0;
    if (hourlyWage <= 0 || primaryHours <= 0) {
      return null;
    }

    const state = formData.state ?? 'CA';

    const mockJob: JobRecord = {
      jobId: 'PREVIEW',
      jobTitle: (formData.jobTitle?.trim() ? formData.jobTitle.trim() : '未命名岗位'),
      company: (formData.company?.trim() ? formData.company.trim() : '未知公司'),
      state,
      hourlyWage,
      overtimeRate: formData.overtimeRate ?? 1.5,
      tipped: formData.tipped ?? false,
      averageTip: formData.averageTip,
      avgHoursPerWeek: primaryHours,
      workHoursRange: (formData.workHoursRange ?? [35, 45]) as [number, number],
      overtimeAvailable: formData.overtimeAvailable ?? false,
      hasHousing: formData.hasHousing ?? false,
      housingCostPerWeek: formData.hasHousing ? formData.housingCostPerWeek ?? 0 : 0,
      housingDistanceKm: formData.housingDistanceKm ?? 0,
      secondJobPossible: (formData.secondJobPossible ?? '中') as SecondJobDifficulty,
      secondJobHours: formData.secondJobHours ?? 0,
      secondJobIndustry: formData.secondJobIndustry ?? '',
      workStability: (formData.workStability ?? 3) as 1 | 2 | 3 | 4 | 5,
      costOfLivingIndex: formData.costOfLivingIndex ?? 100,
      safetyLevel: (formData.safetyLevel ?? 3) as 1 | 2 | 3 | 4 | 5,
      employerRating: (formData.employerRating ?? 3) as 1 | 2 | 3 | 4 | 5,
      lastYearIncidents: formData.lastYearIncidents ?? false,
      description: formData.description ?? '',
      projectStartDate: formData.projectStartDate ?? '2026-06-01',
      projectEndDate: formData.projectEndDate ?? '2026-09-15',
    };

    return computeIncome(mockJob, {
      primaryHours,
      secondHours: formData.secondJobHours ?? 0,
      housingCost: formData.hasHousing ? formData.housingCostPerWeek ?? 0 : 0,
    });
  }, [formData]);

  const projectStartDate = useMemo(() => {
    const d = dayjs(formData.projectStartDate ?? '2026-06-01');
    return d.isValid() ? d : dayjs('2026-06-01');
  }, [formData.projectStartDate]);
  const projectEndDate = useMemo(() => {
    const d = dayjs(formData.projectEndDate ?? '2026-09-15');
    return d.isValid() ? d : dayjs('2026-09-15');
  }, [formData.projectEndDate]);

  const projectDurationWeeks = useMemo(() => {
    const diff = projectEndDate.diff(projectStartDate, 'day');
    if (diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / 7));
  }, [projectStartDate, projectEndDate]);

  const totalProjectIncome = useMemo(() => {
    if (!estimatedIncome || projectDurationWeeks === 0) return null;
    return estimatedIncome.netIncomeWithSecondJob * projectDurationWeeks;
  }, [estimatedIncome, projectDurationWeeks]);

  useEffect(() => {
    if (!onPreviewChange) return;
    onPreviewChange({
      income: estimatedIncome,
      projectWeeks: projectDurationWeeks,
    });
  }, [estimatedIncome, onPreviewChange, projectDurationWeeks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 岗位名/公司名允许为空：保存时兜底为默认占位文案
    if (!formData.state) {
      setError(t('errors.selectState'));
      return;
    }

    const jobId = initialData?.jobId ?? `CUSTOM-${Date.now()}`;
    const job: JobRecord = {
      jobId,
      jobTitle: (formData.jobTitle?.trim() ? formData.jobTitle.trim() : '未命名岗位'),
      company: (formData.company?.trim() ? formData.company.trim() : '未知公司'),
      state: formData.state!,
      hourlyWage: formData.hourlyWage ?? 15,
      overtimeRate: formData.overtimeRate ?? 1.5,
      tipped: formData.tipped ?? false,
      averageTip: formData.tipped && formData.averageTip ? formData.averageTip : undefined,
      avgHoursPerWeek: formData.avgHoursPerWeek ?? 40,
      workHoursRange: formData.workHoursRange ?? [35, 45],
      overtimeAvailable: formData.overtimeAvailable ?? false,
      hasHousing: formData.hasHousing ?? false,
      housingCostPerWeek: formData.housingCostPerWeek ?? 120,
      housingDistanceKm: formData.housingDistanceKm ?? 2,
      secondJobPossible: (formData.secondJobPossible ?? '中') as SecondJobDifficulty,
      secondJobHours: formData.secondJobHours ?? 15,
      secondJobIndustry: formData.secondJobIndustry ?? '',
      workStability: (formData.workStability ?? 3) as 1 | 2 | 3 | 4 | 5,
      costOfLivingIndex: formData.costOfLivingIndex ?? 100,
      safetyLevel: (formData.safetyLevel ?? 3) as 1 | 2 | 3 | 4 | 5,
      employerRating: (formData.employerRating ?? 3) as 1 | 2 | 3 | 4 | 5,
      lastYearIncidents: formData.lastYearIncidents ?? false,
      description: formData.description ?? '',
      projectStartDate: projectStartDate.format('YYYY-MM-DD'),
      projectEndDate: projectEndDate.format('YYYY-MM-DD'),
    };

    onSubmit(job);
    if (!initialData) {
      setFormData({
        jobTitle: '',
        company: '',
        state: 'CA',
        hourlyWage: 15,
        overtimeRate: 1.5,
        tipped: false,
        avgHoursPerWeek: 40,
        workHoursRange: [35, 45],
        overtimeAvailable: false,
        hasHousing: false,
        housingCostPerWeek: 120,
        housingDistanceKm: 2,
        secondJobPossible: '中',
        secondJobHours: 15,
        secondJobIndustry: '',
        workStability: 3,
        costOfLivingIndex: 100,
        safetyLevel: 3,
        employerRating: 3,
        lastYearIncidents: false,
        description: '',
        projectStartDate: '2026-06-01',
        projectEndDate: '2026-09-15',
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.background.paper,
        }}
      >
      <CardHeader
        title={initialData ? t('jobForm.editTitle') : t('jobForm.createTitle')}
        subheader={initialData ? t('jobForm.editSubtitle') : t('jobForm.createSubtitle')}
        titleTypographyProps={{ variant: 'h5', fontWeight: 600 }}
      />
      <Divider />
      <form onSubmit={handleSubmit}>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mb: 2,
            }}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={JOB_TITLE_OPTIONS}
                value={formData.jobTitle ?? ''}
                onChange={(_, newValue: string | null) =>
                  setFormData({ ...formData, jobTitle: newValue ?? '' })
                }
                onInputChange={(_, newInputValue: string) =>
                  setFormData({ ...formData, jobTitle: newInputValue })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('jobForm.jobTitle')}
                    placeholder={t('jobForm.jobTitle')}
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <TextField
                fullWidth
                label={t('jobForm.company')}
                value={formData.company ?? ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder={t('jobForm.company')}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <TextField
                fullWidth
                required
                select
                label={t('jobForm.state')}
                value={formData.state ?? 'CA'}
                onChange={(e) => {
                  const state = e.target.value;
                  setFormData({
                    ...formData,
                    state,
                  });
                }}
              >
                {STATE_OPTIONS.map((s) => {
                  const maxRate = getStateMaxMarginalRate(s);
                  const suffix = maxRate > 0 
                    ? tWithParams('jobForm.stateTaxSuffix', { rate: (maxRate * 100).toFixed(2) })
                    : t('jobForm.noStateTax');
                  return (
                  <MenuItem key={s} value={s}>
                    {s} {suffix}
                  </MenuItem>
                  );
                })}
              </TextField>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              mt: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
              }}
            >
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('jobForm.hourlyWage')}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {t('jobForm.current')} {(formData.hourlyWage ?? 15).toFixed(2)} $/h
                  </Typography>
                </Typography>
                <Slider
                  size="small"
                  value={formData.hourlyWage ?? 15}
                  min={5}
                  max={35}
                  step={0.25}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setFormData({ ...formData, hourlyWage: next });
                  }}
                />
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('jobForm.avgHoursPerWeek')}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {t('jobForm.current')} {formData.avgHoursPerWeek ?? 40} h/{t('jobForm.perWeek')}
                  </Typography>
                </Typography>
                <Slider
                  size="small"
                  value={formData.avgHoursPerWeek ?? 40}
                  min={20}
                  max={60}
                  step={1}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setFormData({ ...formData, avgHoursPerWeek: next });
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('jobForm.secondJobHours')} (h/{t('jobForm.perWeek')})
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {t('jobForm.current')} {formData.secondJobHours ?? 15} h/{t('jobForm.perWeek')}
                  </Typography>
                </Typography>
                <Slider
                  size="small"
                  value={formData.secondJobHours ?? 15}
                  min={0}
                  max={30}
                  step={1}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setFormData({ ...formData, secondJobHours: next });
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.tipped ?? false}
                    onChange={(e) => setFormData({ ...formData, tipped: e.target.checked })}
                  />
                }
                label={t('jobForm.tipped')}
              />
              {formData.tipped && (
                <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 200px' }, minWidth: 200 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('jobForm.averageTip')}
                    value={formData.averageTip?.[0] ?? 10}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData({
                        ...formData,
                        averageTip: [value, value],
                      });
                    }}
                    inputProps={{ step: 0.5, min: 0 }}
                    size="small"
                  />
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasHousing ?? false}
                    onChange={(e) => setFormData({ ...formData, hasHousing: e.target.checked })}
                  />
                }
                label={t('jobForm.hasHousing')}
              />
              {formData.hasHousing && (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      gap: 2,
                      width: '100%',
                      overflowX: { xs: 'auto', md: 'visible' },
                      pb: { xs: 0.5, md: 0 },
                    }}
                  >
                    <Box sx={{ flex: '0 0 190px', minWidth: 170 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, whiteSpace: 'nowrap' }}>
                        {t('jobForm.housingCostPerWeek')}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {t('jobForm.current')} ${formData.housingCostPerWeek ?? 120}/{t('jobForm.perWeek')}
                        </Typography>
                      </Typography>
                      <Slider
                        size="small"
                        value={formData.housingCostPerWeek ?? 120}
                        min={0}
                        max={250}
                        step={5}
                        valueLabelDisplay="auto"
                        onChange={(_, value) => {
                          const next = Array.isArray(value) ? value[0] : value;
                          setFormData({ ...formData, housingCostPerWeek: next });
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: '0 0 190px', minWidth: 170 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, whiteSpace: 'nowrap' }}>
                        {t('jobForm.housingDistanceKm')}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {t('jobForm.current')} {formData.housingDistanceKm ?? 2} km
                        </Typography>
                      </Typography>
                      <Slider
                        size="small"
                        value={formData.housingDistanceKm ?? 2}
                        min={0}
                        max={15}
                        step={0.5}
                        valueLabelDisplay="auto"
                        onChange={(_, value) => {
                          const next = Array.isArray(value) ? value[0] : value;
                          setFormData({ ...formData, housingDistanceKm: next });
                        }}
                      />
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
              }}
            >
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 220px' }, minWidth: 0 }}>
                <DatePicker
                  label={t('jobForm.projectStartDate')}
                  value={projectStartDate}
                  format="YYYY-MM-DD"
                  maxDate={projectEndDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, projectStartDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 220px' }, minWidth: 0 }}>
                <DatePicker
                  label={t('jobForm.projectEndDate')}
                  value={projectEndDate}
                  format="YYYY-MM-DD"
                  minDate={projectStartDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, projectEndDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Box>
            </Box>

            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('jobForm.description')}
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('jobForm.descriptionPlaceholder')}
              />
            </Box>
          </Box>
        </CardContent>
        <Divider />
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: estimatedIncome && totalProjectIncome ? 'space-between' : 'flex-end',
          }}
        >
          {estimatedIncome && totalProjectIncome && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary">
                项目总收入预估（{projectStartDate.format('YYYY-MM-DD')} ~ {projectEndDate.format('YYYY-MM-DD')}，约 {projectDurationWeeks} 周）
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                总收入约 ${totalProjectIncome.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                按每周净收入 ${estimatedIncome.netIncomeWithSecondJob.toFixed(0)}（一工 {estimatedIncome.netIncomePrimary.toFixed(0)}）
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {onCancel && (
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
              >
                {t('common.cancel')}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{ minWidth: 140 }}
            >
              {initialData ? t('jobForm.updateJob') : t('jobForm.saveJob')}
            </Button>
          </Box>
        </Box>
      </form>
    </Card>
    </LocalizationProvider>
  );
}
