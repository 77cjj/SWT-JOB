export type ListingFormState = {
  title: string;
  description: string;
  brand: string;
  referLink: string;
  referCode: string;
  platformReward: string;
  buyerCashback: string;
  completionCriteria: string;
  state: string;
  city: string;
  jobTitle: string;
  employerHint: string;
  intelFee: string;
  intelPreview: string;
  intelDetail: string;
  maxSlots: string;
};

export function validateMarketplaceListingForm(
  createType: 'refer' | 'job_intel',
  form: ListingFormState,
): string | null {
  const title = form.title.trim();
  const description = form.description.trim();
  if (title.length < 2) return '请填写标题（至少 2 个字）';
  if (description.length < 4) return '请填写描述（至少 4 个字）';

  const maxSlotsRaw = form.maxSlots.trim();
  const maxSlots = maxSlotsRaw ? Number(maxSlotsRaw) : 5;
  if (!Number.isFinite(maxSlots) || maxSlots < 1 || maxSlots > 20) {
    return '名额请填写 1–20 之间的整数';
  }

  if (createType === 'refer') {
    if (!form.brand.trim()) return '请填写或选择品牌';
    if (!form.referLink.trim() && !form.referCode.trim()) {
      return '邀请链接与 Refer Code 至少填一项';
    }
    const cashback = Number(form.buyerCashback);
    if (!Number.isFinite(cashback) || cashback <= 0) {
      return '请填写有效的买家返现金额（USD，大于 0）';
    }
    if (form.completionCriteria.trim().length < 4) {
      return '请填写完成条件（至少 4 个字）';
    }
    if (form.platformReward.trim()) {
      const pr = Number(form.platformReward);
      if (!Number.isFinite(pr) || pr < 0) return '平台奖励请填写非负数字或留空';
    }
    return null;
  }

  if (!form.state.trim()) return '请选择或填写州（必填）';
  if (form.jobTitle.trim().length < 2) return '请填写岗位名称（至少 2 个字）';
  const fee = Number(form.intelFee);
  if (!Number.isFinite(fee) || fee <= 0) return '请填写有效的情报价格（USD，大于 0）';
  if (form.intelPreview.trim().length < 8) return '请填写情报预览（至少 8 个字，不含敏感隐私）';
  if (form.intelDetail.trim().length < 20) return '请填写完整情报内容（至少 20 个字，成交后买家可见）';
  return null;
}
