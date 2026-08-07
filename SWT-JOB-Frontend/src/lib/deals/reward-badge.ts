import type { DealDisplayStatus, ResolvedProgram } from './deal-utils';
import type { ReferralProgram, RewardBadgeKind } from '../../data/referralDeals';

export function resolveRewardBadgeKind(program: ReferralProgram): RewardBadgeKind {
  if (program.rewardBadgeKind) return program.rewardBadgeKind;
  // 兼容旧数据：未配置时按现金处理，但无金额则不显示
  return 'cash';
}

export type DealCornerBadge =
  | { kind: 'cash'; amount: number; labelKey: 'deals.highlightAmount' }
  | { kind: 'credit'; amount: number; labelKey: 'deals.highlightCredit' }
  | { kind: 'coupon'; labelKey: 'deals.highlightCoupon' }
  | null;

/**
 * 右上角角标：只使用管理员配置的 highlightAmountUsd，绝不从文案里解析/加总。
 * coupon / none：不显示「可拿 $x」。
 */
export function resolveDealCornerBadge(program: ReferralProgram): DealCornerBadge {
  const kind = resolveRewardBadgeKind(program);
  if (kind === 'none' || kind === 'coupon') {
    // coupon 仅显示文案角标，不显示美元可拿
    if (kind === 'coupon') return { kind: 'coupon', labelKey: 'deals.highlightCoupon' };
    return null;
  }
  const amount = program.highlightAmountUsd;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  if (kind === 'credit') {
    return { kind: 'credit', amount, labelKey: 'deals.highlightCredit' };
  }
  return { kind: 'cash', amount, labelKey: 'deals.highlightAmount' };
}

export function recommendScore(item: ResolvedProgram): number {
  const p = item.program;
  if (p.recommendPriority != null && Number.isFinite(p.recommendPriority)) {
    return p.recommendPriority;
  }
  // 兜底：有明确现金角标的靠前，金额越大越靠前（用负分）
  const badge = resolveDealCornerBadge(p);
  if (badge?.kind === 'cash') return 100 - Math.min(badge.amount, 99);
  if (badge?.kind === 'credit') return 120;
  return 200;
}
