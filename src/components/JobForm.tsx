import { useMemo, useState } from 'react';
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
import { stateTaxLookup } from '../data/jobs';
import type { CityOption } from '../data/usCities';
import { usCities } from '../data/usCities';
import { computeIncome } from '../utils/jobMetrics';

const JOB_TITLE_OPTIONS = [
  'Host',
  'Server',
  'Housekeeping',
  'Food & Beverage',
  'Barista',
  'Retail',
];

interface Props {
  onSubmit: (job: JobRecord) => void;
  initialData?: JobRecord;
  onCancel?: () => void;
}

export default function JobForm({ onSubmit, initialData, onCancel }: Props) {
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<Partial<JobRecord>>(
    initialData ?? {
      jobTitle: '',
      company: '',
      city: '',
      state: 'CA',
      hourlyWage: 15,
      overtimeRate: 1.5,
      tipped: false,
      avgHoursPerWeek: 40,
      workHoursRange: [35, 45],
      overtimeAvailable: false,
      startDate: '',
      endDate: '',
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
      highlights: [],
      stateTaxRate: stateTaxLookup.CA,
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
      jobTitle: formData.jobTitle ?? '预估岗位',
      company: formData.company ?? '预估公司',
      city: formData.city ?? '',
      state,
      stateTaxRate: formData.stateTaxRate ?? stateTaxLookup[state] ?? 0,
      jobType: formData.jobType ?? '',
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
      highlights: formData.highlights ?? [],
      projectStartDate: formData.projectStartDate ?? '2026-06-01',
      projectEndDate: formData.projectEndDate ?? '2026-09-15',
    };

    return computeIncome(mockJob, {
      primaryHours,
      secondHours: formData.secondJobHours ?? 0,
      housingCost: formData.hasHousing ? formData.housingCostPerWeek ?? 0 : 0,
    });
  }, [formData]);

  const matchedCityOption = useMemo<CityOption | null>(() => {
    if (!formData.city) return null;
    const cityLower = formData.city.toLowerCase();
    return usCities.find((option) => option.city.toLowerCase() === cityLower) ?? null;
  }, [formData.city]);

  const projectStartDate = formData.projectStartDate 
    ? dayjs(formData.projectStartDate) 
    : dayjs('2026-06-01');
  const projectEndDate = formData.projectEndDate 
    ? dayjs(formData.projectEndDate) 
    : dayjs('2026-09-15');

  const projectDurationWeeks = useMemo(() => {
    const diff = projectEndDate.diff(projectStartDate, 'day');
    if (diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / 7));
  }, [projectStartDate, projectEndDate]);

  const totalProjectIncome = useMemo(() => {
    if (!estimatedIncome || projectDurationWeeks === 0) return null;
    return estimatedIncome.netIncomeWithSecondJob * projectDurationWeeks;
  }, [estimatedIncome, projectDurationWeeks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.jobTitle || !formData.company || !formData.city || !formData.state) {
      setError('请填写必填字段：岗位名、公司、城市、州');
      return;
    }

    const jobId = initialData?.jobId ?? `CUSTOM-${Date.now()}`;
    const job: JobRecord = {
      jobId,
      jobTitle: formData.jobTitle!,
      company: formData.company!,
      city: formData.city!,
      state: formData.state!,
      stateTaxRate: formData.stateTaxRate ?? stateTaxLookup[formData.state!] ?? 0,
      jobType: formData.jobType ?? '',
      hourlyWage: formData.hourlyWage ?? 15,
      overtimeRate: formData.overtimeRate ?? 1.5,
      tipped: formData.tipped ?? false,
      averageTip: formData.tipped && formData.averageTip ? formData.averageTip : undefined,
      avgHoursPerWeek: formData.avgHoursPerWeek ?? 40,
      workHoursRange: formData.workHoursRange ?? [35, 45],
      overtimeAvailable: formData.overtimeAvailable ?? false,
      startDate: formData.startDate,
      endDate: formData.endDate,
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
      highlights: formData.highlights ?? [],
      projectStartDate: projectStartDate.format('YYYY-MM-DD'),
      projectEndDate: projectEndDate.format('YYYY-MM-DD'),
    };

    onSubmit(job);
    if (!initialData) {
      setFormData({
        jobTitle: '',
        company: '',
        city: '',
        state: 'CA',
        hourlyWage: 15,
        overtimeRate: 1.5,
        tipped: false,
        avgHoursPerWeek: 40,
        workHoursRange: [35, 45],
        overtimeAvailable: false,
        startDate: '',
        endDate: '',
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
        highlights: [],
        stateTaxRate: stateTaxLookup.CA,
        projectStartDate: '2026-06-01',
        projectEndDate: '2026-09-15',
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card>
      <CardHeader
        title={initialData ? '编辑岗位信息' : '创建新岗位'}
        subheader={initialData ? '修改岗位信息并保存' : '填写岗位信息，保存后出现在右侧面板'}
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
                    required
                    label="岗位名称"
                    placeholder="请选择或输入岗位名称"
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <TextField
                fullWidth
                required
                label="公司名称"
                value={formData.company ?? ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="雇主公司名"
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={usCities}
                value={matchedCityOption}
                inputValue={formData.city ?? ''}
                onInputChange={(_, newInputValue) =>
                  setFormData({ ...formData, city: newInputValue })
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({ ...formData, city: newValue });
                    return;
                  }
                  if (newValue) {
                    setFormData({
                      ...formData,
                      city: newValue.city,
                      state: newValue.state,
                      stateTaxRate: stateTaxLookup[newValue.state] ?? 0,
                    });
                  } else {
                    setFormData({ ...formData, city: '' });
                  }
                }}
                filterOptions={(options, { inputValue }) => {
                  const normalized = inputValue.trim().toLowerCase();
                  if (!normalized) {
                    return options.slice(0, 10);
                  }
                  return options
                    .filter((option) => option.city.toLowerCase().startsWith(normalized))
                    .slice(0, 10);
                }}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : `${option.city}, ${option.state}`
                }
                renderOption={(props, option) => (
                  <li {...props} key={`${option.city}-${option.state}`}>
                    {option.city}, {option.state}
                  </li>
                )}
                isOptionEqualToValue={(option, value) =>
                  !!value && option.city === value.city && option.state === value.state
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    required
                    label="城市"
                    placeholder="输入城市开头即可匹配"
                  />
                )}
              />
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 220px' }, minWidth: 200 }}>
              <TextField
                fullWidth
                required
                select
                label="州"
                value={formData.state ?? 'CA'}
                onChange={(e) => {
                  const state = e.target.value;
                  setFormData({
                    ...formData,
                    state,
                    stateTaxRate: stateTaxLookup[state] ?? 0,
                  });
                }}
              >
                {Object.keys(stateTaxLookup).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s} (税率 {(stateTaxLookup[s] * 100).toFixed(1)}%)
                  </MenuItem>
                ))}
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
                  基础时薪 ($/h)
                </Typography>
                <Slider
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
                <Typography variant="body2" color="text.secondary">
                  当前 {(formData.hourlyWage ?? 15).toFixed(2)} $/h
                </Typography>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  平均周工时
                </Typography>
                <Slider
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
                <Typography variant="body2" color="text.secondary">
                  当前 {formData.avgHoursPerWeek ?? 40} h/周
                </Typography>
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
                  二工工时 (h/周)
                </Typography>
                <Slider
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
                <Typography variant="body2" color="text.secondary">
                  当前 {formData.secondJobHours ?? 15} h/周
                </Typography>
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
                label="是否为小费岗位"
              />
              {formData.tipped && (
                <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 200px' }, minWidth: 200 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="平均小费 ($/h)"
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
                label="是否提供住宿"
              />
              {formData.hasHousing && (
                <>
                  <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 250px' }, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      住宿费用 ($/周)
                    </Typography>
                    <Slider
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
                    <Typography variant="body2" color="text.secondary">
                      当前 ${formData.housingCostPerWeek ?? 120}/周
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 250px' }, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      住宿距离 (km)
                    </Typography>
                    <Slider
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
                    <Typography variant="body2" color="text.secondary">
                      当前 {formData.housingDistanceKm ?? 2} km
                    </Typography>
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
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                <DatePicker
                  label="项目开始日期"
                  value={projectStartDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, projectStartDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
                <DatePicker
                  label="项目结束日期"
                  value={projectEndDate}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, projectEndDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
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
                label="岗位描述"
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述岗位特点..."
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
                取消
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{ minWidth: 140 }}
            >
              {initialData ? '更新岗位' : '保存岗位'}
            </Button>
          </Box>
        </Box>
      </form>
    </Card>
    </LocalizationProvider>
  );
}
