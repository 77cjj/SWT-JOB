export type JobComment = {
  id: string;
  jobId: string;
  userId: string;
  body: string;
  programYear: string;
  workState: string;
  helpfulCount: number;
  createdAt: string;
};

export const DEMO_JOB_COMMENTS: JobComment[] = [
  {
    id: 'jc-maya-1',
    jobId: 'DEMO-j-maya-ac',
    userId: 'u-maya-2025',
    body: '小费旺季周末能到 $18–22/h，但排班很满。宿舍 4 人间，离店走路 12 分钟，算 NJ 里性价比还可以的餐饮岗。',
    programYear: '2025',
    workState: 'NJ',
    helpfulCount: 11,
    createdAt: '2025-08-14',
  },
  {
    id: 'jc-alex-1',
    jobId: 'DEMO-j-maya-ac',
    userId: 'u-alex-2024',
    body: '朋友做过同一条街上的店，建议问清楚 break 是否带薪；我们那年午休 30 分钟不算工时。',
    programYear: '2024',
    workState: 'WI',
    helpfulCount: 5,
    createdAt: '2025-07-02',
  },
  {
    id: 'jc-alex-2',
    jobId: 'DEMO-j-alex-wi',
    userId: 'u-alex-2024',
    body: '客房岗时薪一般，但二工便利店晚班 14h/周大概多拿 $700+。住宿包在 resort 里，省房租是真省钱。',
    programYear: '2024',
    workState: 'WI',
    helpfulCount: 9,
    createdAt: '2024-07-21',
  },
  {
    id: 'jc-maya-2',
    jobId: 'DEMO-j-alex-wi',
    userId: 'u-maya-2025',
    body: 'Dells 游客季 6–8 月最忙，9 月初会裁工时。想多赚务必 7 月前搞定二工。',
    programYear: '2025',
    workState: 'NJ',
    helpfulCount: 4,
    createdAt: '2025-06-10',
  },
  {
    id: 'jc-sam-1',
    jobId: 'DEMO-j-sam-ak',
    userId: 'u-sam-2025',
    body: '救生员面试会问水上救援场景，口语不用很复杂但要听得懂。AK 物价高，净收入别只看时薪，要看住宿扣多少。',
    programYear: '2025',
    workState: 'AK',
    helpfulCount: 8,
    createdAt: '2025-07-28',
  },
];

export function getCommentsForJob(jobId: string): JobComment[] {
  const aliases: Record<string, string[]> = {
    '2024-NJ-SERV-032': ['DEMO-j-maya-ac'],
    '2024-WI-HOUS-044': ['DEMO-j-alex-wi'],
    '2024-AK-LIFE-001': ['DEMO-j-sam-ak'],
  };
  const ids = new Set<string>([jobId, ...(aliases[jobId] ?? [])]);
  return DEMO_JOB_COMMENTS.filter((c) => ids.has(c.jobId));
}
