export type DocComment = {
  id: string;
  /** 文档 slug（文档评论） */
  docSlug?: string;
  /** 薅羊毛 program id（项目评论） */
  dealId?: string;
  userId: string;
  body: string;
  programYear: string;
  /** 工作州/地区缩写 */
  workState: string;
  /** 项目周次描述，如 Summer · 12–24 周 */
  workWeek?: string;
  /** 回复某条评论；空为顶级 */
  parentId?: string | null;
  helpfulCount: number;
  dislikeCount?: number;
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
    workWeek: 'Summer · 12–24 周',
    helpfulCount: 14,
    dislikeCount: 1,
    createdAt: '2025-10-12',
  },
  {
    id: 'c-interview-1-r1',
    docSlug: 'apply/interview',
    parentId: 'c-interview-1',
    userId: 'u-sam-2025',
    body: '同感，我背了 90 秒自我介绍也被打断，他们只想确认 availability。',
    programYear: '2025',
    workState: 'AK',
    workWeek: 'Peak · 20–32 周',
    helpfulCount: 6,
    dislikeCount: 0,
    createdAt: '2025-10-13',
  },
  {
    id: 'c-interview-1-r2',
    docSlug: 'apply/interview',
    parentId: 'c-interview-1-r1',
    userId: 'u-maya-2025',
    body: '对，我准备了两句「周末/晚上都可以」比长篇自我介绍有用。',
    programYear: '2025',
    workState: 'NJ',
    workWeek: 'Summer · 12–24 周',
    helpfulCount: 4,
    dislikeCount: 0,
    createdAt: '2025-10-14',
  },
  {
    id: 'c-interview-2',
    docSlug: 'apply/interview',
    userId: 'u-sam-2025',
    body: 'Spirit 基金会面试约 20 分钟，问题都在文档场景 A 里。卡壳时说 Could you repeat that? 完全 OK，别硬撑长句。',
    programYear: '2025',
    workState: 'AK',
    workWeek: 'Peak · 20–32 周',
    helpfulCount: 9,
    dislikeCount: 0,
    createdAt: '2025-10-28',
  },
  {
    id: 'c-interview-3',
    docSlug: 'apply/interview',
    userId: 'u-jordan-2023',
    body: 'Retail 岗会问 blackout dates 和能不能做 closing shift。我当年被问「上一份工作为什么离职」，用 one sentence 讲 learning experience 就行。',
    programYear: '2023',
    workState: 'FL',
    workWeek: 'Summer · 10–22 周',
    helpfulCount: 18,
    dislikeCount: 2,
    createdAt: '2023-11-05',
  },
  {
    id: 'c-interview-4',
    docSlug: 'apply/interview',
    userId: 'u-lily-2026',
    body: '还在练口语，Mock 面试录屏回听发现 filler 太多。文档里的 STAR 模板我只用了 Situation + Action，足够应付大部分 hospitality 岗。',
    programYear: '2026',
    workState: 'CA',
    workWeek: '待出发 · 选岗中',
    helpfulCount: 5,
    dislikeCount: 0,
    createdAt: '2026-01-08',
  },
  {
    id: 'c-work-1',
    docSlug: 'living/work-rules',
    userId: 'u-alex-2024',
    body: '首周一定要问清 clock in/out 方式和加班是否自动算。我们店用 App 打卡，漏打会被算旷工。',
    programYear: '2024',
    workState: 'WI',
    workWeek: 'Summer · 14–26 周',
    helpfulCount: 11,
    dislikeCount: 1,
    createdAt: '2024-06-18',
  },
  {
    id: 'c-work-2',
    docSlug: 'living/work-rules',
    userId: 'u-maya-2025',
    body: '请病假我直接发短信给 supervisor，模板用文档里那句 I\'m not feeling well 就够，记得同步 Sponsor 邮箱留痕。',
    programYear: '2025',
    workState: 'NJ',
    workWeek: 'Peak · 18–30 周',
    helpfulCount: 7,
    dislikeCount: 0,
    createdAt: '2025-07-03',
  },
  {
    id: 'c-work-3',
    docSlug: 'living/work-rules',
    userId: 'u-park-2024',
    body: 'NY 酒店 OT 要提前批，没批就打卡会被 HR 打回。二工换岗前一定要 Sponsor 书面确认 SEVIS 雇主一致。',
    programYear: '2024',
    workState: 'NY',
    workWeek: 'Summer · 16–28 周',
    helpfulCount: 22,
    dislikeCount: 3,
    createdAt: '2024-08-02',
  },
  {
    id: 'c-work-3-r1',
    docSlug: 'living/work-rules',
    parentId: 'c-work-3',
    userId: 'u-alex-2024',
    body: '我们 Dells 那家 OT 也要书面批，没批直接打卡会被 HR 改回去。',
    programYear: '2024',
    workState: 'WI',
    workWeek: 'Summer · 14–26 周',
    helpfulCount: 9,
    dislikeCount: 0,
    createdAt: '2024-08-03',
  },
  {
    id: 'c-work-3-r2',
    docSlug: 'living/work-rules',
    parentId: 'c-work-3-r1',
    userId: 'u-park-2024',
    body: 'NY 这边还要在 app 里选 OT reason code，选错 code 也算 invalid。',
    programYear: '2024',
    workState: 'NY',
    workWeek: 'Summer · 16–28 周',
    helpfulCount: 5,
    dislikeCount: 1,
    createdAt: '2024-08-04',
  },
  {
    id: 'c-work-4',
    docSlug: 'living/work-rules',
    userId: 'u-min-2025',
    body: '主题公园 closing shift 结束经常午夜后，班车没了就拼车；文档里写的 grace period 我们店实际是 7 分钟，别踩线。',
    programYear: '2025',
    workState: 'TX',
    workWeek: 'Peak · 22–34 周',
    helpfulCount: 8,
    dislikeCount: 0,
    createdAt: '2025-08-19',
  },
  {
    id: 'c-timeline-1',
    docSlug: 'apply/timeline',
    userId: 'u-alex-2024',
    body: '11 月选岗、2 月拿 Offer、4 月面签的时间线和我那年基本一致。DS-2019 邮寄慢的话多留 2 周 buffer。',
    programYear: '2024',
    workState: 'WI',
    workWeek: 'Summer · 12–24 周',
    helpfulCount: 6,
    dislikeCount: 0,
    createdAt: '2024-12-01',
  },
  {
    id: 'c-timeline-2',
    docSlug: 'apply/timeline',
    userId: 'u-jordan-2023',
    body: '2023 年面签预约排到 3 月，建议一拿到 I-20 就刷 slot。travel day 和 SEVIS 上的 start date 差超过 10 天会被问。',
    programYear: '2023',
    workState: 'FL',
    workWeek: 'Summer · 11–23 周',
    helpfulCount: 15,
    dislikeCount: 1,
    createdAt: '2023-12-20',
  },
  {
    id: 'c-journey-1',
    docSlug: 'journey',
    userId: 'u-sam-2025',
    body: '从选 Sponsor 到落地 AK 整段流程文档和实际差不多，落地第一周别排太满，先把 SSN 预约和银行开户排进 calendar。',
    programYear: '2025',
    workState: 'AK',
    workWeek: 'Peak · 19–31 周',
    helpfulCount: 10,
    dislikeCount: 0,
    createdAt: '2025-05-14',
  },
  {
    id: 'c-journey-2',
    docSlug: 'journey',
    userId: 'u-lily-2026',
    body: '还在国内准备阶段，这份 journey 地图帮我搞清了「先 Sponsor 后选岗」的顺序，避免和中介说法打架。',
    programYear: '2026',
    workState: 'CA',
    workWeek: '待出发 · 准备季',
    helpfulCount: 4,
    dislikeCount: 0,
    createdAt: '2026-02-01',
  },
];

export function getCommentsForDoc(slug: string): DocComment[] {
  return DEMO_DOC_COMMENTS.filter((c) => c.docSlug === slug);
}

/** @deprecated use getCommentsForContext from lib/comments */

export function formatCommentProgramLabel(comment: DocComment): string {
  const week = comment.workWeek?.trim();
  if (week) return `SWT ${comment.programYear} · ${week}`;
  return `SWT ${comment.programYear} · ${comment.workState}`;
}
