import type { BilingualList, BilingualText } from './referralDeals';

/** 社区成员分享的真实办理经历，展示在薅羊毛卡片详情评论区 */
export interface DealExperience {
  id: string;
  /** 对应 referralPrograms[].id */
  programId: string;
  /** 可选：对应某一期活动 edition.id */
  editionId?: string;
  /** 发布者 userId，用于头像与主页跳转 */
  userId: string;
  /** 分享日期 YYYY-MM-DD */
  reportedAt: string;
  openingMethod?: BilingualText;
  materials?: BilingualList;
  ddMethod?: BilingualText;
  /** DD 完成日 YYYY-MM-DD */
  ddDate?: string;
  /** 奖励到账日 YYYY-MM-DD */
  bonusReceivedDate?: string;
  bonusAmount?: string;
  body: BilingualText;
  /** API 返回的作者展示信息 */
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  authorAvatarColor?: string;
}

export const dealExperiences: DealExperience[] = [
  {
    id: 'wf-exp-2026-07',
    programId: 'wells-fargo',
    editionId: 'wf-2026',
    userId: 'u-swt-wf-2026',
    reportedAt: '2026-07-08',
    openingMethod: { zh: '线下网点', en: 'In-branch' },
    materials: {
      zh: ['DS-2019', '护照', 'SSN'],
      en: ['DS-2019', 'Passport', 'SSN'],
    },
    ddMethod: {
      zh: 'BofA checking 发起 ACH 转账至 Wells Fargo，转账描述标注 Payroll（fake DD）',
      en: 'ACH transfer from BofA checking to Wells Fargo with Payroll memo (fake DD)',
    },
    ddDate: '2026-07-03',
    bonusReceivedDate: '2026-07-07',
    bonusAmount: '$325',
    body: {
      zh: '官方活动页只能查阅条款，线上办不了，须带齐材料去网点。官网写奖励约 30 天到账，我 7/3 完成 DD，7/7 就收到 $325，比预期快很多。',
      en: 'The official offer page is for terms only—online opening does not work; bring documents to a branch. The site says bonus in ~30 days; I completed DD on 7/3 and received $325 on 7/7, much faster than expected.',
    },
  },
];
