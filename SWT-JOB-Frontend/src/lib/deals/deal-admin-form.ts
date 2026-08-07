import type { DealCategory, OfferKind, ReferralProgram } from '../../data/referralDeals';

/**
 * 扁平字段，与 Notion「薅羊毛页面」数据库列一一对应：
 * 标题 | refer链接 | refer码 | 触发奖励条件 | 返现条件 | 我承诺返现 | 用户获得好处 | 日期 | 备注 | 汇率备注
 */
export interface DealAdminForm {
  id: string;
  /** 标题 */
  title: string;
  /** refer链接（列 3，可含说明文字 + URL） */
  referralLink: string;
  /** refer码（列 4） */
  referralCode: string;
  /** 触发奖励条件（文本） */
  triggerCondition: string;
  /** 返现条件（文本 1） */
  cashbackCondition: string;
  /** 我承诺返现（列 5，如「10刀」「40」） */
  siteRebate: string;
  /** 用户获得好处（列 6） */
  userBenefit: string;
  /** 我的奖励/每人（列 2，可选） */
  referrerNetReward: string;
  /** 活动开始 YYYY-MM-DD */
  validFrom: string;
  /** 活动结束 YYYY-MM-DD，留空=长期 */
  validUntil: string;
  /** 日期原文（Notion「日期」列，如「2026 年 8 月 1 日到 9 月 30 日」） */
  dateRangeNote: string;
  /** 备注 / 避坑（文本 2） */
  notes: string;
  /** 汇率备注（8.4汇率） */
  exchangeRateNote: string;
  /** 网站已录入（列 1：1=是，0=否） */
  siteReady: string;
  category: DealCategory;
  offerKind: OfferKind;
  published: string;
  sortOrder: string;
  /** 1=纳入 AI 问答知识库 */
  aiEnabled: string;
  pinned: boolean;
  /** 卡片右上角金额（USD，手动配置，不自动加总） */
  highlightAmountUsd: string;
  /** 角标类型：cash / credit / coupon / none */
  rewardBadgeKind: string;
  /** 推荐排序（越小越靠前） */
  recommendPriority: string;
  /** 卡片字段一：攻略简版 */
  cardGuideBrief: string;
  /** 卡片字段二：本站权益简版 */
  cardExtraBrief: string;
}

/** Notion 数据库 data source ID */
export const NOTION_DEALS_DATA_SOURCE = '3b274c04-13d3-8031-86f0-000b41c8ec80';

/** Notion 列名 → 语义 */
export const NOTION_COLUMN_MAP = {
  title: '标题',
  referralLink: 'refer链接',
  referralCode: 'refer码',
  triggerCondition: '触发奖励条件',
  cashbackCondition: '返现条件',
  siteRebate: '我承诺返现',
  userBenefit: '用户获得好处',
  referrerNetReward: '我的奖励/每人',
  dateRange: '日期',
  notes: '备注',
  exchangeRateNote: '8.4汇率',
  siteReady: '网站完成',
} as const;

export interface NotionDealRow {
  url?: string;
  标题?: string | null;
  '列 1'?: string | null;
  '列 2'?: string | null;
  '列 3'?: string | null;
  '列 4'?: string | null;
  '列 5'?: string | null;
  '列 6'?: string | null;
  文本?: string | null;
  '文本 1'?: string | null;
  '文本 2'?: string | null;
  日期?: string | null;
  '8.4汇率'?: string | null;
}

export const emptyDealAdminForm = (): DealAdminForm => ({
  id: '',
  title: '',
  referralLink: '',
  referralCode: '',
  triggerCondition: '',
  cashbackCondition: '',
  siteRebate: '',
  userBenefit: '',
  referrerNetReward: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  dateRangeNote: '',
  notes: '',
  exchangeRateNote: '',
  siteReady: '1',
  category: 'other',
  offerKind: 'refer',
  published: '1',
  sortOrder: '0',
  aiEnabled: '1',
  pinned: false,
  highlightAmountUsd: '',
  rewardBadgeKind: 'cash',
  recommendPriority: '',
  cardGuideBrief: '',
  cardExtraBrief: '',
});

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list?: string[]): string {
  return (list ?? []).join('\n');
}

function slugifyId(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** 从文本中提取第一个 http(s) URL */
export function extractUrlFromText(text: string): string {
  const match = text.match(/https?:\/\/[^\s)\]>"']+/i);
  return match?.[0]?.replace(/[.,;]+$/, '') ?? '';
}

/** 从「10刀」「$40」「40」等解析 USD 数字 */
export function parseRebateUsd(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed === '0' || trimmed === '0刀') return trimmed === '0' ? 0 : null;
  const match = trimmed.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

/** 解析 Notion 中文日期区间 */
export function parseChineseDateRange(text: string): { validFrom: string; validUntil: string; note: string } {
  const note = text.trim();
  if (!note) {
    return { validFrom: '', validUntil: '', note: '' };
  }

  const dates = [...note.matchAll(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g)];
  const toIso = (y: string, m: string, d: string) =>
    `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

  if (dates.length >= 2) {
    return {
      validFrom: toIso(dates[0][1], dates[0][2], dates[0][3]),
      validUntil: toIso(dates[1][1], dates[1][2], dates[1][3]),
      note,
    };
  }
  if (dates.length === 1) {
    const iso = toIso(dates[0][1], dates[0][2], dates[0][3]);
    return { validFrom: iso, validUntil: '', note };
  }
  return { validFrom: '', validUntil: '', note };
}

function activeEdition(program: ReferralProgram) {
  const sorted = [...program.editions].sort(
    (a, b) => b.validFrom.localeCompare(a.validFrom),
  );
  return sorted[0];
}

/** Notion 数据库行 → 后台表单 */
export function notionRowToAdminForm(row: NotionDealRow, fallbackId?: string): DealAdminForm | null {
  const title = row.标题?.trim();
  if (!title || title.includes('：') && title.endsWith('：')) return null;
  if (!title || title === 'refer链接') return null;

  const parsedDates = parseChineseDateRange(row.日期 ?? '');
  const referralLink = row['列 3']?.trim() ?? '';
  const siteRebate = row['列 5']?.trim() ?? '';

  return {
    id: fallbackId ?? slugifyId(title),
    title,
    referralLink,
    referralCode: row['列 4']?.trim() ?? '',
    triggerCondition: row.文本?.trim() ?? '',
    cashbackCondition: row['文本 1']?.trim() ?? '',
    siteRebate,
    userBenefit: row['列 6']?.trim() ?? '',
    referrerNetReward: row['列 2']?.trim() ?? '',
    validFrom: parsedDates.validFrom || new Date().toISOString().slice(0, 10),
    validUntil: parsedDates.validUntil,
    dateRangeNote: parsedDates.note,
    notes: row['文本 2']?.trim() ?? '',
    exchangeRateNote: row['8.4汇率']?.trim() ?? '',
    siteReady: row['列 1']?.trim() === '1' ? '1' : '0',
    category: 'other',
    offerKind: 'refer',
    published: row['列 1']?.trim() === '1' ? '1' : '0',
    sortOrder: '0',
    aiEnabled: '1',
    pinned: false,
    highlightAmountUsd: '',
    rewardBadgeKind: 'cash',
    recommendPriority: '',
    cardGuideBrief: '',
    cardExtraBrief: '',
  };
}

export function programToAdminForm(
  program: ReferralProgram,
  meta?: { published?: number; sortOrder?: number; aiEnabled?: number },
): DealAdminForm {
  const edition = activeEdition(program);
  const referralUrl = edition?.referralUrl ?? '';
  const howToLines = program.howToClaim?.zh ?? [];
  const practicalLines = program.practicalSteps?.zh ?? [];

  let exchangeRateNote = '';
  let notes = listToLines(practicalLines);
  const ratePrefix = '汇率备注：';
  if (notes.startsWith(ratePrefix)) {
    const [rate, ...rest] = notes.split('\n');
    exchangeRateNote = rate.replace(ratePrefix, '').trim();
    notes = rest.join('\n');
  }

  return {
    id: program.id,
    title: program.brandName.zh,
    referralLink: referralUrl || listToLines(howToLines.filter((l) => l.includes('http'))),
    referralCode: '',
    triggerCondition: listToLines(edition?.requirements.zh),
    cashbackCondition: listToLines(howToLines),
    siteRebate:
      program.siteRebateLabel?.zh ||
      (program.siteRebateUsd != null ? `${program.siteRebateUsd}刀` : ''),
    userBenefit: edition?.reward.zh ?? edition?.summary.zh ?? '',
    referrerNetReward: '',
    validFrom: edition?.validFrom ?? new Date().toISOString().slice(0, 10),
    validUntil: edition?.validUntil ?? '',
    dateRangeNote: edition?.validUntil
      ? `${edition.validFrom} 到 ${edition.validUntil}`
      : '',
    notes,
    exchangeRateNote,
    siteReady: String(meta?.published ?? 1) === '1' ? '1' : '0',
    category: program.category,
    offerKind: program.offerKind,
    published: String(meta?.published ?? 1),
    sortOrder: String(meta?.sortOrder ?? 0),
    aiEnabled: String(meta?.aiEnabled ?? 1),
    pinned: Boolean(program.pinned),
    highlightAmountUsd:
      program.highlightAmountUsd != null && Number.isFinite(program.highlightAmountUsd)
        ? String(program.highlightAmountUsd)
        : '',
    rewardBadgeKind: program.rewardBadgeKind || 'cash',
    recommendPriority:
      program.recommendPriority != null && Number.isFinite(program.recommendPriority)
        ? String(program.recommendPriority)
        : '',
    cardGuideBrief: edition?.cardGuideBrief?.zh ?? '',
    cardExtraBrief: edition?.cardExtraBrief?.zh ?? '',
  };
}

export function adminFormToProgram(
  form: DealAdminForm,
  existing?: ReferralProgram,
): ReferralProgram {
  const id = form.id.trim().toLowerCase() || slugifyId(form.title);
  const currentEdition = existing ? activeEdition(existing) : undefined;
  const editionId = currentEdition?.id ?? `${id}-current`;
  const previousEditions = existing?.editions?.filter((e) => e.id !== editionId) ?? [];

  const referralUrl = extractUrlFromText(form.referralLink) || form.referralLink.trim();
  const siteRebateUsd = parseRebateUsd(form.siteRebate);
  const requirementsZh = linesToList(form.triggerCondition);
  const howToClaimZh = [
    ...linesToList(form.cashbackCondition),
    ...(form.referralCode.trim() ? [`Refer 码：${form.referralCode.trim()}`] : []),
    ...(form.referralLink.trim() && !form.referralLink.includes(referralUrl)
      ? [form.referralLink.trim()]
      : []),
    ...(referralUrl ? [`邀请链接：${referralUrl}`] : []),
  ].filter(Boolean);

  const practicalStepsZh = [
    ...(form.notes.trim() ? linesToList(form.notes) : []),
    ...(form.exchangeRateNote.trim() ? [`汇率备注：${form.exchangeRateNote.trim()}`] : []),
    ...(form.referrerNetReward.trim()
      ? [`邀请人净奖励参考：${form.referrerNetReward.trim()}`]
      : []),
  ];

  const summaryZh =
    [form.triggerCondition.trim(), form.cashbackCondition.trim()].filter(Boolean).join('；') ||
    form.userBenefit.trim();

  const validFrom =
    form.validFrom.trim() ||
    parseChineseDateRange(form.dateRangeNote).validFrom ||
    new Date().toISOString().slice(0, 10);
  const validUntil =
    form.validUntil.trim() || parseChineseDateRange(form.dateRangeNote).validUntil || null;

  const program: ReferralProgram = {
    ...(existing ?? {
      id,
      category: form.category,
      offerKind: form.offerKind,
      brandName: { zh: form.title.trim(), en: form.title.trim() },
      editions: [],
    }),
    id,
    category: form.category,
    offerKind: form.offerKind,
    brandName: {
      zh: form.title.trim(),
      en: existing?.brandName.en || form.title.trim(),
    },
    pinned: form.pinned,
    siteRebateUsd,
    siteRebateLabel: {
      zh: form.siteRebate.trim() || (siteRebateUsd != null ? `本站返现 $${siteRebateUsd}` : ''),
      en:
        existing?.siteRebateLabel?.en ||
        (siteRebateUsd != null ? `$${siteRebateUsd} site cashback` : ''),
    },
    highlightAmountUsd: (() => {
      const kind = (form.rewardBadgeKind || 'cash') as string;
      if (kind === 'coupon' || kind === 'none') return null;
      const raw = form.highlightAmountUsd.trim();
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    rewardBadgeKind: (['cash', 'credit', 'coupon', 'none'].includes(form.rewardBadgeKind)
      ? form.rewardBadgeKind
      : 'cash') as ReferralProgram['rewardBadgeKind'],
    recommendPriority: (() => {
      const raw = form.recommendPriority.trim();
      if (!raw) return existing?.recommendPriority ?? null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),
    howToClaim: {
      zh: howToClaimZh,
      en: existing?.howToClaim?.en?.length ? existing.howToClaim.en : howToClaimZh,
    },
    practicalSteps: {
      zh: practicalStepsZh,
      en: existing?.practicalSteps?.en?.length ? existing.practicalSteps.en : practicalStepsZh,
    },
    editions: [
      {
        id: editionId,
        validFrom,
        validUntil,
        reward: {
          zh: form.userBenefit.trim(),
          en: existing?.editions?.[0]?.reward.en || form.userBenefit.trim(),
        },
        summary: {
          zh: summaryZh,
          en: existing?.editions?.[0]?.summary.en || summaryZh,
        },
        cardGuideBrief: form.cardGuideBrief.trim()
          ? {
              zh: form.cardGuideBrief.trim(),
              en: currentEdition?.cardGuideBrief?.en || form.cardGuideBrief.trim(),
            }
          : currentEdition?.cardGuideBrief,
        cardExtraBrief: form.cardExtraBrief.trim()
          ? {
              zh: form.cardExtraBrief.trim(),
              en: currentEdition?.cardExtraBrief?.en || form.cardExtraBrief.trim(),
            }
          : currentEdition?.cardExtraBrief,
        requirements: {
          zh: requirementsZh,
          en:
            currentEdition?.requirements.en?.length === requirementsZh.length
              ? currentEdition.requirements.en
              : requirementsZh,
        },
        referralUrl: referralUrl || undefined,
        officialUrl: currentEdition?.officialUrl,
        tags: currentEdition?.tags,
        changeNote: currentEdition?.changeNote,
      },
      ...previousEditions.filter((e) => e.id !== editionId),
    ],
  };

  return program;
}

/** 批量：Notion 行 → ReferralProgram（跳过表头/空行） */
export function notionRowsToPrograms(rows: NotionDealRow[]): ReferralProgram[] {
  return rows
    .map((row) => notionRowToAdminForm(row))
    .filter((form): form is DealAdminForm => form != null)
    .map((form) => adminFormToProgram(form));
}
