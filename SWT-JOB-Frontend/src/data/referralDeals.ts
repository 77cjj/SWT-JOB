export type DealCategory = 'bank' | 'cashback' | 'mobile' | 'other';

/** refer = 邀请返现；signup_bonus = 官网开户奖励（无邀请链接）；promo = 运营商/促销 */
export type OfferKind = 'refer' | 'signup_bonus' | 'promo';

export interface BilingualText {
  zh: string;
  en: string;
}

export interface BilingualList {
  zh: string[];
  en: string[];
}

/** 某一时间段内的一次 Refer 活动（可归档到历史） */
export interface DealEdition {
  id: string;
  /** 活动开始日 YYYY-MM-DD */
  validFrom: string;
  /** 活动结束日；null 表示长期有效、无固定截止 */
  validUntil: string | null;
  reward: BilingualText;
  summary: BilingualText;
  requirements: BilingualList;
  /** 仅 refer 类项目配置；开户奖励类勿填占位链接 */
  referralUrl?: string;
  /** 该活动官方条款/说明页 */
  officialUrl?: string;
  requiresInPerson?: boolean;
  tags?: BilingualList;
  /** 相对上一版的政策变动说明（用于时间线） */
  changeNote?: BilingualText;
}

/** 一个品牌/产品的 Refer 项目（卡片主体），内含多期活动 */
export interface ReferralProgram {
  id: string;
  category: DealCategory;
  offerKind: OfferKind;
  brandName: BilingualText;
  /** 所有活动版本，建议按 validFrom 降序（最新在前） */
  editions: DealEdition[];
  /** 如何领取官方奖励（分步说明，详情页展示） */
  howToClaim?: BilingualList;
  /** 实操步骤（细节、避坑） */
  practicalSteps?: BilingualList;
  /** 官方项目补充说明 */
  officialDetail?: BilingualText;
  /** 置顶展示（如 Kalshi refer） */
  pinned?: boolean;
  /** 本站向用户返现金额（USD，管理员配置） */
  siteRebateUsd?: number | null;
  /** 本站返现展示文案 */
  siteRebateLabel?: BilingualText;
}

export const dealCategoryOrder: DealCategory[] = ['bank', 'cashback', 'mobile', 'other'];

export const referralPrograms: ReferralProgram[] = [
  {
    id: 'kalshi',
    category: 'other',
    offerKind: 'refer',
    pinned: true,
    brandName: { zh: 'Kalshi 预测市场', en: 'Kalshi' },
    siteRebateLabel: {
      zh: '保底返现 $7.5（预测）+ 最高 $12.5（加密）',
      en: 'From $7.5 (predictions) + up to $12.5 (crypto)',
    },
    editions: [
      {
        id: 'kalshi-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '最高约 $20 奖励', en: 'Up to ~$20 bonus' },
        summary: {
          zh: '用邀请链接注册 → 下载 App → 护照 KYC → 预测市场成交 $25 + 加密市场成交 $50 领取奖励（条款以 Kalshi 为准）。',
          en: 'Sign up via referral, verify with passport, trade $25 on predictions and $50 on crypto markets (verify official terms).',
        },
        requirements: {
          zh: ['美国境外可用护照注册', '需完成 KYC', '预测市场累计成交 $25', '加密货币市场累计成交 $50'],
          en: ['Passport signup', 'KYC', '$25 prediction volume', '$50 crypto volume'],
        },
        referralUrl:
          'https://kalshi.com/sign-up/?referral=bc97e675-c6f7-4911-9de8-5dde19652db1&m=true&utm_source=mobile_app&utm_medium=copy&utm_campaign=referral&utm_content=referral_qr_sheet',
        officialUrl: 'https://kalshi.com/',
        tags: { zh: ['置顶', '预测市场'], en: ['Pinned', 'Predictions'] },
      },
    ],
    howToClaim: {
      zh: [
        '点击本站「打开邀请链接」进入 Kalshi 注册页（务必用本链接，否则不计 refer）。',
        '下载 Kalshi 手机 App 并用同一账号登录。',
        '使用护照完成身份验证（非美国居民可用护照，具体以 Kalshi 审核为准）。',
        '在「预测市场」累计成交至少 $25（按平台规则计入的有效成交）。',
        '在「加密货币相关市场」累计成交至少 $50。',
        '奖励发放时间与形式以 Kalshi 官方通知为准；本站另承诺预测方向保底返现 $7.5、加密方向最高 $12.5（由管理员人工确认发放）。',
      ],
      en: [
        'Open the referral link and create an account.',
        'Install the app and sign in.',
        'Complete KYC with passport if eligible.',
        'Reach $25 traded volume on prediction markets.',
        'Reach $50 on crypto markets per program rules.',
      ],
    },
    practicalSteps: {
      zh: [
        '先用小金额熟悉下单与结算规则，再加仓满足 $25 / $50 门槛。',
        '预测与加密可能是不同账户模块，确认成交量分别统计。',
        '奖励、税务与合规风险自负；勿用超出承受能力的资金投机。',
      ],
      en: ['Start small', 'Confirm volume buckets', 'Only risk what you can afford'],
    },
    officialDetail: {
      zh: '本站置顶推荐；官方奖励 + 本站额外返现文案可在管理后台调整。',
      en: 'Pinned on SWT; site rebate configurable in admin.',
    },
  },
  {
    id: 'chime',
    category: 'bank',
    offerKind: 'refer',
    brandName: { zh: 'Chime', en: 'Chime' },
    editions: [
      {
        id: 'chime-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '最高 $100', en: 'Up to $100' },
        summary: {
          zh: '45 天内收到单笔 ≥$200 合规 Direct Deposit，14 天内激活实体借记卡。',
          en: 'Qualifying direct deposit of $200+ within 45 days; activate physical debit card within 14 days after.',
        },
        requirements: {
          zh: ['线上开户', '需 SSN', 'Direct Deposit 达标', '激活实体卡'],
          en: ['Online opening', 'SSN required', 'Qualifying DD', 'Activate physical card'],
        },
        referralUrl: 'https://chime.com/r/your-referral-code',
        officialUrl: 'https://help.chime.com/how-does-my-friends-chime-referral-link-work-5bb2ea50',
        tags: { zh: ['线上', '新手友好'], en: ['Online', 'Beginner-friendly'] },
        changeNote: {
          zh: '2026 年 refer 奖励维持 $100，DD 门槛仍为 $200。',
          en: '2026 referral bonus remains $100; DD threshold still $200.',
        },
      },
      {
        id: 'chime-2025',
        validFrom: '2025-01-01',
        validUntil: '2025-12-31',
        reward: { zh: '最高 $100', en: 'Up to $100' },
        summary: {
          zh: '与 2026 版条件相同：45 天内 DD ≥$200，激活实体卡。',
          en: 'Same as 2026: $200+ DD within 45 days; activate physical card.',
        },
        requirements: {
          zh: ['线上开户', '需 SSN', 'Direct Deposit 达标', '激活实体卡'],
          en: ['Online opening', 'SSN required', 'Qualifying DD', 'Activate physical card'],
        },
        referralUrl: 'https://chime.com/r/your-referral-code',
        officialUrl: 'https://help.chime.com/how-does-my-friends-chime-referral-link-work-5bb2ea50',
        changeNote: {
          zh: '奖励金额与 2024 持平，条款无重大变化。',
          en: 'Bonus unchanged from 2024; terms largely the same.',
        },
      },
      {
        id: 'chime-2024',
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        reward: { zh: '最高 $100', en: 'Up to $100' },
        summary: {
          zh: '早期版本：DD 门槛 $200，需激活实体卡。',
          en: 'Earlier version: $200 DD threshold; physical card activation required.',
        },
        requirements: {
          zh: ['线上开户', '需 SSN', 'Direct Deposit ≥$200'],
          en: ['Online opening', 'SSN required', 'Direct deposit ≥$200'],
        },
        referralUrl: 'https://chime.com/r/your-referral-code',
        changeNote: {
          zh: '首年收录：Chime refer 成为 SWT 群体热门开户选项。',
          en: 'First tracked edition: Chime refer popular among SWT participants.',
        },
      },
    ],
    howToClaim: {
      zh: [
        '通过本站或邀请链接打开 Chime 官网并完成注册',
        '在 45 天内设置 Direct Deposit，单笔到账 ≥ $200',
        '收到实体借记卡后 14 天内激活',
        '等待官方 refer 奖励入账（通常数周内，以 App 通知为准）',
        '达标后联系本站客服登记，领取本站额外返现',
      ],
      en: [
        'Open Chime via our referral link and complete signup',
        'Set up direct deposit of $200+ within 45 days',
        'Activate your physical debit card within 14 days',
        'Wait for the official referral bonus to post',
        'Contact us after qualifying to claim our site rebate',
      ],
    },
    practicalSteps: {
      zh: ['提前准备 SSN 与美国手机号', 'DD 可用雇主工资或部分转账服务（需自行确认是否算合规 DD）', '奖励条款以 Chime 官网为准'],
      en: ['Have SSN and US phone ready', 'Confirm what counts as qualifying direct deposit', 'Official terms always prevail'],
    },
    siteRebateUsd: null,
    siteRebateLabel: { zh: '本站返现待公布', en: 'Site rebate TBD' },
  },
  {
    id: 'sofi',
    category: 'bank',
    offerKind: 'refer',
    brandName: { zh: 'SoFi', en: 'SoFi' },
    editions: [
      {
        id: 'sofi-2026-s1',
        validFrom: '2026-01-01',
        validUntil: '2026-06-30',
        reward: { zh: '最高 $400', en: 'Up to $400' },
        summary: {
          zh: '25 天内 DD $1,000 得 $50；DD $5,000 得 $400。奖励约 7 天内到账。',
          en: '$1,000 DD within 25 days → $50; $5,000 → $400. Bonus ~7 days.',
        },
        requirements: {
          zh: ['25 天内完成 Direct Deposit', '金额分档累进', '以官网条款为准'],
          en: ['DD within 25 days', 'Tiered amounts', 'Official terms apply'],
        },
        referralUrl: 'https://www.sofi.com/invite/your-code',
        officialUrl: 'https://www.sofi.com/legal/banking/referral-program-terms/',
        tags: { zh: ['线上', '高奖励'], en: ['Online', 'High reward'] },
        changeNote: {
          zh: '2026 上半年维持 2025 末档奖励结构。',
          en: 'H1 2026 kept the same tier structure as late 2025.',
        },
      },
      {
        id: 'sofi-2025',
        validFrom: '2025-06-01',
        validUntil: '2025-12-31',
        reward: { zh: '最高 $300', en: 'Up to $300' },
        summary: {
          zh: '25 天内 DD $1,000 得 $50；DD $4,000 得 $300。',
          en: '$1,000 DD → $50; $4,000 DD → $300 within 25 days.',
        },
        requirements: {
          zh: ['25 天内 DD', '分档奖励', '需 SSN'],
          en: ['DD within 25 days', 'Tiered bonus', 'SSN required'],
        },
        referralUrl: 'https://www.sofi.com/invite/your-code',
        officialUrl: 'https://www.sofi.com/legal/banking/referral-program-terms/',
        changeNote: {
          zh: '最高档从 $300 上调至 2026 年的 $400。',
          en: 'Top tier raised from $300 to $400 in 2026.',
        },
      },
    ],
  },
  {
    id: 'capital-one-360',
    category: 'bank',
    offerKind: 'refer',
    brandName: { zh: 'Capital One 360', en: 'Capital One 360' },
    editions: [
      {
        id: 'cap1-2026',
        validFrom: '2026-01-15',
        validUntil: '2026-12-31',
        reward: { zh: '$300', en: '$300' },
        summary: {
          zh: '75 天内完成两笔 ≥$500 的 Direct Deposit（ACH 可能计入，以条款为准）。',
          en: 'Two $500+ direct deposits within 75 days (ACH may qualify).',
        },
        requirements: {
          zh: ['建议先申信用卡再开 checking', '到账周期 45–67 天', '需 SSN'],
          en: ['Some open card first', 'Bonus posts in 45–67 days', 'SSN required'],
        },
        referralUrl: 'https://capitalone.com/refer/your-code',
        officialUrl: 'https://www.capitalone.com/digital/tools/refer-a-friend/',
        tags: { zh: ['线上', '需耐心'], en: ['Online', 'Longer wait'] },
        changeNote: {
          zh: '2026 新版活动上线，奖励从 $250 恢复至 $300。',
          en: '2026 campaign restored bonus from $250 to $300.',
        },
      },
      {
        id: 'cap1-2025',
        validFrom: '2025-01-01',
        validUntil: '2025-12-31',
        reward: { zh: '$250', en: '$250' },
        summary: {
          zh: '75 天内两笔 ≥$500 DD，奖励略低于 2026 版。',
          en: 'Two $500+ DD within 75 days; lower bonus than 2026.',
        },
        requirements: {
          zh: ['两笔 DD 各 ≥$500', '75 天窗口', '需 SSN'],
          en: ['Two $500+ DD', '75-day window', 'SSN required'],
        },
        officialUrl: 'https://www.capitalone.com/digital/tools/refer-a-friend/',
        changeNote: {
          zh: '2025 全年奖励下调，2026 已更新回 $300。',
          en: '2025 bonus was reduced; updated to $300 in 2026.',
        },
      },
    ],
  },
  {
    id: 'bofa',
    category: 'bank',
    offerKind: 'signup_bonus',
    brandName: { zh: 'Bank of America', en: 'Bank of America' },
    editions: [
      {
        id: 'bofa-2026',
        validFrom: '2026-01-01',
        validUntil: '2026-05-31',
        reward: { zh: '最高 $500', en: 'Up to $500' },
        summary: {
          zh: '新 checking 客户：90 天内 Qualifying Direct Deposit 达标，分 $100 / $300 / $500 三档。无公开 refer 邀请计划。',
          en: 'New checking customers: tiered bonus with qualifying direct deposits within 90 days. No public refer-a-friend for checking.',
        },
        requirements: {
          zh: ['须为 12 个月内未持有过 BofA checking 的新客户', '通过官网活动页开户', '90 天内 DD 达标', '线下/线上视活动页说明'],
          en: ['New checking customer (no personal checking in past 12 months)', 'Open via official promo page', 'Qualifying DD within 90 days', 'Branch or online per offer'],
        },
        officialUrl: 'https://promotions.bankofamerica.com/',
        requiresInPerson: false,
        tags: { zh: ['开户奖励', '无 refer'], en: ['Sign-up bonus', 'No refer'] },
        changeNote: {
          zh: '2026 年维持三档 DD 奖励；信用卡 refer 仅限受邀持卡客户，本站不收录。',
          en: '2026 tiered DD bonus continues; card refer is invite-only—not listed here.',
        },
      },
      {
        id: 'bofa-2025',
        validFrom: '2025-01-01',
        validUntil: '2025-12-31',
        reward: { zh: '最高 $500', en: 'Up to $500' },
        summary: {
          zh: '2025 版：新 checking 客户 DD 分档奖励，最高 $500。',
          en: '2025: tiered DD bonus for new checking, up to $500.',
        },
        requirements: {
          zh: ['新 checking 客户', '90 天内 DD 达标'],
          en: ['New checking customer', 'Qualifying DD within 90 days'],
        },
        officialUrl: 'https://promotions.bankofamerica.com/',
        changeNote: {
          zh: '奖励结构与 2026 版基本一致。',
          en: 'Bonus structure largely unchanged from 2026 edition.',
        },
      },
    ],
  },
  {
    id: 'chase-secure',
    category: 'bank',
    offerKind: 'signup_bonus',
    brandName: { zh: 'Chase Secure Checking', en: 'Chase Secure Checking' },
    editions: [
      {
        id: 'chase-2026',
        validFrom: '2026-01-01',
        validUntil: '2026-07-15',
        reward: { zh: '$400', en: '$400' },
        summary: {
          zh: '90 天内 DD $1,000，奖励约 15 天内发放。',
          en: '$1,000 DD within 90 days; bonus ~15 days.',
        },
        requirements: {
          zh: ['线下开户', 'DS-2019 + 护照 + SSN', '24 岁以下免月费'],
          en: ['In-branch', 'DS-2019 + passport + SSN', 'Fee waiver under 24'],
        },
        officialUrl: 'https://account.chase.com/consumer/banking/checking-offers',
        requiresInPerson: true,
        tags: { zh: ['线下', '热门'], en: ['In-person', 'Popular'] },
        changeNote: {
          zh: '2026 春季档维持 $400，7/15 截止。',
          en: 'Spring 2026 $400 offer; ends 7/15.',
        },
      },
      {
        id: 'chase-2025',
        validFrom: '2025-01-01',
        validUntil: '2025-07-15',
        reward: { zh: '$300', en: '$300' },
        summary: {
          zh: '2025 版：90 天内 DD $1,000 得 $300。',
          en: '2025: $1,000 DD within 90 days → $300.',
        },
        requirements: {
          zh: ['线下开户', 'DS-2019 + 护照 + SSN'],
          en: ['In-branch', 'DS-2019 + passport + SSN'],
        },
        officialUrl: 'https://account.chase.com/consumer/banking/checking-offers',
        requiresInPerson: true,
        changeNote: {
          zh: '2026 年奖励从 $300 上调至 $400。',
          en: '2026 bonus raised from $300 to $400.',
        },
      },
    ],
  },
  {
    id: 'citi',
    category: 'bank',
    offerKind: 'signup_bonus',
    brandName: { zh: 'Citi Bank Checking', en: 'Citi Bank Checking' },
    editions: [
      {
        id: 'citi-2025-winter',
        validFrom: '2025-10-01',
        validUntil: '2026-03-31',
        reward: { zh: '$325', en: '$325' },
        summary: {
          zh: '60 天内完成 qualifying activities；需国内地址证明等材料。',
          en: 'Qualifying activities within 60 days; proof of address may be required.',
        },
        requirements: {
          zh: ['线下/线上视活动而定', '国内驾照等地址证明', '带实体 SSN'],
          en: ['Branch or online per offer', 'Address proof', 'Physical SSN'],
        },
        officialUrl: 'https://www.citi.com/usc/p/checking/checking-offers',
        requiresInPerson: true,
        tags: { zh: ['线下', '需材料'], en: ['In-person', 'Documents needed'] },
        changeNote: {
          zh: '2026 春季活动已结束，新一季条款尚未更新至本站。',
          en: 'Spring 2026 offer ended; next season not yet updated on this site.',
        },
      },
      {
        id: 'citi-2025-summer',
        validFrom: '2025-04-01',
        validUntil: '2025-09-30',
        reward: { zh: '$300', en: '$300' },
        summary: {
          zh: '2025 夏季档：DD 达标得 $300，月费可通过入账 $250 免除。',
          en: 'Summer 2025: $300 with qualifying DD; fee waiver with $250 deposit.',
        },
        requirements: {
          zh: ['Zelle 可能计入', '需 SSN', '以柜台条款为准'],
          en: ['Zelle may count', 'SSN required', 'Branch terms apply'],
        },
        officialUrl: 'https://www.citi.com/usc/p/checking/checking-offers',
        changeNote: {
          zh: '秋季档奖励上调至 $325。',
          en: 'Fall tier raised bonus to $325.',
        },
      },
    ],
  },
  {
    id: 'wells-fargo',
    category: 'bank',
    offerKind: 'signup_bonus',
    brandName: { zh: 'Wells Fargo Checking', en: 'Wells Fargo Checking' },
    editions: [
      {
        id: 'wf-2026',
        validFrom: '2026-04-01',
        validUntil: null,
        reward: { zh: '$325', en: '$325' },
        summary: {
          zh: '90 天内 DD $1,000，奖励约 30 天内到账。24 岁以下免月费。官方活动页可查阅条款，但须线下开户。',
          en: '$1,000 DD within 90 days; bonus ~30 days. Fee waiver under 24. Official offer page for terms; in-branch opening required.',
        },
        requirements: {
          zh: [
            '线下开户（官方活动页线上无法办理）',
            'DS-2019 + 护照 + SSN',
            '90 天内 DD $1,000',
          ],
          en: [
            'In-branch only (online opening not available on official offer page)',
            'DS-2019 + passport + SSN',
            '$1,000 DD within 90 days',
          ],
        },
        officialUrl: 'https://accountoffers.wellsfargo.com/checkingoffer/',
        requiresInPerson: true,
        tags: { zh: ['线下', '亲测'], en: ['In-person', 'Community-tested'] },
        changeNote: {
          zh: '2026 春季重新开放 $325 档；社区亲测 BofA ACH + Payroll 约 4 天到账。',
          en: 'Spring 2026 $325 offer reopened; community report: BofA ACH + Payroll, bonus in ~4 days.',
        },
      },
      {
        id: 'wf-2025',
        validFrom: '2025-01-01',
        validUntil: '2026-03-31',
        reward: { zh: '$325', en: '$325' },
        summary: {
          zh: '与现行版条件相同，已于 2026-03-31 结束。',
          en: 'Same terms as current; ended 2026-03-31.',
        },
        requirements: {
          zh: ['90 天内 DD $1,000', '线下开户'],
          en: ['$1,000 DD in 90 days', 'In-branch'],
        },
        officialUrl: 'https://accountoffers.wellsfargo.com/checkingoffer/',
        requiresInPerson: true,
      },
    ],
  },
  {
    id: 'rakuten',
    category: 'cashback',
    offerKind: 'refer',
    brandName: { zh: 'Rakuten', en: 'Rakuten' },
    editions: [
      {
        id: 'rakuten-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '新人约 $30 + 日常 2–15% 返现', en: '~$30 welcome + 2–15% cash back' },
        summary: {
          zh: '网购跳转 Rakuten 再下单，Nike、Adidas 等品牌常有高返现。',
          en: 'Shop via Rakuten for 2–15% back at Nike, Adidas, and more.',
        },
        requirements: {
          zh: ['注册账号', '通过 Rakuten 链接跳转下单', '按商家条款结算'],
          en: ['Sign up', 'Shop via Rakuten links', 'Per-merchant terms'],
        },
        referralUrl: 'https://www.rakuten.com/r/your-code',
        officialUrl: 'https://www.rakuten.com/help/article/terms-conditions',
        tags: { zh: ['网购', '长期有效'], en: ['Online shopping', 'Ongoing'] },
        changeNote: {
          zh: '新人奖励维持约 $30，日常返现比例随商家变动。',
          en: 'Welcome bonus ~$30; cash-back rates vary by merchant.',
        },
      },
      {
        id: 'rakuten-2024',
        validFrom: '2024-01-01',
        validUntil: '2025-12-31',
        reward: { zh: '新人 $40 + 返现', en: '$40 welcome + cash back' },
        summary: {
          zh: '2024–2025 新人奖励曾短暂提高至 $40。',
          en: '2024–2025 welcome bonus was briefly $40.',
        },
        requirements: {
          zh: ['首单通过 Rakuten', '满足最低消费门槛'],
          en: ['First order via Rakuten', 'Minimum spend may apply'],
        },
        referralUrl: 'https://www.rakuten.com/r/your-code',
        officialUrl: 'https://www.rakuten.com/help/article/terms-conditions',
        changeNote: {
          zh: '2026 年新人奖回调至约 $30。',
          en: '2026 welcome bonus reduced to ~$30.',
        },
      },
    ],
  },
  {
    id: 'weee',
    category: 'other',
    offerKind: 'refer',
    brandName: { zh: 'Weee!', en: 'Weee!' },
    editions: [
      {
        id: 'weee-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '新人共减 $20；邀请人最高 $20 积分', en: 'New user $20 off; referrer up to $20 credit' },
        summary: {
          zh: '华人亚超生鲜配送。新人前两单各减 $10；被邀请人 14 天 / 30 天内各完成一单 >$10 配送，邀请人各得 $10 积分。细则见饮食指南。',
          en: 'Asian grocery delivery. New users get $10 off first two orders; referrer earns $10 credit after invitee’s qualifying orders within 14 and 30 days. See food guide for full terms.',
        },
        requirements: {
          zh: [
            '被邀请人须为新用户，且通过专属链接注册',
            '新人券：前两单各减 $10（共 $20）',
            '邀请人：被邀请人 14 天内首单配送 >$10 → $10 积分',
            '邀请人：被邀请人 30 天内再次配送 >$10 → 再 $10 积分',
            '同一配送地址不可有两个以上被邀请账号',
            '每账户最多 100 个成功推荐',
          ],
          en: [
            'Invitee must be a new user who registers via referral link',
            'New user: $10 off each of first two orders ($20 total)',
            'Referrer: $10 credit after invitee’s first $10+ delivery within 14 days',
            'Referrer: another $10 credit after second $10+ delivery within 30 days',
            'No more than two referred accounts per delivery address',
            'Max 100 successful referrals per account',
          ],
        },
        referralUrl:
          'https://www.sayweee.com/zh/account/referral/landing?t=1&referral_id=17824662&lang=zh&utm_source=copyLink',
        officialUrl: 'https://www.sayweee.com/zh/help/article/referral-program-terms-and-conditions',
        tags: { zh: ['亚超', '生鲜配送', '新人友好'], en: ['Asian grocery', 'Delivery', 'New-user friendly'] },
        changeNote: {
          zh: '新增 Weee! 邀请：新人 $20 券 + 邀请人最高 $20 积分；完整细则见 /docs/living/food。',
          en: 'Added Weee! referral: $20 new-user coupons + up to $20 referrer credit; full terms in /docs/living/food.',
        },
      },
    ],
  },
  {
    id: 'total-wireless',
    category: 'mobile',
    offerKind: 'promo',
    brandName: { zh: 'Total Wireless', en: 'Total Wireless' },
    editions: [
      {
        id: 'tw-iphone13-2025',
        validFrom: '2025-06-01',
        validUntil: '2026-02-28',
        reward: { zh: 'iPhone 13 128GB 约 $49.99', en: 'iPhone 13 128GB ~$49.99' },
        summary: {
          zh: '转网 + $50/月套餐，首月总成本约 $100。激活约 60 天后可能解锁。',
          en: 'Port-in + $50/mo plan; ~$100 first month. May unlock after ~60 days.',
        },
        requirements: {
          zh: ['转入新号码', '购买指定套餐', '解锁政策以官网为准'],
          en: ['Port in', 'Eligible plan', 'Unlock per carrier terms'],
        },
        officialUrl: 'https://www.totalwireless.com/shop/phones',
        tags: { zh: ['转网', '硬件'], en: ['Port-in', 'Hardware'] },
        changeNote: {
          zh: '2026 春季该转网送机活动已结束，新活动尚未更新。',
          en: 'Spring 2026 port-in deal ended; next promo not yet posted.',
        },
      },
      {
        id: 'tw-iphone13-2024',
        validFrom: '2024-03-01',
        validUntil: '2025-05-31',
        reward: { zh: 'iPhone 13 约 $49.99', en: 'iPhone 13 ~$49.99' },
        summary: {
          zh: '2024 夏季档：相同转网条件，套餐要求略有不同。',
          en: 'Summer 2024: similar port-in; plan requirements differed slightly.',
        },
        requirements: {
          zh: ['转网', '$45/月套餐（当时）'],
          en: ['Port-in', '$45/mo plan (at the time)'],
        },
        officialUrl: 'https://www.totalwireless.com/shop/phones',
        changeNote: {
          zh: '2025 年套餐涨至 $50/月。',
          en: '2025 plan increased to $50/mo.',
        },
      },
    ],
  },
  {
    id: 'utest-wearable-150',
    category: 'other',
    offerKind: 'refer',
    brandName: { zh: 'Utest 智能手环测试 ①', en: 'Utest Wearable Band Study 1' },
    editions: [
      {
        id: 'utest-wearable-150-2026',
        validFrom: '2026-07-07',
        validUntil: null,
        reward: { zh: '$150', en: '$150' },
        summary: {
          zh: '佩戴智能手环完成指定动作，约 3 小时；无需口语能力，操作较简单。建议先用注册链接创建 Utest 账号并拿到 Utest ID。',
          en: 'Wear a smart band and complete assigned movements for about 3 hours. Minimal speaking required. Create a Utest account first to get a Utest ID.',
        },
        requirements: {
          zh: [
            '先注册 Utest 账号，完成后获得 Utest ID',
            '建议提前 10-15 天提交申请',
            '申请来源建议填写“朋友介绍”',
            'Refer 信息可联系 Email: jiajunchi@ucsb.edu 或微信: cjj20040608',
            '奖励通常以 VISA 电子卡发放，约 48 小时到账',
          ],
          en: [
            'Create a Utest account first and get a Utest ID',
            'Apply about 10-15 days in advance',
            'Use "friend referral" as the source when asked',
            'For referral details, contact Email: jiajunchi@ucsb.edu or WeChat: cjj20040608',
            'Reward is usually paid as a Visa e-gift card in about 48 hours',
          ],
        },
        referralUrl: 'https://www.utest.com/ref2494414',
        officialUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc7LKEUSmHQVlXFj-tjbiIjl9GmhiCigclgH5-Fx1Q17Ec_xw/viewform',
        tags: { zh: ['纽约', '约 3 小时', '无需口语'], en: ['New York', '~3 hours', 'Low speaking'] },
        changeNote: {
          zh: '新增 Utest 智能手环测试，注册链接用于先获取 Utest ID，报名表用于提交测试申请。',
          en: 'Added Utest wearable band study: sign up first for a Utest ID, then submit the study form.',
        },
      },
    ],
  },
  {
    id: 'wearable-study-225',
    category: 'other',
    offerKind: 'promo',
    brandName: { zh: '手环测试 ②', en: 'Wearable Band Study 2' },
    editions: [
      {
        id: 'wearable-study-225-2026',
        validFrom: '2026-07-07',
        validUntil: null,
        reward: { zh: '$225', en: '$225' },
        summary: {
          zh: '智能手环相关线下测试，约 3 小时；报名后可能需要用美国电话确认预约。',
          en: 'In-person wearable band study, about 3 hours. A US phone verification call may be required after applying.',
        },
        requirements: {
          zh: [
            '建议提前 10-15 天提交申请',
            '申请来源建议填写“朋友介绍”',
            'Refer 信息可联系 Email: jiajunchi@ucsb.edu 或微信: cjj20040608',
            '“是否参加过其他手环测试”即使报过 $150 项目也选 No，因为不是同一家公司',
            '留意陌生来电；未接到确认电话可主动联系项目方确认预约',
          ],
          en: [
            'Apply about 10-15 days in advance',
            'Use "friend referral" as the source when asked',
            'For referral details, contact Email: jiajunchi@ucsb.edu or WeChat: cjj20040608',
            'For prior wearable-study participation, choose No even if you applied for the $150 study because this is a different company',
            'Watch for unknown calls; contact the study team if the confirmation call does not arrive',
          ],
        },
        officialUrl: 'https://schlesinger.focusvision.com/survey/selfserve/5c0/240600#?',
        requiresInPerson: true,
        tags: { zh: ['纽约', '约 3 小时', '需电话确认'], en: ['New York', '~3 hours', 'Phone confirmation'] },
        changeNote: {
          zh: '新增 $225 手环测试，报名后重点关注电话确认环节。',
          en: 'Added the $225 wearable band study; phone confirmation is the key follow-up step.',
        },
      },
    ],
  },
];
