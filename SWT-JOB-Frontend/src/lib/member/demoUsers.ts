export type DemoMember = {
  id: string;
  displayName: string;
  avatarColor: string;
  programYear: string;
  workState: string;
  jobTitle?: string;
  badge?: 'contributor' | 'verified' | 'alumni';
  bio: string;
  joinedAt: string;
  contributionCount: number;
};

export const DEMO_MEMBERS: Record<string, DemoMember> = {
  'official-swt': {
    id: 'official-swt',
    displayName: 'SWT-JOB 官方',
    avatarColor: '#4f46e5',
    programYear: '—',
    workState: 'US',
    badge: 'verified',
    bio: '平台运营与审核团队。录入经交叉核验的公开岗位情报，可在主页留言联系。',
    joinedAt: '2024-01-01',
    contributionCount: 48,
  },
  'u-maya-2025': {
    id: 'u-maya-2025',
    displayName: 'Maya L.',
    avatarColor: '#6366f1',
    programYear: '2025',
    workState: 'NJ',
    jobTitle: 'Boardwalk Server',
    badge: 'verified',
    bio: '2025 SWT · Atlantic City 餐饮岗。分享面试口语与二工排班经验。',
    joinedAt: '2024-11-02',
    contributionCount: 12,
  },
  'u-alex-2024': {
    id: 'u-alex-2024',
    displayName: 'Alex Chen',
    avatarColor: '#0ea5e9',
    programYear: '2024',
    workState: 'WI',
    jobTitle: 'Resort Housekeeper',
    badge: 'contributor',
    bio: 'Dells 度假村一工 + 二工便利店。擅长住宿成本与工时记录。',
    joinedAt: '2024-09-18',
    contributionCount: 8,
  },
  'u-sam-2025': {
    id: 'u-sam-2025',
    displayName: 'Sam W.',
    avatarColor: '#10b981',
    programYear: '2025',
    workState: 'AK',
    jobTitle: 'Lifeguard',
    badge: 'alumni',
    bio: '阿拉斯加水上乐园救生员。关注签证材料与 Sponsor 沟通节奏。',
    joinedAt: '2024-10-05',
    contributionCount: 5,
  },
  'u-jordan-2023': {
    id: 'u-jordan-2023',
    displayName: 'Jordan K.',
    avatarColor: '#f97316',
    programYear: '2023',
    workState: 'FL',
    jobTitle: 'Retail Associate',
    badge: 'contributor',
    bio: 'Orlando 奥特莱斯 + 二工餐饮。熟悉开户奖励与 DD 规则。',
    joinedAt: '2023-08-12',
    contributionCount: 9,
  },
  'u-lily-2026': {
    id: 'u-lily-2026',
    displayName: 'Lily Zhang',
    avatarColor: '#ec4899',
    programYear: '2026',
    workState: 'CA',
    jobTitle: 'Host / Server',
    badge: 'verified',
    bio: '准备中的 2026 SWT，正在选岗与练面试口语。',
    joinedAt: '2025-09-01',
    contributionCount: 3,
  },
  'u-park-2024': {
    id: 'u-park-2024',
    displayName: 'Park H.',
    avatarColor: '#8b5cf6',
    programYear: '2024',
    workState: 'NY',
    jobTitle: 'Hotel Staff',
    badge: 'alumni',
    bio: 'NYC 酒店岗，分享工时记录与 OT 审批经验。',
    joinedAt: '2024-07-20',
    contributionCount: 7,
  },
  'u-min-2025': {
    id: 'u-min-2025',
    displayName: 'Min Liu',
    avatarColor: '#14b8a6',
    programYear: '2025',
    workState: 'TX',
    jobTitle: 'Theme Park',
    badge: 'contributor',
    bio: 'San Antonio 主题公园，关注时间线与入境材料。',
    joinedAt: '2024-12-10',
    contributionCount: 4,
  },
};

export function getDemoMember(id: string): DemoMember | null {
  return DEMO_MEMBERS[id] ?? null;
}
