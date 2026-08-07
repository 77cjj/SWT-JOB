import { notionRemittancePrograms } from './notionDealsSeed';

export type DealCategory = 'bank' | 'cashback' | 'mobile' | 'other';

/** 官方精选排序分组（相似项目靠近展示） */
export type DealDisplayGroup =
  | 'bank-neobank'
  | 'bank-national'
  | 'predictions'
  | 'cashback'
  | 'remittance'
  | 'ny-study'
  | 'promo-other';

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
  /** 卡片字段一：攻略简版（列表卡片展示；缺省回退 summary） */
  cardGuideBrief?: BilingualText;
  /** 卡片字段二：本站权益/补充简版（缺省回退 siteRebateLabel） */
  cardExtraBrief?: BilingualText;
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
  /** 相似分组，用于官方精选排序 */
  displayGroup?: DealDisplayGroup;
  /** 本站向用户返现金额（USD，管理员配置） */
  siteRebateUsd?: number | null;
  /** 本站返现展示文案 */
  siteRebateLabel?: BilingualText;
  /**
   * 卡片右上角展示金额（USD，管理员单独配置）。
   * 仅配置后显示；不会自动把官方奖励与本站返现加总。
   */
  highlightAmountUsd?: number | null;
}

export const dealCategoryOrder: DealCategory[] = ['bank', 'other'];

export const referralPrograms: ReferralProgram[] = [
  {
    id: 'kalshi',
    category: 'other',
    displayGroup: 'predictions',
    offerKind: 'refer',
    pinned: true,
    brandName: { zh: 'Kalshi 预测市场', en: 'Kalshi' },
    highlightAmountUsd: 20,
    siteRebateUsd: 7.5,
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
          zh: '用邀请链接注册 → 下载 App → 完成 KYC → 按 App Rewards 所示成交门槛领取邀请积分（条款以 Kalshi 为准）。',
          en: 'Sign up via referral, complete KYC, then meet the trading requirement shown in App Rewards (official Kalshi terms apply).',
        },
        cardGuideBrief: {
          zh: '邀请链接注册 → KYC → 按 App 显示成交门槛领取积分（常见约预测 $25）。',
          en: 'Referral signup → KYC → meet App Rewards volume (often ~$25 predictions).',
        },
        cardExtraBrief: {
          zh: '本站：预测保底 $7.5，加密方向最高另返 $12.5（人工确认）。',
          en: 'Site: from $7.5 (predictions) + up to $12.5 (crypto), manual payout.',
        },
        requirements: {
          zh: [
            '必须通过邀请链接注册，或注册后 72 小时内、首次入金前绑定有效邀请码（以官方 FAQ 为准）',
            '账号须完成 KYC 身份验证',
            '成交门槛与奖励金额以 App「Rewards / Referrals」当前展示为准（活动会变）',
            '邀请积分通常为交易额度、非直接可提现现金；常见约 7 天未使用作废',
            '存在终身邀请收益上限；资格与地区限制以 Kalshi 审核为准',
          ],
          en: [
            'Sign up via referral link, or bind a valid code within 72 hours before first deposit (per Kalshi FAQ)',
            'Account must complete KYC',
            'Trading requirement and bonus amount are shown in App Rewards / Referrals (offers change)',
            'Referral credits are typically trading credits, not withdrawable cash; unused credits often expire in ~7 days',
            'Lifetime referral earnings cap and geo eligibility apply per Kalshi',
          ],
        },
        referralUrl:
          'https://kalshi.com/sign-up/?referral=bc97e675-c6f7-4911-9de8-5dde19652db1&m=true&utm_source=mobile_app&utm_medium=copy&utm_campaign=referral&utm_content=referral_qr_sheet',
        officialUrl: 'https://help.kalshi.com/en/articles/13823783-kalshi-referral-program-faq',
        tags: { zh: ['置顶', '预测市场'], en: ['Pinned', 'Predictions'] },
      },
    ],
    howToClaim: {
      zh: [
        '点击本站「打开邀请链接」进入 Kalshi 注册页（务必用本链接，否则不计 refer）。',
        '下载 Kalshi 手机 App 并用同一账号登录。',
        '完成身份验证（KYC）；材料与是否支持护照以 Kalshi 审核为准。',
        '打开 App「Rewards / Referrals」查看你账号当前的成交门槛与奖励金额。',
        '完成所示有效成交后，按官方指引领取邀请积分；积分用途与过期规则以官方为准。',
        '本站另承诺预测方向保底返现 $7.5、加密方向最高 $12.5（由管理员人工确认发放，与官方积分分开）。',
      ],
      en: [
        'Open the referral link and create an account.',
        'Install the app and sign in.',
        'Complete KYC as required by Kalshi.',
        'Check App Rewards / Referrals for your current volume and bonus.',
        'Meet the shown trading requirement, then claim credits per Kalshi.',
        'Site cashback (from $7.5 / up to $12.5 crypto) is separate and paid after admin confirmation.',
      ],
    },
    practicalSteps: {
      zh: [
        '奖励金额、成交门槛会随账号与活动变化——以 App 内展示为准，不要只看第三方攻略数字。',
        '邀请积分多为交易 credit：通常不可直接提现，未使用可能约 7 天作废（见官方 FAQ）。',
        '先用小金额熟悉下单与结算规则，再满足门槛；税务与合规风险自负。',
      ],
      en: [
        'Bonus amounts and volume requirements vary—always trust the in-app Rewards screen.',
        'Referral credits are usually trading credits and may expire (~7 days) if unused.',
        'Start small; only risk what you can afford.',
      ],
    },
    officialDetail: {
      zh: '官方条款摘要（来源：Kalshi Help Center「Referral Program FAQ」）：须邀请链接/码 + KYC + App 所示成交门槛；积分非现金、常约 7 天有效；有终身邀请上限。地区与资格以 Kalshi 为准。本站返现为额外承诺，不构成官方保证。',
      en: 'Official summary (Kalshi Referral Program FAQ): referral link/code + KYC + in-app trading requirement; credits are not cash and often expire in ~7 days; lifetime referral cap applies. Site rebate is separate from Kalshi.',
    },
  },
  {
    id: 'moomoo',
    category: 'other',
    displayGroup: 'promo-other',
    offerKind: 'refer',
    brandName: { zh: 'Moomoo 富途', en: 'Moomoo' },
    highlightAmountUsd: 75,
    siteRebateLabel: {
      zh: '平台奖励发放后返现一半（约 $5–75）',
      en: '50% cashback after platform payout (~$5–75)',
    },
    editions: [
      {
        id: 'moomoo-2026-07',
        validFrom: '2026-07-01',
        validUntil: '2026-07-31',
        reward: { zh: '开户/邀请奖励 + 本站返现', en: 'Signup/refer bonus + site cashback' },
        summary: {
          zh: '7 月 31 日前通过邀请链接或 Refer Code M69D3EMM 开户；平台奖励发放后本站承诺返现一半（约 $5–75 浮动，以实际发放为准）。',
          en: 'Sign up via link or code M69D3EMM by Jul 31; site rebates 50% after platform pays (~$5–75, varies).',
        },
        cardGuideBrief: {
          zh: '7/31 前用邀请链接或码 M69D3EMM 开户，完成官方任务领平台奖。',
          en: 'By Jul 31: sign up via link/code M69D3EMM and finish Moomoo tasks.',
        },
        cardExtraBrief: {
          zh: '本站：平台奖励到账后返一半（约 $5–75，浮动）。',
          en: 'Site: 50% cashback after platform payout (~$5–75).',
        },
        requirements: {
          zh: [
            '邀请链接：https://j.moomoo.com/0ER7nH',
            'Refer Code：M69D3EMM（7/31 前有效）',
            '完成 Moomoo 官方开户/邀请任务并领取平台奖励（入金/交易门槛以 App 活动页为准）',
            '本站于平台奖励到账后返现一半（约 $5–75，浮动）',
          ],
          en: [
            'Referral: https://j.moomoo.com/0ER7nH',
            'Code M69D3EMM (valid through Jul 31)',
            'Complete official Moomoo offer and receive platform reward (deposit/trade rules in-app)',
            'Site pays 50% cashback after platform payout (~$5–75)',
          ],
        },
        referralUrl: 'https://j.moomoo.com/0ER7nH',
        officialUrl: 'https://www.moomoo.com/',
        tags: { zh: ['Refer M69D3EMM', '7/31 截止'], en: ['Code M69D3EMM', 'Until Jul 31'] },
      },
    ],
    howToClaim: {
      zh: [
        '点击本站「打开邀请链接」或手动输入 Refer Code M69D3EMM 完成注册。',
        '按 Moomoo 官方规则完成开户/邀请任务并等待平台奖励发放。',
        '平台奖励到账后联系站长或按市集说明领取本站返现一半（约 $5–75）。',
      ],
      en: [
        'Open the referral link or enter code M69D3EMM at signup.',
        'Complete Moomoo requirements and receive the platform bonus.',
        'After platform payout, claim 50% site cashback (~$5–75).',
      ],
    },
  },
  {
    id: 'chime',
    category: 'bank',
    displayGroup: 'bank-neobank',
    offerKind: 'refer',
    brandName: { zh: 'Chime', en: 'Chime' },
    highlightAmountUsd: 100,
    editions: [
      {
        id: 'chime-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '被邀请人 $100', en: '$100 for referee' },
        summary: {
          zh: '邀请链接开 Checking → 开户后 45 天内单笔合规 DD ≥$200 → 该笔 DD 后 14 天内激活实体卡。',
          en: 'Open Checking via referral → one qualifying DD ≥$200 within 45 days → activate physical card within 14 days of that DD.',
        },
        cardGuideBrief: {
          zh: '邀请链接开户 → 45 天内单笔合规 DD≥$200 → 14 天内激活实体卡。',
          en: 'Referral signup → $200+ qualifying DD in 45 days → activate card in 14 days.',
        },
        cardExtraBrief: {
          zh: '被邀请人通常得 $100；邀请人奖金以 App 当前 offer 为准。本站返现待公布。',
          en: 'Referee typically gets $100; referrer amount follows active offer. Site rebate TBD.',
        },
        requirements: {
          zh: [
            '必须通过邀请人专属链接注册并成功开立 Chime Checking',
            '开户后 45 天内收到单笔 ≥$200 的 Qualifying Direct Deposit（多笔小额不合并）',
            '合规 DD 通常来自雇主工资、政府福利等 ACH；银行互转 / Venmo / PayPal 等 P2P 一般不计',
            '收到该笔合规 DD 后 14 个日历日内激活实体 Chime 卡',
            '三项均完成后双方才可能获奖励；邀请人金额可能随其当前活动变化',
          ],
          en: [
            'Must open a Chime Checking account via the unique referral link',
            'Receive a single qualifying direct deposit of $200+ within 45 days of opening',
            'Qualifying DD is typically payroll/benefits ACH; bank transfers and P2P usually do not count',
            'Activate the physical Chime card within 14 calendar days after that qualifying DD',
            'All three steps required; referrer bonus may vary by their active offer',
          ],
        },
        referralUrl: 'https://chime.com/r/your-referral-code',
        officialUrl: 'https://help.chime.com/what-is-chimes-standard-referral-program-eca42e30',
        tags: { zh: ['线上', '新手友好'], en: ['Online', 'Beginner-friendly'] },
        changeNote: {
          zh: '已按 Chime Help Center 标准推荐计划更新：被邀请人 $100；DD $200 / 45 天；实体卡 14 天。',
          en: 'Updated from Chime Help Center: $100 for referee; $200 DD / 45 days; physical card in 14 days.',
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
        '通过本站邀请链接打开 Chime 并完成 Checking 注册（必须用专属链接）。',
        '开户后 45 天内安排单笔 ≥$200 的合规 Direct Deposit（工资/福利等；P2P 通常不计）。',
        '合规 DD 到账后，在 14 个日历日内激活实体借记卡。',
        '三项完成后等待官方奖励入账（被邀请人通常 $100；邀请人金额看其当前 offer）。',
        '若本站有额外返现，达标后联系客服登记领取。',
      ],
      en: [
        'Open Chime Checking via our unique referral link.',
        'Receive one qualifying DD of $200+ within 45 days of opening.',
        'Activate the physical debit card within 14 calendar days after that DD.',
        'Wait for official bonuses (referee typically $100).',
        'Contact us if a site rebate is published for this deal.',
      ],
    },
    practicalSteps: {
      zh: [
        '提前准备 SSN 与美国手机号。',
        '多笔小额 DD 不会合并到 $200——必须单笔达标。',
        '条款以 Chime Help Center「Standard Referral Program」为准，活动可能调整。',
      ],
      en: [
        'Have SSN and a US phone ready.',
        'Multiple smaller deposits do not combine to $200.',
        'Official Chime Help Center terms prevail; offers can change.',
      ],
    },
    officialDetail: {
      zh: '官方条款摘要（Chime Help Center）：①专属邀请链接开 Checking；②开户后 45 天内单笔合规 DD≥$200；③该笔 DD 后 14 天内激活实体卡。被邀请人奖励常见为 $100；邀请人奖金随其 active offer 变化。银行互转与 P2P 一般不算合规 DD。',
      en: 'Official summary (Chime Help Center): unique link + Checking; single qualifying DD ≥$200 within 45 days; activate physical card within 14 days of that DD. Referee bonus commonly $100; referrer amount varies. Bank transfers/P2P usually do not qualify.',
    },
    siteRebateUsd: null,
    siteRebateLabel: { zh: '本站返现待公布', en: 'Site rebate TBD' },
  },
  {
    id: 'sofi',
    category: 'bank',
    displayGroup: 'bank-neobank',
    offerKind: 'refer',
    brandName: { zh: 'SoFi', en: 'SoFi' },
    highlightAmountUsd: 50,
    editions: [
      {
        id: 'sofi-2026-bank-referral',
        validFrom: '2026-01-01',
        validUntil: '2026-09-30',
        reward: { zh: '被邀请人约 $50', en: '~$50 for referee' },
        summary: {
          zh: '通过银行推荐链接开 SoFi Checking & Savings（须为首个 SoFi 产品）→ 在条款规定窗口内完成合资格入金（金额与窗口以官网当前条款为准，常见约 21 天）。',
          en: 'Open SoFi Checking & Savings via bank referral as your first SoFi product, then make eligible deposits within the window shown on SoFi’s current terms (often ~21 days).',
        },
        cardGuideBrief: {
          zh: '邀请链接开 Checking&Savings → 按官网窗口完成合资格入金 → 领约 $50。',
          en: 'Open Checking & Savings via referral → eligible deposits in-window → ~$50.',
        },
        cardExtraBrief: {
          zh: '条款常变（入金门槛曾调整）；以 sofi.com/offers/bank-referral 为准。',
          en: 'Terms change often (deposit minimums have moved); follow sofi.com/offers/bank-referral.',
        },
        requirements: {
          zh: [
            '须点击好友银行推荐链接，成功开通 SoFi Checking and Savings，且通常须为第一个 SoFi 产品',
            '在官方规定日历窗口内完成合资格入金并 settle（窗口与最低金额以当前条款为准；常见约 21 天）',
            '合资格入金通常包括 ACH、Direct Deposit、部分 Instant Transfer / 支票 / 电汇等；Venmo、Zelle、PayPal 等 P2P 一般排除',
            '被邀请人标准奖金常见约 $50；邀请人奖金可能按 SoFi Plus / DD / 入金档位变化（约 $75–$100 等，以官网为准）',
            '促销期与细则会更新，开户前务必阅读当前官方条款页',
          ],
          en: [
            'Open SoFi Checking and Savings via the bank referral link as a first SoFi product (per current rules)',
            'Eligible deposits must settle within the official calendar window (often ~21 days; confirm live terms)',
            'Eligible deposits typically include ACH, direct deposit, some instant/check/wire methods; P2P (Venmo/Zelle/PayPal etc.) is usually excluded',
            'Referee standard bonus is commonly about $50; referrer amounts may vary with SoFi Plus / DD tiers',
            'Promotion windows change—read the live SoFi bank referral terms before applying',
          ],
        },
        referralUrl: 'https://www.sofi.com/invite/your-code',
        officialUrl: 'https://www.sofi.com/offers/bank-referral/',
        tags: { zh: ['线上', '条款常变'], en: ['Online', 'Terms change'] },
        changeNote: {
          zh: '已按 SoFi Bank Referral 官方页改写：被邀请人约 $50 + 合资格入金窗口；不再沿用旧版 DD $1k/$5k→$50/$400 混写。',
          en: 'Rewritten from SoFi Bank Referral page: ~$50 referee + eligible deposit window; removed outdated $1k/$5k→$50/$400 mix-up.',
        },
      },
      {
        id: 'sofi-2025',
        validFrom: '2025-06-01',
        validUntil: '2025-12-31',
        reward: { zh: '被邀请人约 $50', en: '~$50 for referee' },
        summary: {
          zh: '历史档：银行推荐开户 + 合资格入金；细则以当时官网为准。',
          en: 'Historical: bank referral signup + eligible deposits under then-current terms.',
        },
        requirements: {
          zh: ['邀请链接开户', '合资格入金', '以当时官网为准'],
          en: ['Referral signup', 'Eligible deposits', 'Then-current official terms'],
        },
        referralUrl: 'https://www.sofi.com/invite/your-code',
        officialUrl: 'https://www.sofi.com/offers/bank-referral/',
        changeNote: {
          zh: '归档：旧数据曾误写高档 DD 开户奖，已与银行推荐计划区分。',
          en: 'Archived: older copy mixed in separate DD bonuses; now separated from bank referral.',
        },
      },
    ],
    officialDetail: {
      zh: '官方条款摘要（SoFi Bank Referral Program，sofi.com/offers/bank-referral）：被邀请人通过推荐链接开通 Checking & Savings（通常为首个 SoFi 产品），并在条款窗口内完成合资格入金后，可获标准奖金（常见约 $50）。入金方式与 P2P 排除规则、邀请人档位奖金、促销截止日期均以官网当前条款为准，近年曾调整最低入金门槛与促销期。',
      en: 'Official summary (SoFi Bank Referral): open Checking & Savings via referral (typically first SoFi product) and complete eligible deposits in-window for a standard bonus (commonly ~$50). Deposit methods, P2P exclusions, referrer tiers, and promo end dates follow live SoFi terms.',
    },
  },
  {
    id: 'revolut',
    category: 'bank',
    displayGroup: 'bank-neobank',
    offerKind: 'refer',
    brandName: { zh: 'Revolut', en: 'Revolut' },
    highlightAmountUsd: 40,
    siteRebateUsd: 40,
    siteRebateLabel: {
      zh: '本站返现 $40',
      en: '$40 site cashback',
    },
    editions: [
      {
        id: 'revolut-2026',
        validFrom: '2026-07-01',
        validUntil: null,
        reward: { zh: '官方邀请奖励 + 本站返现 $40', en: 'Official refer bonus + $40 site cashback' },
        summary: {
          zh: '通过邀请链接注册，Residence 选美国，充值 $40，订购 $2.99 实体卡并完成 3 笔 ≥$10 消费；官方奖励约 2 天到账，达标后联系本站领取 $40 返现。',
          en: 'Sign up via referral, select US residence, deposit $40, order the $2.99 card, and complete 3 purchases of $10+ each. Official reward ~2 days; contact us for $40 site cashback after qualifying.',
        },
        cardGuideBrief: {
          zh: '邀请链接注册（美区）→ 充值 $40 → 订 $2.99 实体卡 → 3 笔 ≥$10 消费。',
          en: 'US referral signup → deposit $40 → $2.99 card → 3× $10+ purchases.',
        },
        cardExtraBrief: {
          zh: '本站达标后返现 $40（与官方奖励分开领取）。',
          en: 'Site pays $40 after you qualify (separate from Revolut’s bonus).',
        },
        requirements: {
          zh: [
            '须通过本站邀请链接注册（活动码/campaign 以链接内参数为准）',
            'Residence 选择美国；须为符合当地 Revolut 服务的新用户',
            '充值至少 $40',
            '订购 $2.99 实体借记卡',
            '完成 3 笔单笔 ≥ $10 的真实刷卡消费（转账、部分礼品卡/排除类交易可能不计，以 App 活动条款为准）',
            '官方邀请奖励到账时间以 Revolut 通知为准（社区常见约数个工作日）',
            '达标后联系站长领取本站 $40 返现',
          ],
          en: [
            'Sign up via our referral link (campaign terms are embedded in the invite)',
            'Select United States residence; must be a new eligible Revolut user',
            'Deposit at least $40',
            'Order the $2.99 physical debit card',
            'Complete 3 genuine card purchases of $10+ each (transfers / some gift cards may be excluded—check in-app terms)',
            'Official reward timing follows Revolut notices',
            'Contact the site owner for $40 site cashback after qualifying',
          ],
        },
        referralUrl:
          'https://revolut.com/referral/?referral-code=jiajun_7r_l4pt!JUL2-26-AR-US-H1-REFBLOCK-AE&geo-redirect',
        officialUrl: 'https://www.revolut.com/legal/refer/',
        tags: { zh: ['线上', '需消费'], en: ['Online', 'Spending required'] },
        changeNote: {
          zh: '补充官方 refer 注意：须真实刷卡、排除类交易以 App 为准；本站返现 $40 单独配置展示金额。',
          en: 'Clarified official refer: genuine card spend; exclusions per in-app terms; site $40 is a manual highlight amount.',
        },
      },
    ],
    howToClaim: {
      zh: [
        '点击本站「打开邀请链接」进入 Revolut 注册（Join me and over 75 million users who love Revolut）。',
        '注册时 Residence 选择美国（United States），其余信息按真实情况正常填写。',
        '完成注册后向账户充值 $40。',
        '在卡片选项中选择 $2.99 的实体借记卡并完成订购。',
        '使用 Revolut 卡完成 3 笔单笔 ≥ $10 的消费（可分多天完成）。',
        '官方邀请奖励通常约 2 个工作日到账。',
        '完成上述条件后联系站长，领取本站承诺的 $40 返现。',
      ],
      en: [
        'Open our referral link to sign up for Revolut (Join over 75 million Revolut users).',
        'Select United States as your residence during signup; fill in the rest normally.',
        'Deposit at least $40 into your account.',
        'Choose and order the $2.99 physical debit card.',
        'Make 3 separate purchases of $10 or more each with your Revolut card.',
        'The official referral reward typically posts within about 2 business days.',
        'After completing all steps, contact the site owner to claim the $40 site cashback.',
      ],
    },
    practicalSteps: {
      zh: [
        '务必从本站邀请链接进入，否则 refer 可能不计入。',
        '充值 $40 后留足余额用于三笔 $10+ 消费及可能的卡费。',
        '消费可用日常购物、订阅等，确认每笔单笔金额 ≥ $10。',
        '官方奖励与本站 $40 返现分开发放：先等官方到账，再联系本站登记返现。',
      ],
      en: [
        'Always start from our referral link so the refer is tracked.',
        'Keep enough balance after the $40 deposit for three $10+ purchases and card fees.',
        'Everyday purchases count; each transaction must be at least $10.',
        'Official reward and site cashback are separate—claim site rebate after you qualify.',
      ],
    },
    officialDetail: {
      zh: '官方条款提示（Revolut Refer）：奖励与任务以 App 内当前邀请活动 / legal refer 页为准，常要求真实刷卡消费；账户转账、部分礼品卡或排除商户可能不计。地区、截止日与奖金随 campaign 变化。本站 $40 为额外返现，右上角金额为管理员配置，不等于官方奖金自动加总。',
      en: 'Official note (Revolut Refer): tasks and rewards follow the in-app invite / legal refer terms; genuine card spend is usually required, while transfers or some gift cards may be excluded. Campaigns vary by geo and date. The $40 site cashback and card highlight amount are admin-configured, not an auto-sum of official bonuses.',
    },
  },
  {
    id: 'capital-one-360',
    category: 'bank',
    displayGroup: 'bank-national',
    offerKind: 'refer',
    brandName: { zh: 'Capital One 360', en: 'Capital One 360' },
    highlightAmountUsd: 300,
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
        cardGuideBrief: {
          zh: '75 天内两笔 ≥$500 DD；奖励约 $300。',
          en: 'Two $500+ DD within 75 days; ~$300 bonus.',
        },
        cardExtraBrief: {
          zh: '到账周期较长，建议先读官方 Refer 页。',
          en: 'Longer posting window—read Capital One refer page.',
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
    highlightAmountUsd: 500,
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
        cardGuideBrief: {
          zh: '新 checking：90 天内 DD 分档，最高约 $500（无公开 refer）。',
          en: 'New checking: tiered DD in 90 days, up to ~$500 (no public refer).',
        },
        cardExtraBrief: {
          zh: '以 promotions.bankofamerica.com 当前活动页为准。',
          en: 'Follow the live Bank of America promotions page.',
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
    highlightAmountUsd: 400,
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
        cardGuideBrief: {
          zh: '线下开 Secure Checking：90 天内 DD $1,000 → 约 $400。',
          en: 'In-branch Secure Checking: $1,000 DD in 90 days → ~$400.',
        },
        cardExtraBrief: {
          zh: '需 DS-2019 + 护照 + SSN；24 岁以下常见免月费。',
          en: 'Bring DS-2019 + passport + SSN; fee waiver often under 24.',
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
    highlightAmountUsd: 325,
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
        cardGuideBrief: {
          zh: '60 天内完成 qualifying activities，奖励约 $325。',
          en: 'Qualifying activities within 60 days; ~$325 bonus.',
        },
        cardExtraBrief: {
          zh: '常需地址证明与实体 SSN；活动季更替快。',
          en: 'Address proof / physical SSN often needed; offers rotate.',
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
    highlightAmountUsd: 325,
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
        cardGuideBrief: {
          zh: '线下开户：90 天内 DD $1,000 → 约 $325。',
          en: 'In-branch: $1,000 DD in 90 days → ~$325.',
        },
        cardExtraBrief: {
          zh: '官方活动页可查条款，但通常须柜台开户。',
          en: 'Offer page for terms; opening is typically in-branch.',
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
    category: 'other',
    displayGroup: 'cashback',
    offerKind: 'refer',
    brandName: { zh: 'Rakuten', en: 'Rakuten' },
    highlightAmountUsd: 30,
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
        cardGuideBrief: {
          zh: '注册后经 Rakuten 跳转下单；新人欢迎奖约 $30。',
          en: 'Shop via Rakuten after signup; welcome ~$30.',
        },
        cardExtraBrief: {
          zh: '日常返现 2–15% 随商家变动。',
          en: 'Everyday cash back 2–15% varies by merchant.',
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
    highlightAmountUsd: 20,
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
        cardGuideBrief: {
          zh: '邀请链接注册：新人前两单各减 $10；邀请人最高 $20 积分。',
          en: 'Referral signup: $10 off first two orders; referrer up to $20 credit.',
        },
        cardExtraBrief: {
          zh: '被邀请人需在 14/30 天内完成合格配送单。',
          en: 'Invitee must place qualifying deliveries within 14/30 days.',
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
    category: 'other',
    displayGroup: 'promo-other',
    offerKind: 'promo',
    brandName: { zh: 'Total Wireless', en: 'Total Wireless' },
    highlightAmountUsd: 50,
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
        cardGuideBrief: {
          zh: '转网 + 指定套餐购 iPhone 13，首月成本约 $100。',
          en: 'Port-in + eligible plan for iPhone 13; ~$100 first month.',
        },
        cardExtraBrief: {
          zh: '解锁政策以运营商官网为准。',
          en: 'Unlock policy follows carrier terms.',
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
    displayGroup: 'ny-study',
    offerKind: 'refer',
    brandName: { zh: 'Utest 智能手环测试 ①', en: 'Utest Wearable Band Study 1' },
    highlightAmountUsd: 150,
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
        cardGuideBrief: {
          zh: '先注册拿 Utest ID，再报名约 3 小时手环测试，报酬约 $150。',
          en: 'Create Utest ID first, then apply for ~3h band study (~$150).',
        },
        cardExtraBrief: {
          zh: '建议提前 10–15 天申请；来源填朋友介绍。',
          en: 'Apply 10–15 days ahead; source = friend referral.',
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
    displayGroup: 'ny-study',
    offerKind: 'promo',
    brandName: { zh: '手环测试 ②', en: 'Wearable Band Study 2' },
    highlightAmountUsd: 225,
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
        cardGuideBrief: {
          zh: '线下手环测试约 3 小时，报酬约 $225；可能需电话确认。',
          en: 'In-person ~3h band study (~$225); phone confirmation may be required.',
        },
        cardExtraBrief: {
          zh: '留意陌生来电确认预约。',
          en: 'Watch for confirmation calls after applying.',
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
  {
    id: 'ny-test',
    category: 'other',
    displayGroup: 'ny-study',
    offerKind: 'promo',
    brandName: { zh: '纽约测试（站内演示）', en: 'NYC Test (demo)' },
    highlightAmountUsd: 50,
    siteRebateUsd: 5,
    siteRebateLabel: { zh: '约 $5 演示返现', en: 'About $5 demo rebate' },
    howToClaim: {
      zh: ['仅用于站内卡片与分类排序演示', '无需真实开户'],
      en: ['Demo card for layout testing only', 'No real signup required'],
    },
    practicalSteps: {
      zh: ['在管理后台可替换为真实纽约线下测试项目'],
      en: ['Replace with a real NYC study in admin when ready'],
    },
    editions: [
      {
        id: 'ny-test-2026',
        validFrom: '2026-01-01',
        validUntil: null,
        reward: { zh: '$50（演示）', en: '$50 (demo)' },
        summary: {
          zh: '纽约地区线下测试占位项目，与 Utest / 手环测试等同组展示。',
          en: 'Placeholder NYC in-person study; grouped with Utest / wearable studies.',
        },
        cardGuideBrief: {
          zh: '纽约线下测试占位演示卡片。',
          en: 'Placeholder NYC study demo card.',
        },
        cardExtraBrief: {
          zh: '约 $5 演示返现；非真实开户。',
          en: 'About $5 demo rebate; not a real signup.',
        },
        requirements: {
          zh: ['演示数据', '联系站长获取真实测试档期'],
          en: ['Demo data', 'Contact site owner for real study slots'],
        },
        tags: { zh: ['纽约', '演示'], en: ['New York', 'Demo'] },
      },
    ],
  },
  ...notionRemittancePrograms,
];
