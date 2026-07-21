import type { DealEdition, ReferralProgram } from '../../data/referralDeals';

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
  return [...items].sort((a, b) => {
    const pinA = a.program.pinned ? 0 : 1;
    const pinB = b.program.pinned ? 0 : 1;
    if (pinA !== pinB) return pinA - pinB;
    const dr = rank[a.status] - rank[b.status];
    if (dr !== 0) return dr;
    return a.program.brandName.zh.localeCompare(b.program.brandName.zh, 'zh');
  });
}

export function formatEditionPeriod(
  edition: DealEdition,
  lang: 'zh' | 'en',
): string {
  const from = edition.validFrom;
  const until = edition.validUntil;
  if (!until) {
    return lang === 'zh' ? `${from} 起 · 长期有效` : `From ${from} · Ongoing`;
  }
  return lang === 'zh' ? `${from} — ${until}` : `${from} — ${until}`;
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
