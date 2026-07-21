import type { JobRecord } from '../../types/job';
import { computeIncome, getProjectDurationWeeks } from '../../utils/jobMetrics';
import { getCommentsForJob } from './jobComments';
import { resolveIntelLibraryJob } from './resolveIntelJob';

function commentIntelJobId(job: JobRecord, intel: JobRecord | null): string {
  return intel?.jobId ?? job.jobId;
}

export function buildCompareAiPrompt(jobs: JobRecord[]): string {
  const blocks = jobs.map((job, index) => {
    const intel = resolveIntelLibraryJob(job);
    const base = intel ?? job;
    const income = computeIncome(job);
    const weeks = getProjectDurationWeeks(job);
    const comments = getCommentsForJob(commentIntelJobId(job, intel));
    const commentLines =
      comments.length > 0
        ? comments.map((c) => `- (${c.workState} · ${c.programYear}) ${c.body}`).join('\n')
        : '（暂无社区评论）';

    return [
      `### 岗位 ${index + 1}：${job.jobTitle}`,
      `- 雇主：${job.company}`,
      `- 地点：${job.city ? `${job.city}, ` : ''}${job.state}`,
      `- 时薪 $${job.hourlyWage}/h，约 ${job.avgHoursPerWeek}h/周，小费：${job.tipped ? '有' : '无'}`,
      `- 住宿：${job.hasHousing ? `$${job.housingCostPerWeek}/周` : '需自找'}`,
      `- 二工：${job.secondJobPossible}，约 +${job.secondJobHours}h/周`,
      `- 估算每周净收入（含二工）：约 $${Math.round(income.netIncomeWithSecondJob)}`,
      weeks > 0 ? `- 项目约 ${weeks} 周，总净收入约 $${Math.round(income.netIncomeWithSecondJob * weeks)}` : '',
      base.description ? `- 备注：${base.description}` : '',
      intel ? `- 来自岗位情报库 ID：${intel.jobId}` : '- 用户手动录入/非情报库条目',
      `社区评论：\n${commentLines}`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '你是 SWT 选岗顾问。请根据以下用户加入对比的岗位数据与社区评论，给出简洁、可执行的选岗分析。',
    '要求：',
    '1) 对比净收入、住宿、二工、小费与风险点；',
    '2) 引用评论中的具体经验（如有）；',
    '3) 给出 1 个优先推荐和 1–2 条避坑；',
    '4) 用中文，避免过多 markdown 星号，控制在 250 字以内。',
    '',
    blocks.join('\n\n'),
  ].join('\n');
}
