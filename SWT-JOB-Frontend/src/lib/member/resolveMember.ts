import { getDemoMember, type DemoMember } from './demoUsers';
import { getUserProfile } from './userProfiles';
import type { PublicMemberView, UserProfile } from './types';

function demoToProfile(member: DemoMember): UserProfile {
  return {
    userId: member.id,
    displayName: member.displayName,
    avatarColor: member.avatarColor,
    bio: member.bio,
    programYear: member.programYear,
    workState: member.workState,
    jobTitle: member.jobTitle,
    profileVisibility: member.profileVisibility ?? 'consent',
    phone: member.phone,
    email: member.email,
    badge: member.badge,
    joinedAt: member.joinedAt,
    contributionCount: member.contributionCount,
  };
}

export function resolveUserProfile(userId: string): UserProfile | null {
  const stored = getUserProfile(userId);
  if (stored) return stored;
  const demo = getDemoMember(userId);
  if (demo) return demoToProfile(demo);
  return null;
}

/** 按隐私规则生成对外可见资料；viewerId 为当前访客，owner 本人可见全部 */
export function toPublicMemberView(
  profile: UserProfile,
  viewerId?: string | null,
): PublicMemberView {
  const isOwner = Boolean(viewerId && viewerId === profile.userId);
  const showContact =
    isOwner || profile.profileVisibility === 'public';

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    avatarColor: profile.avatarColor,
    bio: profile.bio,
    programYear: profile.programYear,
    workState: profile.workState,
    jobTitle: profile.jobTitle,
    phone: showContact ? profile.phone : undefined,
    email: showContact ? profile.email : undefined,
    wechat: showContact ? profile.wechat : undefined,
    profileVisibility: profile.profileVisibility,
    badge: profile.badge,
    joinedAt: profile.joinedAt,
    contributionCount: profile.contributionCount,
    contactHidden: !showContact && profile.profileVisibility === 'consent',
  };
}

export function getPublicMember(userId: string, viewerId?: string | null): PublicMemberView | null {
  const profile = resolveUserProfile(userId);
  if (!profile) return null;
  return toPublicMemberView(profile, viewerId);
}
