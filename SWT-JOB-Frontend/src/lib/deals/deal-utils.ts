import type { DealEdition, ReferralProgram } from '../../data/referralDeals';
import type { Language } from '../../i18n/types';
import { resolveBilingualLang } from '../../i18n/types';

export type DealDisplayStatus = 'active' | 'expiring' | 'expired_stale';

export interface ResolvedProgram {
  program: ReferralProgram;
  edition: DealEdition;
  status: DealDisplayStatus;
  /** 距离截止日的天数；无截止日为 null */
  daysUntilExpiry: number | null;
  isStale: boolean;
}

const EXPIRING_WITHIN_DAYS = 30;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function isEditionActive(edition: DealEdition, now = new Date()): boolean {
  const from = parseDate(edition.validFrom);
  const today = startOfDay(now);
  if (from > today) return false;
  if (!edition.validUntil) return true;
  return parseDate(edition.validUntil) >= today;
}

export function isEditionFuture(edition: DealEdition, now = new Date()): boolean {
  return parseDate(edition.validFrom) > startOfDay(now);
}

export function isEditionPast(edition: DealEdition, now = new Date()): boolean {
  if (!edition.validUntil) return false;
  return parseDate(edition.validUntil) < startOfDay(now);
}

export function resolveProgram(program: ReferralProgram, now = new Date()): ResolvedProgram {
  const sorted = [...program.editions].sort(
    (a, b) => parseDate(b.validFrom).getTime() - parseDate(a.validFrom).getTime(),
  );

  const active = sorted.find((e) => isEditionActive(e, now));

  if (active) {
    let status: DealDisplayStatus = 'active';
    let daysUntilExpiry: number | null = null;

    if (active.validUntil) {
      daysUntilExpiry = daysBetween(now, parseDate(active.validUntil));
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= EXPIRING_WITHIN_DAYS) {
        status = 'expiring';
      }
    }

    return {
      program,
      edition: active,
      status,
      daysUntilExpiry,
      isStale: false,
    };
  }

  const latest = sorted[0];
  return {
    program,
    edition: latest,
    status: 'expired_stale',
    daysUntilExpiry: latest.validUntil
      ? daysBetween(now, parseDate(latest.validUntil))
      : null,
    isStale: true,
  };
}

export function resolveAllPrograms(
  programs: ReferralProgram[],
  now = new Date(),
): ResolvedProgram[] {
  return programs.map((p) => resolveProgram(p, now));
}

export function sortProgramsForDisplay(items: ResolvedProgram[]): ResolvedProgram[] {
  const rank: Record<DealDisplayStatus, number> = {
    active: 0,
    expiring: 1,
    expired_stale: 2,
  };

  const groupOrder: Record<string, number> = {
    'bank-neobank': 0,
    'bank-national': 1,
    remittance: 2,
    predictions: 3,
    cashback: 4,
    'ny-study': 5,
    'promo-other': 6,
  };

  const categoryOrder: Record<string, number> = {
    bank: 0,
    remittance: 1,
    cashback: 2,
    app: 3,
    study: 4,
    mobile: 5,
    other: 6,
  };

  const resolveGroup = (program: ReferralProgram): string => {
    if (program.displayGroup) return program.displayGroup;
    if (program.category === 'bank') return 'bank-national';
    if (program.category === 'remittance') return 'remittance';
    if (program.category === 'cashback') return 'cashback';
    if (program.category === 'study') return 'ny-study';
    if (program.id === 'kalshi') return 'predictions';
    return 'promo-other';
  };

  const recommendScoreOf = (item: ResolvedProgram): number => {
    const p = item.program;
    if (p.recommendPriority != null && Number.isFinite(p.recommendPriority)) {
      return Number(p.recommendPriority);
    }
    const amount =
      p.highlightAmountUsd != null && Number.isFinite(p.highlightAmountUsd)
        ? Number(p.highlightAmountUsd)
        : 0;
    const kind = p.rewardBadgeKind ?? 'cash';
    if (kind === 'cash' && amount > 0) return 100 - Math.min(amount, 99);
    if (kind === 'credit') return 120;
    return 200;
  };

  return [...items].sort((a, b) => {
    const pinA = a.program.pinned ? 0 : 1;
    const pinB = b.program.pinned ? 0 : 1;
    if (pinA !== pinB) return pinA - pinB;

    const statusDiff = rank[a.status] - rank[b.status];
    if (statusDiff !== 0) return statusDiff;

    const scoreDiff = recommendScoreOf(a) - recommendScoreOf(b);
    if (scoreDiff !== 0) return scoreDiff;

    const ca = categoryOrder[a.program.category] ?? 99;
    const cb = categoryOrder[b.program.category] ?? 99;
    if (ca !== cb) return ca - cb;

    const ga = groupOrder[resolveGroup(a.program)] ?? 99;
    const gb = groupOrder[resolveGroup(b.program)] ?? 99;
    if (ga !== gb) return ga - gb;

    return a.program.brandName.zh.localeCompare(b.program.brandName.zh, 'zh');
  });
}

export function formatEditionPeriod(
  edition: DealEdition,
  lang: Language,
): string {
  const contentLang = resolveBilingualLang(lang);
  const from = edition.validFrom;
  const until = edition.validUntil;
  if (!until) {
    return contentLang === 'zh' ? `${from} 起 · 长期有效` : `From ${from} · Ongoing`;
  }
  return contentLang === 'zh' ? `${from} — ${until}` : `${from} — ${until}`;
}

export type EditionTimelineRole = 'current' | 'past' | 'future';

export function getEditionTimelineRole(
  edition: DealEdition,
  resolved: ResolvedProgram,
  now = new Date(),
): EditionTimelineRole {
  if (edition.id === resolved.edition.id && !resolved.isStale) return 'current';
  if (isEditionFuture(edition, now)) return 'future';
  return 'past';
}

export function sortedEditionsForTimeline(program: ReferralProgram): DealEdition[] {
  return [...program.editions].sort(
    (a, b) => parseDate(b.validFrom).getTime() - parseDate(a.validFrom).getTime(),
  );
}
