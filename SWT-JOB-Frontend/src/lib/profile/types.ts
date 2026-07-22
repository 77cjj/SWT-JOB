import type { MarketUser } from '../marketplace/types';

export type UserPublicProfile = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  programYear: string;
  workState: string;
  jobTitle: string;
  wechat: string;
  email: string;
  showWechat: boolean;
  showEmail: boolean;
  showJobInfo: boolean;
  showBio: boolean;
  updatedAt: string;
};

export type ProfileStoreData = {
  profiles: Record<string, UserPublicProfile>;
};

export function defaultProfile(userId: string, seed?: Partial<UserPublicProfile>): UserPublicProfile {
  return {
    userId,
    displayName: seed?.displayName || (userId === 'dev-admin' ? '管理员' : 'SWT 用户'),
    avatarUrl: seed?.avatarUrl,
    bio: seed?.bio || '',
    programYear: seed?.programYear || '',
    workState: seed?.workState || '',
    jobTitle: seed?.jobTitle || '',
    wechat: seed?.wechat || '',
    email: seed?.email || '',
    showWechat: seed?.showWechat ?? false,
    showEmail: seed?.showEmail ?? false,
    showJobInfo: seed?.showJobInfo ?? true,
    showBio: seed?.showBio ?? true,
    updatedAt: new Date().toISOString(),
  };
}

/** 对外可见字段（按隐私开关裁剪） */
export function toPublicView(profile: UserPublicProfile, isOwner: boolean): UserPublicProfile {
  if (isOwner) return profile;
  return {
    ...profile,
    wechat: profile.showWechat ? profile.wechat : '',
    email: profile.showEmail ? profile.email : '',
    programYear: profile.showJobInfo ? profile.programYear : '',
    workState: profile.showJobInfo ? profile.workState : '',
    jobTitle: profile.showJobInfo ? profile.jobTitle : '',
    bio: profile.showBio ? profile.bio : '',
  };
}

export function seedFromMarketUser(user: MarketUser): Partial<UserPublicProfile> {
  return {
    displayName: user.username && !/^\d+$/.test(user.username) ? user.username : undefined,
  };
}
