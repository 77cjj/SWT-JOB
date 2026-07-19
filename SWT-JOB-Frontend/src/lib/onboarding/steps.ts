export type OnboardingStep = {
  id: string;
  route: string;
  target: string;
  title: string;
  body: string;
};

export const ONBOARDING_STORAGE_KEY_PREFIX = 'swt-onboarding-v2-done';

/** 未登录用户使用 guest；已登录用户使用 userId */
export function getOnboardingUserKey(userId?: string | null): string {
  const id = userId?.trim();
  return id || 'guest';
}

function storageKey(userId?: string | null): string {
  return `${ONBOARDING_STORAGE_KEY_PREFIX}:${getOnboardingUserKey(userId)}`;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'compare-title',
    route: '/compare',
    target: '[data-tour="compare-header"]',
    title: '选岗计算器',
    body: '在这里手动录入 Offer，或从岗位情报库一键载入，模拟税后净收入。',
  },
  {
    id: 'compare-form',
    route: '/compare',
    target: '[data-tour="job-form"]',
    title: '填写岗位信息',
    body: '拖动时薪、工时、小费滑块；顶部大号金额会实时滚动更新。',
  },
  {
    id: 'compare-income',
    route: '/compare',
    target: '[data-tour="income-preview"]',
    title: '收入预览',
    body: '表单填写时，这里会实时显示税后净收入估算。',
  },
  {
    id: 'compare-saved',
    route: '/compare',
    target: '[data-tour="saved-jobs"]',
    title: '保存与对比',
    body: '保存多个岗位后，最多选 3 个打开对比弹窗。',
  },
  {
    id: 'jobs-explorer',
    route: '/jobs',
    target: '[data-tour="jobs-explorer"]',
    title: '浏览岗位情报',
    body: '左侧列表点选岗位，右侧查看可靠度与详情；手机端会从底部弹出详情面板。',
  },
  {
    id: 'jobs-search',
    route: '/jobs',
    target: '[data-tour="jobs-toolbar"]',
    title: '搜索与载入',
    body: '支持关键词搜索；点「载入计算器」把情报带到对比页。',
  },
  {
    id: 'deals-section',
    route: '/deals',
    target: '[data-tour="deals-section"]',
    title: '薅羊毛',
    body: '官方 Refer 活动在此浏览；「交易市集」Tab 可发布或购买返现与岗位情报。',
  },
  {
    id: 'market-tabs',
    route: '/deals',
    target: '[data-tour="market-tabs"]',
    title: '交易市集',
    body: 'Refer 返现与付费岗位情报分栏展示；钱包与撮合单在后续 Tab。',
  },
];

export function getStepsForRoute(pathname: string, section?: string): OnboardingStep[] {
  if (pathname === '/deals') {
    if (section === 'market') {
      return ONBOARDING_STEPS.filter((s) => s.id === 'market-tabs');
    }
    return ONBOARDING_STEPS.filter((s) => s.id === 'deals-section');
  }
  return ONBOARDING_STEPS.filter((s) => s.route === pathname);
}

export function isOnboardingDone(userId?: string | null): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(storageKey(userId)) === '1';
}

export function markOnboardingDone(userId?: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), '1');
}

export function resetOnboarding(userId?: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(userId));
}
