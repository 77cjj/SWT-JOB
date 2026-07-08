import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
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
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

            <TextField
              fullWidth
              required
              select
              size="small"
              label={t('jobForm.state')}
              value={formData.state ?? 'NJ'}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              {STATE_OPTIONS.map((s) => {
                const maxRate = getStateMaxMarginalRate(s);
                const suffix =
                  maxRate > 0
                    ? tWithParams('jobForm.stateTaxSuffix', { rate: (maxRate * 100).toFixed(2) })
                    : t('jobForm.noStateTax');
                return (
                  <MenuItem key={s} value={s}>
                    {s} {suffix}
                  </MenuItem>
                );
              })}
            </TextField>

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

            <Accordion disableGutters sx={accordionSx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                  {t('jobForm.moreHousing')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: 0, pb: 1 }}>
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
                    <Typography variant="caption" color="text.secondary">
                      ${formData.housingCostPerWeek ?? 120}/{t('jobForm.perWeek')}
                    </Typography>
                    <Slider
                      size="small"
                      sx={sliderSx}
                      value={formData.housingCostPerWeek ?? 120}
                      min={0}
                      max={250}
                      step={5}
                      onChange={(_, value) => {
                        const next = Array.isArray(value) ? value[0] : value;
                        setFormData({ ...formData, housingCostPerWeek: next });
                      }}
                    />
                  </Box>
                ) : null}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.25 }}>
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
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
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
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion disableGutters sx={accordionSx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                  {t('jobForm.moreOptional')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, pt: 0, pb: 1 }}>
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
                  renderInput={(params) => <TextField {...params} label={t('jobForm.jobTitle')} />}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t('jobForm.company')}
                  value={formData.company ?? ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
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
