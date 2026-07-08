export type MemberProfile = {
  userId: string;
  workState: string;
  programYear: string;
  verifiedAt: string;
};

const STORAGE_PREFIX = 'swt-member-profile';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function readMemberProfile(userId: string): MemberProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MemberProfile;
    if (parsed.userId !== userId || !parsed.workState || !parsed.programYear) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMemberProfile(profile: MemberProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(profile.userId), JSON.stringify(profile));
}

export function isMemberProfileComplete(profile: MemberProfile | null): profile is MemberProfile {
  return Boolean(profile?.workState && profile?.programYear && profile?.verifiedAt);
}

export const US_STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
] as const;
