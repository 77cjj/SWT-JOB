import type { MarketListing } from './types';
import { calcListingEscrow } from './wallet';

const SEED_MARKER = 'lst_seed_';

export const DEMO_SELLER_ID = 'demo_swt_alumni';

function seedReferListing(
  id: string,
  partial: Pick<
    MarketListing,
    | 'title'
    | 'description'
    | 'brand'
    | 'referLink'
    | 'referCode'
    | 'platformReward'
    | 'buyerCashback'
    | 'completionCriteria'
    | 'maxSlots'
    | 'slotsUsed'
    | 'sellerName'
  >,
  createdAt: string,
): MarketListing {
  const { escrowPerSlot, buyerPayPerSlot } = calcListingEscrow(
    'refer',
    partial.buyerCashback ?? 0,
    partial.maxSlots,
  );
  return {
    id,
    type: 'refer',
    sellerId: DEMO_SELLER_ID,
    sellerName: partial.sellerName,
    title: partial.title,
    description: partial.description,
    brand: partial.brand,
    referLink: partial.referLink,
    referCode: partial.referCode,
    platformReward: partial.platformReward,
    buyerCashback: partial.buyerCashback,
    completionCriteria: partial.completionCriteria,
    escrowPerSlot,
    buyerPayPerSlot,
    priceCurrency: 'USD',
    maxSlots: partial.maxSlots,
    slotsUsed: partial.slotsUsed,
    status: 'active',
    createdAt,
    updatedAt: createdAt,
  };
}

function seedJobIntelListing(
  id: string,
  partial: Pick<
    MarketListing,
    | 'title'
    | 'description'
    | 'state'
    | 'city'
    | 'jobTitle'
    | 'employerHint'
    | 'intelFee'
    | 'intelPreview'
    | 'intelDetail'
    | 'maxSlots'
    | 'slotsUsed'
    | 'sellerName'
  >,
  createdAt: string,
): MarketListing {
  const { escrowPerSlot, buyerPayPerSlot } = calcListingEscrow(
    'job_intel',
    partial.intelFee ?? 0,
    partial.maxSlots,
  );
  return {
    id,
    type: 'job_intel',
    sellerId: DEMO_SELLER_ID,
    sellerName: partial.sellerName,
    title: partial.title,
    description: partial.description,
    state: partial.state,
    city: partial.city,
    jobTitle: partial.jobTitle,
    employerHint: partial.employerHint,
    intelFee: partial.intelFee,
    intelPreview: partial.intelPreview,
    intelDetail: partial.intelDetail,
    escrowPerSlot,
    buyerPayPerSlot,
    priceCurrency: 'USD',
    maxSlots: partial.maxSlots,
    slotsUsed: partial.slotsUsed,
    status: 'active',
    createdAt,
    updatedAt: createdAt,
  };
}

export function buildSeedListings(): Record<string, MarketListing> {
  const t1 = '2026-05-12T10:00:00.000Z';
  const t2 = '2026-05-08T14:30:00.000Z';
  const t3 = '2026-04-28T09:15:00.000Z';
  const t4 = '2026-04-20T16:45:00.000Z';

  return {
    [`${SEED_MARKER}chime`]: seedReferListing(
      `${SEED_MARKER}chime`,
      {
        sellerName: 'Mike · 24 SWT',
        title: 'Chime 开户返现 $40',
        description: '用我的链接开户，45 天内 DD ≥$200 并激活实体卡后，我 Zelle 返你 $40。',
        brand: 'chime',
        referLink: 'https://chime.com/r/demo-mike',
        referCode: 'MIKE-SWT',
        platformReward: 100,
        buyerCashback: 40,
        completionCriteria: 'DD 到账截图 + 实体卡激活确认，通常 7–14 天',
        maxSlots: 3,
        slotsUsed: 1,
      },
      t1,
    ),
    [`${SEED_MARKER}sofi`]: seedReferListing(
      `${SEED_MARKER}sofi`,
      {
        sellerName: 'Lisa · NJ',
        title: 'SoFi 邀请返现 $80',
        description: '25 天内 DD $1,000 可拿官方奖励；我额外返 $80，需走我的 invite 链接。',
        brand: 'sofi',
        referLink: 'https://www.sofi.com/invite/demo-lisa',
        platformReward: 400,
        buyerCashback: 80,
        completionCriteria: 'SoFi 账户 DD 达标截图，奖励到账后 3 日内返现',
        maxSlots: 2,
        slotsUsed: 0,
      },
      t2,
    ),
    [`${SEED_MARKER}nj_boardwalk`]: seedJobIntelListing(
      `${SEED_MARKER}nj_boardwalk`,
      {
        sellerName: 'Boardwalk 情报',
        title: 'NJ Wildwood 餐饮前台',
        description: '24 季实地做过，雇主稳定、二工机会中等，适合想练口语的同学。',
        state: 'NJ',
        city: 'Wildwood',
        jobTitle: 'Boardwalk 餐饮前台',
        employerHint: 'Wildwood Boardwalk 某海鲜餐厅',
        intelFee: 12,
        intelPreview: '时薪 $14.5 + 小费，包住每周扣 $95，步行 8 分钟到海边…',
        intelDetail:
          '雇主全名：Blue Crab Shack LLC。HR 邮箱与内推渠道见站内私信。二工：隔壁 arcade 周末可排班。注意：7 月旺季工时可达 55h/周。',
        maxSlots: 5,
        slotsUsed: 2,
      },
      t3,
    ),
    [`${SEED_MARKER}orlando_lifeguard`]: seedJobIntelListing(
      `${SEED_MARKER}orlando_lifeguard`,
      {
        sellerName: 'FL 泳池组',
        title: 'Orlando 社区泳池 Lifeguard',
        description: '持证岗位，工时稳定；雇主对 SWT 学生友好，但住宿需自理。',
        state: 'FL',
        city: 'Orlando',
        jobTitle: 'Lifeguard',
        employerHint: 'Kissimmee 某 HOA 泳池管理公司',
        intelFee: 15,
        intelPreview: '时薪 $16，无住宿；需 Red Cross 证（可入职前考取）…',
        intelDetail:
          '雇主：SunSplash Pool Mgmt。联系人：现场主管 Maria。内推：邮件主题写 SWT 2026 + 姓名。通勤：建议合租 Kissimmee，月租约 $650/床。',
        maxSlots: 3,
        slotsUsed: 0,
      },
      t4,
    ),
  };
}

export function isSeedListing(id: string) {
  return id.startsWith(SEED_MARKER);
}
