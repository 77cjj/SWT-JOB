import type { DealCategory, OfferKind, ReferralProgram } from '../../data/referralDeals';

/** 后台管理用的扁平字段，对应 Notion「薅羊毛页面」常见列 */
export interface DealAdminForm {
  id: string;
  brandNameZh: string;
  brandNameEn: string;
  category: DealCategory;
  offerKind: OfferKind;
  rewardZh: string;
  rewardEn: string;
  summaryZh: string;
  summaryEn: string;
  referralUrl: string;
  officialUrl: string;
  validFrom: string;
  validUntil: string;
  siteRebateUsd: string;
  siteRebateLabelZh: string;
  siteRebateLabelEn: string;
  requirementsZh: string;
  howToClaimZh: string;
  practicalStepsZh: string;
  published: string;
  sortOrder: string;
  pinned: boolean;
}

export const emptyDealAdminForm = (): DealAdminForm => ({
  id: '',
  brandNameZh: '',
  brandNameEn: '',
  category: 'other',
  offerKind: 'refer',
  rewardZh: '',
  rewardEn: '',
  summaryZh: '',
  summaryEn: '',
  referralUrl: '',
  officialUrl: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  siteRebateUsd: '',
  siteRebateLabelZh: '',
  siteRebateLabelEn: '',
  requirementsZh: '',
  howToClaimZh: '',
  practicalStepsZh: '',
  published: '1',
  sortOrder: '0',
  pinned: false,
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

function activeEdition(program: ReferralProgram) {
  const sorted = [...program.editions].sort(
    (a, b) => b.validFrom.localeCompare(a.validFrom),
  );
  return sorted[0];
}

export function programToAdminForm(
  program: ReferralProgram,
  meta?: { published?: number; sortOrder?: number },
): DealAdminForm {
  const edition = activeEdition(program);
  return {
    id: program.id,
    brandNameZh: program.brandName.zh,
    brandNameEn: program.brandName.en,
    category: program.category,
    offerKind: program.offerKind,
    rewardZh: edition?.reward.zh ?? '',
    rewardEn: edition?.reward.en ?? '',
    summaryZh: edition?.summary.zh ?? '',
    summaryEn: edition?.summary.en ?? '',
    referralUrl: edition?.referralUrl ?? '',
    officialUrl: edition?.officialUrl ?? '',
    validFrom: edition?.validFrom ?? new Date().toISOString().slice(0, 10),
    validUntil: edition?.validUntil ?? '',
    siteRebateUsd: program.siteRebateUsd != null ? String(program.siteRebateUsd) : '',
    siteRebateLabelZh: program.siteRebateLabel?.zh ?? '',
    siteRebateLabelEn: program.siteRebateLabel?.en ?? '',
    requirementsZh: listToLines(edition?.requirements.zh),
    howToClaimZh: listToLines(program.howToClaim?.zh),
    practicalStepsZh: listToLines(program.practicalSteps?.zh),
    published: String(meta?.published ?? 1),
    sortOrder: String(meta?.sortOrder ?? 0),
    pinned: Boolean(program.pinned),
  };
}

export function adminFormToProgram(
  form: DealAdminForm,
  existing?: ReferralProgram,
): ReferralProgram {
  const id = form.id.trim().toLowerCase();
  const currentEdition = existing ? activeEdition(existing) : undefined;
  const editionId = currentEdition?.id ?? `${id}-current`;
  const previousEditions = existing?.editions?.filter((e) => e.id !== editionId) ?? [];

  const requirementsZh = linesToList(form.requirementsZh);
  const requirementsEn =
    currentEdition?.requirements.en?.length === requirementsZh.length
      ? currentEdition.requirements.en
      : requirementsZh;

  const program: ReferralProgram = {
    ...(existing ?? {
      id,
      category: form.category,
      offerKind: form.offerKind,
      brandName: { zh: form.brandNameZh.trim(), en: form.brandNameEn.trim() || form.brandNameZh.trim() },
      editions: [],
    }),
    id,
    category: form.category,
    offerKind: form.offerKind,
    brandName: {
      zh: form.brandNameZh.trim(),
      en: form.brandNameEn.trim() || form.brandNameZh.trim(),
    },
    pinned: form.pinned,
    siteRebateUsd: form.siteRebateUsd.trim() ? Number(form.siteRebateUsd) : null,
    siteRebateLabel: {
      zh: form.siteRebateLabelZh.trim(),
      en: form.siteRebateLabelEn.trim() || form.siteRebateLabelZh.trim(),
    },
    howToClaim: {
      zh: linesToList(form.howToClaimZh),
      en: existing?.howToClaim?.en?.length
        ? existing.howToClaim.en
        : linesToList(form.howToClaimZh),
    },
    practicalSteps: {
      zh: linesToList(form.practicalStepsZh),
      en: existing?.practicalSteps?.en?.length
        ? existing.practicalSteps.en
        : linesToList(form.practicalStepsZh),
    },
    editions: [
      {
        id: editionId,
        validFrom: form.validFrom.trim() || new Date().toISOString().slice(0, 10),
        validUntil: form.validUntil.trim() || null,
        reward: {
          zh: form.rewardZh.trim(),
          en: form.rewardEn.trim() || form.rewardZh.trim(),
        },
        summary: {
          zh: form.summaryZh.trim(),
          en: form.summaryEn.trim() || form.summaryZh.trim(),
        },
        requirements: {
          zh: requirementsZh,
          en: requirementsEn,
        },
        referralUrl: form.referralUrl.trim() || undefined,
        officialUrl: form.officialUrl.trim() || undefined,
        tags: currentEdition?.tags,
        changeNote: currentEdition?.changeNote,
      },
      ...previousEditions.filter((e) => e.id !== editionId),
    ],
  };

  return program;
}
