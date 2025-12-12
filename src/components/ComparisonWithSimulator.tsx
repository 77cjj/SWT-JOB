import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Box,
  Grid,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { JobRecord } from '../types/job';
import { computeIncome, type IncomeOptions } from '../utils/jobMetrics';

interface Props {
  jobs: JobRecord[];
  onRemove: (jobId: string) => void;
}

export default function ComparisonWithSimulator({ jobs, onRemove }: Props) {
  const [simulatorParams, setSimulatorParams] = useState<IncomeOptions>({
    primaryHours: 40,
    secondHours: 15,
    exchangeRate: 7.2,
    taxRate: 0.05,
    housingCost: 120,
  });

  const computedIncomes = useMemo(() => {
    return jobs.map((job) => ({
      job,
      income: computeIncome(job, {
        ...simulatorParams,
        taxRate: simulatorParams.taxRate ?? job.stateTaxRate,
        housingCost: simulatorParams.housingCost ?? job.housingCostPerWeek,
      }),
    }));
  }, [jobs, simulatorParams]);

  const maxIncome = useMemo(() => {
    if (!computedIncomes.length) return 0;
    return Math.max(...computedIncomes.map((item) => item.income.netIncomeWithSecondJob));
  }, [computedIncomes]);

  if (!jobs.length) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            选择 1~3 个岗位后即可生成横向对比图
          </Alert>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            在右侧"我的岗位"面板中点击"加入对比"按钮
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardHeader
          title="参数调整"
          subheader="实时调整参数，对比差异"
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography gutterBottom>一工工时: {simulatorParams.primaryHours ?? 40}h</Typography>
              <Slider
                value={simulatorParams.primaryHours ?? 40}
                min={30}
                max={60}
                step={1}
                onChange={(_, val) =>
                  setSimulatorParams({ ...simulatorParams, primaryHours: val as number })
                }
                marks={[
                  { value: 30, label: '30h' },
                  { value: 45, label: '45h' },
                  { value: 60, label: '60h' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography gutterBottom>二工工时: {simulatorParams.secondHours ?? 15}h</Typography>
              <Slider
                value={simulatorParams.secondHours ?? 15}
                min={0}
                max={30}
                step={1}
                onChange={(_, val) =>
                  setSimulatorParams({ ...simulatorParams, secondHours: val as number })
                }
                marks={[
                  { value: 0, label: '0h' },
                  { value: 15, label: '15h' },
                  { value: 30, label: '30h' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography gutterBottom>汇率: {simulatorParams.exchangeRate ?? 7.2}</Typography>
              <Slider
                value={simulatorParams.exchangeRate ?? 7.2}
                min={6.5}
                max={8}
                step={0.05}
                onChange={(_, val) =>
                  setSimulatorParams({ ...simulatorParams, exchangeRate: val as number })
                }
                marks={[
                  { value: 6.5, label: '6.5' },
                  { value: 7.2, label: '7.2' },
                  { value: 8, label: '8' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography gutterBottom>
                州税率: {((simulatorParams.taxRate ?? 0.05) * 100).toFixed(1)}%
              </Typography>
              <Slider
                value={simulatorParams.taxRate ?? 0.05}
                min={0}
                max={0.1}
                step={0.005}
                onChange={(_, val) =>
                  setSimulatorParams({ ...simulatorParams, taxRate: val as number })
                }
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.1, label: '10%' },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography gutterBottom>住宿费: ${simulatorParams.housingCost ?? 120}/w</Typography>
              <Slider
                value={simulatorParams.housingCost ?? 120}
                min={0}
                max={250}
                step={5}
                onChange={(_, val) =>
                  setSimulatorParams({ ...simulatorParams, housingCost: val as number })
                }
                marks={[
                  { value: 0, label: '$0' },
                  { value: 120, label: '$120' },
                  { value: 250, label: '$250' },
                ]}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="岗位对比表"
          subheader={`已选择 ${jobs.length} 个岗位进行对比`}
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        />
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>岗位</TableCell>
                <TableCell align="right">净收入（含二工）</TableCell>
                <TableCell align="right">一工净收入</TableCell>
                <TableCell align="right">平均工时</TableCell>
                <TableCell>住宿</TableCell>
                <TableCell>二工</TableCell>
                <TableCell>风险</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {computedIncomes.map(({ job, income }) => {
                const isMaxIncome = income.netIncomeWithSecondJob === maxIncome && maxIncome > 0;
                return (
                  <TableRow
                    key={job.jobId}
                    sx={{
                      bgcolor: isMaxIncome ? 'success.dark' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {job.jobTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.city}, {job.state}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: isMaxIncome ? 'success.light' : 'success.main' }}
                      >
                        ${Math.round(income.netIncomeWithSecondJob)}/w
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ¥{Math.round(income.incomeRmb)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${Math.round(income.netIncomePrimary)}/w</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${job.avgHoursPerWeek}h`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {job.hasHousing ? (
                        <Typography variant="body2">宿舍 ${job.housingCostPerWeek}/w</Typography>
                      ) : (
                        <Chip label="需自找" size="small" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${job.secondJobPossible} / +${job.secondJobHours}h`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        稳定 {job.workStability}/5 · 治安 {job.safetyLevel}/5
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => onRemove(job.jobId)}
                        color="error"
                      >
                        移除
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
