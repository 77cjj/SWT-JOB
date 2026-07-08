export type PollLocaleText = {
  zh: string;
  en: string;
};

export type DocPollOption = {
  id: string;
  label: PollLocaleText;
};

export type DocPollDefinition = {
  id: string;
  question: PollLocaleText;
  hint?: PollLocaleText;
  options: DocPollOption[];
};

export const DOC_POLL_DEFINITIONS: Record<string, DocPollDefinition> = {
  'ssn-walk-in': {
    id: 'ssn-walk-in',
    question: {
      zh: '你办理 SSN 时，当地 SSA 办公室是否接受 walk-in？',
      en: 'Did your local SSA office accept walk-in visits for SSN?',
    },
    hint: {
      zh: '仅统计亲身办理经历，帮助后来者判断是否需要预约。',
      en: 'Share your in-person experience to help others plan ahead.',
    },
    options: [
      {
        id: 'walk-in',
        label: { zh: '可以直接 walk-in，当天受理', en: 'Walk-in accepted same day' },
      },
      {
        id: 'appointment',
        label: { zh: '必须提前预约，不接受 walk-in', en: 'Appointment required, no walk-in' },
      },
      {
        id: 'walk-in-long-wait',
        label: { zh: '可以 walk-in，但排队 2 小时以上', en: 'Walk-in allowed but 2+ hour wait' },
      },
      {
        id: 'rescheduled',
        label: { zh: '当天未办成，被要求改日或补材料', en: 'Turned away — rescheduled or missing docs' },
      },
      {
        id: 'other',
        label: { zh: '其他情况', en: 'Other' },
      },
    ],
  },
  'ssn-card-wait': {
    id: 'ssn-card-wait',
    question: {
      zh: '从 SSA 受理到收到 SSN 卡片/信函，大概多久？',
      en: 'How long from SSA visit until you received your SSN card/letter?',
    },
    options: [
      { id: 'under-2w', label: { zh: '2 周内', en: 'Within 2 weeks' } },
      { id: '2-4w', label: { zh: '2–4 周', en: '2–4 weeks' } },
      { id: '4-6w', label: { zh: '4–6 周', en: '4–6 weeks' } },
      { id: 'over-6w', label: { zh: '超过 6 周仍未收到', en: 'Still waiting after 6+ weeks' } },
      { id: 'receipt-only', label: { zh: '只有受理回执，还在等', en: 'Receipt only — still waiting' } },
    ],
  },
  'sevis-activation': {
    id: 'sevis-activation',
    question: {
      zh: '你落地后多久完成 SEVIS 激活？',
      en: 'How soon after arrival did you complete SEVIS activation?',
    },
    options: [
      { id: 'within-3d', label: { zh: '3 天内', en: 'Within 3 days' } },
      { id: 'first-week', label: { zh: '第一周内', en: 'Within the first week' } },
      { id: 'delayed', label: { zh: '超过一周', en: 'More than a week' } },
      { id: 'pending', label: { zh: '尚未完成 / 不清楚流程', en: 'Not done yet / unsure how' } },
    ],
  },
  'monthly-checkin': {
    id: 'monthly-checkin',
    question: {
      zh: '你的 Sponsor Monthly Check-in 体验如何？',
      en: 'How was your Sponsor monthly check-in experience?',
    },
    options: [
      { id: 'easy', label: { zh: '在线系统，操作简单', en: 'Online portal — straightforward' } },
      { id: 'confusing', label: { zh: '能找到入口，但步骤不清楚', en: 'Found it but steps were confusing' } },
      { id: 'email', label: { zh: '需邮件联系 Sponsor 完成', en: 'Had to email Sponsor' } },
      { id: 'almost-missed', label: { zh: '之前不知道要做，险些遗漏', en: 'Didn’t know — almost missed it' } },
    ],
  },
  'bank-without-ssn': {
    id: 'bank-without-ssn',
    question: {
      zh: '抵美后多久成功开到银行账户？',
      en: 'How soon after arrival did you open a US bank account?',
    },
    options: [
      { id: 'first-week-no-ssn', label: { zh: '第一周内（尚无 SSN）', en: 'First week (before SSN)' } },
      { id: 'after-ssn', label: { zh: '拿到 SSN 之后才开成', en: 'After receiving SSN' } },
      { id: 'itin', label: { zh: '用 ITIN / 其他方式开成', en: 'Used ITIN or alternative ID' } },
      { id: 'not-yet', label: { zh: '尚未开成', en: 'Not opened yet' } },
    ],
  },
  'second-job': {
    id: 'second-job',
    question: {
      zh: '你在 SWT 期间是否找到第二份工作？',
      en: 'Did you find a second job during SWT?',
    },
    options: [
      { id: 'yes', label: { zh: '找到了', en: 'Yes' } },
      { id: 'searching', label: { zh: '找过但还没有', en: 'Applied — not yet' } },
      { id: 'not-allowed', label: { zh: '雇主不允许 / 未尝试', en: 'Employer disallowed / didn’t try' } },
      { id: 'not-needed', label: { zh: '一份工够用', en: 'One job was enough' } },
    ],
  },
};

export function getDocPollDefinition(pollId: string): DocPollDefinition | null {
  return DOC_POLL_DEFINITIONS[pollId] ?? null;
}

export function listDocPollIds(): string[] {
  return Object.keys(DOC_POLL_DEFINITIONS);
}
