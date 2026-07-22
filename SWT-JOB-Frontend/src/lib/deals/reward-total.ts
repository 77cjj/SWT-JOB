/** 从奖励文案中尽量解析出美元数字（取第一个合理金额） */
export function parseUsdFromRewardText(text: string): number | null {
  if (!text) return null;
  const matches = [...text.matchAll(/\$\s*([\d]+(?:\.\d+)?)/g)];
  if (matches.length === 0) {
    const zh = text.match(/([\d]+(?:\.\d+)?)\s*刀/);
    if (zh) return Number(zh[1]);
    return null;
  }
  const nums = matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

export function calcDealTotalUsd(opts: {
  rewardText: string;
  siteRebateUsd?: number | null;
}): { platform: number | null; rebate: number; total: number | null } {
  const platform = parseUsdFromRewardText(opts.rewardText);
  const rebate = opts.siteRebateUsd != null && Number.isFinite(opts.siteRebateUsd) ? opts.siteRebateUsd : 0;
  if (platform == null && rebate <= 0) return { platform: null, rebate, total: null };
  if (platform == null) return { platform: null, rebate, total: rebate > 0 ? rebate : null };
  return { platform, rebate, total: platform + rebate };
}
