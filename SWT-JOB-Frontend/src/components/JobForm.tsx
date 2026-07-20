import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Alert,
  Slider,
  Autocomplete,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DateField } from '@mui/x-date-pickers/DateField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
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

const DEFAULT_FORM: Partial<JobRecord> = {
  jobTitle: '',
  company: '',
  state: 'NJ',
  hourlyWage: 12,
  overtimeRate: 1.5,
  tipped: true,
  averageTip: [12, 12],
  avgHoursPerWeek: 40,
  workHoursRange: [35, 45],
  overtimeAvailable: false,
  hasHousing: false,
  housingCostPerWeek: 120,
  housingDistanceKm: 2,
  secondJobPossible: '中',
  secondJobHours: 12,
  secondJobIndustry: '',
  secondJobHourlyWage: 13,
  workStability: 3,
  costOfLivingIndex: 100,
  safetyLevel: 3,
  employerRating: 3,
  lastYearIncidents: false,
  description: '',
  projectStartDate: '2026-06-01',
  projectEndDate: '2026-09-15',
};

const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 1.25,
  alignItems: 'start',
} as const;

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
  const [formData, setFormData] = useState<Partial<JobRecord>>(initialData ?? DEFAULT_FORM);

  const formatStateOption = (stateCode: string) => {
    const maxRate = getStateMaxMarginalRate(stateCode);
    const suffix =
      maxRate > 0
        ? tWithParams('jobForm.stateTaxSuffix', { rate: (maxRate * 100).toFixed(2) })
        : t('jobForm.noStateTax');
    return `${stateCode} ${suffix}`;
  };

  const filterStateOptions = (options: string[], inputValue: string) => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return options;
    return options.filter((code) => {
      const label = formatStateOption(code).toLowerCase();
      return code.toLowerCase().includes(query) || label.includes(query);
    });
  };

  const estimatedIncome = useMemo(() => {
    const hourlyWage = formData.hourlyWage ?? 0;
    const primaryHours = formData.avgHoursPerWeek ?? 0;
    if (hourlyWage <= 0 || primaryHours <= 0) return null;

    const mockJob: JobRecord = {
      jobId: 'PREVIEW',
      jobTitle: formData.jobTitle?.trim() || '未命名岗位',
      company: formData.company?.trim() || '未知公司',
      state: formData.state ?? 'NJ',
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
      secondJobHourlyWage: formData.secondJobHourlyWage ?? undefined,
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
    if (!formData.state) {
      setError(t('errors.selectState'));
      return;
    }

    const job: JobRecord = {
      jobId: initialData?.jobId ?? `CUSTOM-${Date.now()}`,
      jobTitle: formData.jobTitle?.trim() || '未命名岗位',
      company: formData.company?.trim() || '未知公司',
      state: formData.state!,
      hourlyWage: formData.hourlyWage ?? 12,
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
      secondJobHours: formData.secondJobHours ?? 12,
      secondJobIndustry: formData.secondJobIndustry ?? '',
      secondJobHourlyWage: formData.secondJobHourlyWage,
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
    if (!initialData) setFormData(DEFAULT_FORM);
  };

  const setProjectStartDate = (newValue: Dayjs | null) => {
    if (!newValue?.isValid()) return;
    setFormData({ ...formData, projectStartDate: newValue.format('YYYY-MM-DD') });
  };

  const setProjectEndDate = (newValue: Dayjs | null) => {
    if (!newValue?.isValid()) return;
    setFormData({ ...formData, projectEndDate: newValue.format('YYYY-MM-DD') });
  };

  const accordionSx = {
    bgcolor: 'transparent',
    '&:before': { display: 'none' },
    boxShadow: 'none',
    borderTop: '1px solid',
    borderColor: 'divider',
    '& .MuiAccordionSummary-root': { minHeight: 36, py: 0 },
    '& .MuiAccordionSummary-content': { my: 0.5 },
  } as const;

  const sliderSx = {
    py: 0.25,
    '& .MuiSlider-thumb': { width: 14, height: 14 },
    '& .MuiSlider-rail': { height: 3 },
    '& .MuiSlider-track': { height: 3 },
  } as const;

  const dateFieldSlotProps = {
    textField: {
      fullWidth: true,
      size: 'small' as const,
      placeholder: 'YYYY-MM-DD',
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
        <form onSubmit={handleSubmit}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, py: 1.5, px: 1.75, '&:last-child': { pb: 1.5 } }}>
            {error ? (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            ) : null}

            <Box sx={twoColumnGrid}>
              <Autocomplete
                fullWidth
                freeSolo
                size="small"
                options={JOB_TITLE_OPTIONS}
                value={formData.jobTitle ?? ''}
                onChange={(_, newValue: string | null) =>
                  setFormData({ ...formData, jobTitle: newValue ?? '' })
                }
                onInputChange={(_, newInputValue: string) =>
                  setFormData({ ...formData, jobTitle: newInputValue })
                }
                renderInput={(params) => (
                  <TextField {...params} label={t('jobForm.jobTitle')} placeholder={t('jobForm.jobTitle')} />
                )}
              />
              <TextField
                fullWidth
                size="small"
                label={t('jobForm.company')}
                value={formData.company ?? ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Box>

            <Autocomplete
              fullWidth
              disableClearable
              size="small"
              options={STATE_OPTIONS}
              value={formData.state ?? 'NJ'}
              onChange={(_, newValue: string | null) => {
                if (newValue) setFormData({ ...formData, state: newValue });
              }}
              filterOptions={(options, state) => filterStateOptions(options, state.inputValue)}
              getOptionLabel={(code) => formatStateOption(code)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label={t('jobForm.state')}
                  placeholder={t('jobForm.state')}
                />
              )}
            />

            <Box sx={twoColumnGrid}>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25, fontSize: '0.8125rem' }}>
                  {t('jobForm.hourlyWage')}
                  <Typography component="span" color="text.secondary" sx={{ ml: 0.75, fontWeight: 600 }}>
                    {(formData.hourlyWage ?? 12).toFixed(2)} $/h
                  </Typography>
                </Typography>
                <Slider
                  size="small"
                  sx={sliderSx}
                  value={formData.hourlyWage ?? 12}
                  min={7.25}
                  max={40}
                  step={0.25}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    setFormData({ ...formData, hourlyWage: next });
                  }}
                />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25, fontSize: '0.8125rem' }}>
                  {t('jobForm.avgHoursPerWeek')}
                  <Typography component="span" color="text.secondary" sx={{ ml: 0.75, fontWeight: 600 }}>
                    {formData.avgHoursPerWeek ?? 40} h
                  </Typography>
                </Typography>
                <Slider
                  size="small"
                  sx={sliderSx}
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
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: formData.tipped ? 'auto 1fr' : '1fr' },
                gap: 1.25,
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
                control={
                  <Checkbox
                    size="small"
                    checked={formData.tipped ?? false}
                    onChange={(e) => setFormData({ ...formData, tipped: e.target.checked })}
                  />
                }
                label={t('jobForm.tipped')}
              />
              {formData.tipped ? (
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25, fontSize: '0.8125rem' }}>
                    {t('jobForm.averageTip')}
                    <Typography component="span" color="text.secondary" sx={{ ml: 0.75, fontWeight: 600 }}>
                      {(formData.averageTip?.[0] ?? 12).toFixed(1)} $/h
                    </Typography>
                  </Typography>
                  <Slider
                    size="small"
                    sx={sliderSx}
                    value={formData.averageTip?.[0] ?? 12}
                    min={0}
                    max={30}
                    step={0.5}
                    valueLabelDisplay="auto"
                    onChange={(_, value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      setFormData({ ...formData, averageTip: [next, next] });
                    }}
                  />
                </Box>
              ) : null}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: formData.hasHousing ? 'auto 1fr' : '1fr' },
                gap: 1.25,
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.8125rem' } }}
                control={
                  <Checkbox
                    size="small"
                    checked={formData.hasHousing ?? false}
                    onChange={(e) => setFormData({ ...formData, hasHousing: e.target.checked })}
                  />
                }
                label={t('jobForm.hasHousing')}
              />
              {formData.hasHousing ? (
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25, fontSize: '0.8125rem' }}>
                    {t('jobForm.housingCostPerWeek')}
                    <Typography component="span" color="text.secondary" sx={{ ml: 0.75, fontWeight: 600 }}>
                      ${formData.housingCostPerWeek ?? 120}/{t('jobForm.perWeek')}
                    </Typography>
                  </Typography>
                  <Slider
                    size="small"
                    sx={sliderSx}
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
              ) : null}
            </Box>

            <Box sx={twoColumnGrid}>
              <DateField
                label={t('jobForm.projectStartDate')}
                value={projectStartDate}
                format="YYYY-MM-DD"
                maxDate={projectEndDate}
                onChange={setProjectStartDate}
                slotProps={dateFieldSlotProps}
              />
              <DateField
                label={t('jobForm.projectEndDate')}
                value={projectEndDate}
                format="YYYY-MM-DD"
                minDate={projectStartDate}
                onChange={setProjectEndDate}
                slotProps={dateFieldSlotProps}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
              {t('jobForm.projectDates')} · {projectDurationWeeks} {t('jobForm.perWeek')}
            </Typography>

            <Accordion disableGutters sx={accordionSx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                  {t('jobForm.moreSecondJob')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: 0, pb: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('jobForm.secondJobHours')} — {formData.secondJobHours ?? 12} h
                  </Typography>
                  <Slider
                    size="small"
                    sx={sliderSx}
                    value={formData.secondJobHours ?? 12}
                    min={0}
                    max={30}
                    onChange={(_, value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      setFormData({ ...formData, secondJobHours: next });
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('jobForm.secondJobHourlyWage')} — {(formData.secondJobHourlyWage ?? 13).toFixed(2)} $/h
                  </Typography>
                  <Slider
                    size="small"
                    sx={sliderSx}
                    value={formData.secondJobHourlyWage ?? 13}
                    min={5}
                    max={30}
                    step={0.5}
                    onChange={(_, value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      setFormData({ ...formData, secondJobHourlyWage: next });
                    }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </CardContent>
          <Divider />
          <Box sx={{ px: 1.75, py: 1.25, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onCancel ? (
              <Button size="small" variant="outlined" startIcon={<CancelIcon fontSize="small" />} onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            ) : null}
            <Button type="submit" size="small" variant="contained" startIcon={<SaveIcon fontSize="small" />}>
              {initialData ? t('jobForm.updateJob') : t('jobForm.saveJob')}
            </Button>
          </Box>
        </form>
      </Card>
    </LocalizationProvider>
  );
}
