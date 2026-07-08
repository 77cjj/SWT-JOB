export type DocComment = {
  id: string;
  docSlug: string;
  userId: string;
  body: string;
  programYear: string;
  workState: string;
  helpfulCount: number;
  createdAt: string;
};

/** 示例评论：按文档 slug 匹配，上线后可换为 API */
export const DEMO_DOC_COMMENTS: DocComment[] = [
  {
    id: 'c-interview-1',
    docSlug: 'apply/interview',
    userId: 'u-maya-2025',
    body: '雇主 Skype 实际只问了 5 分钟：专业、能不能周末上班、为什么选这个岗位。自我介绍背了 90 秒版但没用上，建议把「能听懂+愿意开口」练熟更重要。',
    programYear: '2025',
    workState: 'NJ',
    helpfulCount: 14,
    createdAt: '2025-10-12',
  },
  {
    id: 'c-interview-2',
    docSlug: 'apply/interview',
    userId: 'u-sam-2025',
    body: 'Spirit 基金会面试约 20 分钟，问题都在文档场景 A 里。卡壳时说 Could you repeat that? 完全 OK，别硬撑长句。',
    programYear: '2025',
    workState: 'AK',
    helpfulCount: 9,
    createdAt: '2025-10-28',
  },
  {
    id: 'c-work-1',
    docSlug: 'living/work-rules',
    userId: 'u-alex-2024',
    body: '首周一定要问清 clock in/out 方式和加班是否自动算。我们店用 App 打卡，漏打会被算旷工。',
    programYear: '2024',
    workState: 'WI',
    helpfulCount: 11,
    createdAt: '2024-06-18',
  },
  {
    id: 'c-work-2',
    docSlug: 'living/work-rules',
    userId: 'u-maya-2025',
    body: '请病假我直接发短信给 supervisor，模板用文档里那句 I\'m not feeling well 就够，记得同步 Sponsor 邮箱留痕。',
    programYear: '2025',
    workState: 'NJ',
    helpfulCount: 7,
    createdAt: '2025-07-03',
  },
  {
    id: 'c-timeline-1',
    docSlug: 'apply/timeline',
    userId: 'u-alex-2024',
    body: '11 月选岗、2 月拿 Offer、4 月面签的时间线和我那年基本一致。DS-2019 邮寄慢的话多留 2 周 buffer。',
    programYear: '2024',
    workState: 'WI',
    helpfulCount: 6,
    createdAt: '2024-12-01',
  },
];

export function getCommentsForDoc(slug: string): DocComment[] {
  return DEMO_DOC_COMMENTS.filter((c) => c.docSlug === slug);
}
