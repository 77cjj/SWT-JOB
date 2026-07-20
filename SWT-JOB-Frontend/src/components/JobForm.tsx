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

/** 固定滑块行高度，勾选后不再撑开页面 */
const METRIC_ROW_H = 68;
const TOGGLE_ROW_H = 72;

const fieldLabelSx = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'text.primary',
} as const;

const fieldValueSx = {
  fontSize: '0.8125rem',
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'text.secondary',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
} as const;

const sectionLabelSx = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  color: 'text.secondary',
  lineHeight: 1.2,
};

const sliderSx = {
  mt: 0.25,
  mb: 0,
  py: 0.75,
  '& .MuiSlider-thumb': { width: 14, height: 14 },
  '& .MuiSlider-rail': { height: 3 },
  '& .MuiSlider-track': { height: 3 },
} as const;

function MetricSlider({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <Box
      sx={{
        height: METRIC_ROW_H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity: disabled ? 0.38 : 1,
        transition: 'opacity 0.15s ease',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          minHeight: 20,
        }}
      >
        <Typography component="span" sx={fieldLabelSx}>
          {label}
        </Typography>
        <Typography component="span" sx={fieldValueSx}>
          {valueLabel}
        </Typography>
      </Box>
      <Slider
        size="small"
        disabled={disabled}
        sx={sliderSx}
        value={value}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        onChange={(_, v) => {
          const next = Array.isArray(v) ? v[0] : v;
          onChange(next);
        }}
      />
    </Box>
  );
}

/**
 * 勾选 + 滑块同一行：滑块始终占位，勾选只改变可用态，避免整页跳动。
 */
function ToggleMetricRow({
  checked,
  onCheckedChange,
  checkLabel,
  sliderLabel,
  valueLabel,
  sliderValue,
  min,
  max,
  step,
  onSliderChange,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  checkLabel: string;
  sliderLabel: string;
  valueLabel: string;
  sliderValue: number;
  min: number;
  max: number;
  step: number;
  onSliderChange: (next: number) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'minmax(7.5rem, 9.25rem) minmax(0, 1fr)',
        },
        columnGap: 1.5,
        rowGap: 0.25,
        alignItems: 'center',
        minHeight: { xs: TOGGLE_ROW_H + 36, sm: TOGGLE_ROW_H },
      }}
    >
      <FormControlLabel
        sx={{
          m: 0,
          mr: 0,
          height: 40,
          alignItems: 'center',
          '& .MuiCheckbox-root': {
            p: 0.75,
            mr: 0.25,
          },
          '& .MuiFormControlLabel-label': {
            ...fieldLabelSx,
            fontSize: '0.8125rem',
          },
        }}
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
          />
        }
        label={checkLabel}
      />
      <MetricSlider
        label={sliderLabel}
        valueLabel={valueLabel}
        value={sliderValue}
        min={min}
        max={max}
        step={step}
        disabled={!checked}
        onChange={onSliderChange}
      />
    </Box>
  );
}

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

  const twoCol = {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: { xs: 1.25, sm: 1.5 },
    alignItems: 'center',
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
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              py: 2,
              px: { xs: 1.5, sm: 2 },
              '&:last-child': { pb: 2 },
            }}
          >
            {error ? (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            ) : null}

            <Box sx={twoCol}>
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
                  <TextField {...params} label={t('jobForm.jobTitle')} />
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
                <TextField {...params} required label={t('jobForm.state')} />
              )}
            />

            <Box>
              <Typography sx={{ ...sectionLabelSx, mb: 1 }}>{t('jobForm.salary')}</Typography>
              <Box sx={twoCol}>
                <MetricSlider
                  label={t('jobForm.hourlyWage')}
                  valueLabel={`${(formData.hourlyWage ?? 12).toFixed(2)} $/h`}
                  value={formData.hourlyWage ?? 12}
                  min={7.25}
                  max={40}
                  step={0.25}
                  onChange={(next) => setFormData({ ...formData, hourlyWage: next })}
                />
                <MetricSlider
                  label={t('jobForm.avgHoursPerWeek')}
                  valueLabel={`${formData.avgHoursPerWeek ?? 40} h`}
                  value={formData.avgHoursPerWeek ?? 40}
                  min={20}
                  max={60}
                  step={1}
                  onChange={(next) => setFormData({ ...formData, avgHoursPerWeek: next })}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <ToggleMetricRow
                checked={formData.tipped ?? false}
                onCheckedChange={(tipped) => setFormData({ ...formData, tipped })}
                checkLabel={t('jobForm.tipped')}
                sliderLabel={t('jobForm.averageTip')}
                valueLabel={`${(formData.averageTip?.[0] ?? 12).toFixed(1)} $/h`}
                sliderValue={formData.averageTip?.[0] ?? 12}
                min={0}
                max={30}
                step={0.5}
                onSliderChange={(next) => setFormData({ ...formData, averageTip: [next, next] })}
              />
              <ToggleMetricRow
                checked={formData.hasHousing ?? false}
                onCheckedChange={(hasHousing) => setFormData({ ...formData, hasHousing })}
                checkLabel={t('jobForm.hasHousing')}
                sliderLabel={t('jobForm.housingCostPerWeek')}
                valueLabel={`$${formData.housingCostPerWeek ?? 120}/${t('jobForm.perWeek')}`}
                sliderValue={formData.housingCostPerWeek ?? 120}
                min={0}
                max={250}
                step={5}
                onSliderChange={(next) => setFormData({ ...formData, housingCostPerWeek: next })}
              />
            </Box>

            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  mb: 1,
                  minHeight: 20,
                }}
              >
                <Typography sx={sectionLabelSx}>{t('jobForm.projectDates')}</Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: projectDurationWeeks > 0 ? 'text.secondary' : 'text.disabled',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1.2,
                  }}
                >
                  {projectDurationWeeks > 0 ? `${projectDurationWeeks} ${t('jobForm.perWeek')}` : '—'}
                </Typography>
              </Box>
              <Box sx={twoCol}>
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
            </Box>

            <Accordion
              disableGutters
              sx={{
                bgcolor: 'transparent',
                boxShadow: 'none',
                borderTop: '1px solid',
                borderColor: 'divider',
                '&:before': { display: 'none' },
                '& .MuiAccordionSummary-root': {
                  minHeight: 44,
                  px: 0,
                  alignItems: 'center',
                },
                '& .MuiAccordionSummary-content': {
                  my: 0,
                  alignItems: 'center',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  color: 'text.secondary',
                },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                <Typography sx={{ ...fieldLabelSx, fontSize: '0.8125rem' }}>
                  {t('jobForm.moreSecondJob')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.25, pb: 0.5, px: 0 }}
              >
                <MetricSlider
                  label={t('jobForm.secondJobHours')}
                  valueLabel={`${formData.secondJobHours ?? 12} h`}
                  value={formData.secondJobHours ?? 12}
                  min={0}
                  max={30}
                  step={1}
                  onChange={(next) => setFormData({ ...formData, secondJobHours: next })}
                />
                <MetricSlider
                  label={t('jobForm.secondJobHourlyWage')}
                  valueLabel={`${(formData.secondJobHourlyWage ?? 13).toFixed(2)} $/h`}
                  value={formData.secondJobHourlyWage ?? 13}
                  min={5}
                  max={30}
                  step={0.5}
                  onChange={(next) => setFormData({ ...formData, secondJobHourlyWage: next })}
                />
              </AccordionDetails>
            </Accordion>
          </CardContent>
          <Divider />
          <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
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
