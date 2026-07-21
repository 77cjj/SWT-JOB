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
};

export function getDemoMember(id: string): DemoMember | null {
  return DEMO_MEMBERS[id] ?? null;
}
