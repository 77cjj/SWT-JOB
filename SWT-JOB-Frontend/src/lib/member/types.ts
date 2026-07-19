/** consent = 仅经本人同意才展示联系方式；public = 主页直接展示手机/邮箱等 */
export type ProfileVisibility = 'consent' | 'public';

export type MemberBadge = 'contributor' | 'verified' | 'alumni';

/** 用户可编辑的完整资料（含隐私设置） */
export type UserProfile = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  bio: string;
  programYear?: string;
  workState?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  profileVisibility: ProfileVisibility;
  badge?: MemberBadge;
  joinedAt: string;
  contributionCount: number;
};

/** 对外展示的资料视图（已按隐私规则过滤） */
export type PublicMemberView = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarColor: string;
  bio: string;
  programYear?: string;
  workState?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  profileVisibility: ProfileVisibility;
  badge?: MemberBadge;
  joinedAt: string;
  contributionCount: number;
  contactHidden: boolean;
};

export type RegisterFormData = {
  username: string;
  password: string;
  displayName?: string;
  programYear?: string;
  workState?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  profileVisibility: ProfileVisibility;
};

export type GoogleOAuthProfile = {
  sub: string;
  name: string;
  email?: string;
  picture?: string;
};
