import type { MarketUser } from '../marketplace/types';

export type SwtExperience = {
  id: string;
  programYear: string;
  workState: string;
  jobTitle: string;
  city?: string;
  employerHint?: string;
};

export type UserPublicProfile = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  /** @deprecated 兼容旧数据；优先用 swtExperiences */
  programYear: string;
  workState: string;
  jobTitle: string;
  /** 可参加多届 SWT，多条经历 */
  swtExperiences: SwtExperience[];
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

export function newExperienceId() {
  return `swt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyExperience(): SwtExperience {
  return {
    id: newExperienceId(),
    programYear: '',
    workState: '',
    jobTitle: '',
    city: '',
    employerHint: '',
  };
}

/** 旧单字段 → 多经历列表 */
export function normalizeExperiences(profile: Partial<UserPublicProfile> | null | undefined): SwtExperience[] {
  const list = Array.isArray(profile?.swtExperiences) ? profile!.swtExperiences : [];
  const cleaned = list
    .map((item) => ({
      id: item.id || newExperienceId(),
      programYear: String(item.programYear || '').slice(0, 16),
      workState: String(item.workState || '').slice(0, 8).toUpperCase(),
      jobTitle: String(item.jobTitle || '').slice(0, 128),
      city: String(item.city || '').slice(0, 64),
      employerHint: String(item.employerHint || '').slice(0, 128),
    }))
    .filter((e) => e.programYear || e.workState || e.jobTitle || e.city || e.employerHint);

  if (cleaned.length > 0) return cleaned;

  const year = String(profile?.programYear || '').trim();
  const state = String(profile?.workState || '').trim();
  const job = String(profile?.jobTitle || '').trim();
  if (year || state || job) {
    return [
      {
        id: newExperienceId(),
        programYear: year.slice(0, 16),
        workState: state.slice(0, 8).toUpperCase(),
        jobTitle: job.slice(0, 128),
        city: '',
        employerHint: '',
      },
    ];
  }
  return [];
}

export function syncLegacyFields(experiences: SwtExperience[]): Pick<UserPublicProfile, 'programYear' | 'workState' | 'jobTitle'> {
  const first = experiences[0];
  return {
    programYear: first?.programYear || '',
    workState: first?.workState || '',
    jobTitle: first?.jobTitle || '',
  };
}

export function formatExperienceLine(exp: SwtExperience): string {
  return [
    exp.programYear && `SWT ${exp.programYear}`,
    exp.workState,
    exp.city,
    exp.jobTitle,
    exp.employerHint,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function defaultProfile(userId: string, seed?: Partial<UserPublicProfile>): UserPublicProfile {
  const experiences = normalizeExperiences(seed);
  const legacy = syncLegacyFields(experiences);
  return {
    userId,
    displayName: seed?.displayName || (userId === 'dev-admin' ? '管理员' : 'SWT 用户'),
    avatarUrl: seed?.avatarUrl,
    bio: seed?.bio || '',
    programYear: legacy.programYear,
    workState: legacy.workState,
    jobTitle: legacy.jobTitle,
    swtExperiences: experiences,
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
  const normalized = {
    ...profile,
    swtExperiences: normalizeExperiences(profile),
    ...syncLegacyFields(normalizeExperiences(profile)),
  };
  if (isOwner) return normalized;
  return {
    ...normalized,
    wechat: normalized.showWechat ? normalized.wechat : '',
    email: normalized.showEmail ? normalized.email : '',
    programYear: normalized.showJobInfo ? normalized.programYear : '',
    workState: normalized.showJobInfo ? normalized.workState : '',
    jobTitle: normalized.showJobInfo ? normalized.jobTitle : '',
    swtExperiences: normalized.showJobInfo ? normalized.swtExperiences : [],
    bio: normalized.showBio ? normalized.bio : '',
  };
}

export function seedFromMarketUser(user: MarketUser): Partial<UserPublicProfile> {
  return {
    displayName: user.username && !/^\d+$/.test(user.username) ? user.username : undefined,
  };
}
