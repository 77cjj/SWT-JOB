import type { MemberBadge, ProfileVisibility } from './types';

export type DemoMember = {
  id: string;
  displayName: string;
  avatarColor: string;
  avatarUrl?: string;
  programYear: string;
  workState: string;
  jobTitle?: string;
  badge?: MemberBadge;
  bio: string;
  joinedAt: string;
  contributionCount: number;
  profileVisibility?: ProfileVisibility;
  phone?: string;
  email?: string;
  wechat?: string;
};

export const DEMO_MEMBERS: Record<string, DemoMember> = {
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
    profileVisibility: 'public',
    email: 'maya.demo@example.com',
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
    profileVisibility: 'consent',
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
    profileVisibility: 'consent',
  },
  'u-swt-wf-2026': {
    id: 'u-swt-wf-2026',
    displayName: 'J. (2026 SWT)',
    avatarColor: '#8b5cf6',
    programYear: '2026',
    workState: 'NJ',
    jobTitle: 'Boardwalk 一工',
    badge: 'contributor',
    bio: '2026 SWT · 分享银行开户与 fake DD 实操经历。',
    joinedAt: '2026-07-01',
    contributionCount: 1,
    profileVisibility: 'consent',
  },
};

export function getDemoMember(id: string): DemoMember | null {
  return DEMO_MEMBERS[id] ?? null;
}
