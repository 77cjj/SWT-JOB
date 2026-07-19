import type { ProfileVisibility, UserProfile } from './types';

const STORAGE_KEY = 'swt-user-profiles-v1';

function readAll(): Record<string, UserProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserProfile>;
  } catch {
    return {};
  }
}

function writeAll(profiles: Record<string, UserProfile>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getUserProfile(userId: string): UserProfile | null {
  return readAll()[userId] ?? null;
}

export function saveUserProfile(profile: UserProfile) {
  const all = readAll();
  all[profile.userId] = profile;
  writeAll(all);
}

export function createDefaultProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  profileVisibility?: ProfileVisibility;
}): UserProfile {
  const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
  const color = palette[input.userId.length % palette.length];
  return {
    userId: input.userId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    avatarColor: color,
    bio: '',
    email: input.email,
    profileVisibility: input.profileVisibility ?? 'consent',
    joinedAt: new Date().toISOString().slice(0, 10),
    contributionCount: 0,
  };
}

export function upsertProfileFromAuth(input: {
  userId: string;
  username?: string;
  avatar?: string;
  email?: string;
}): UserProfile {
  const existing = getUserProfile(input.userId);
  if (existing) {
    const next: UserProfile = {
      ...existing,
      displayName: existing.displayName || input.username || '用户',
      avatarUrl: input.avatar || existing.avatarUrl,
      email: input.email || existing.email,
    };
    saveUserProfile(next);
    return next;
  }
  const created = createDefaultProfile({
    userId: input.userId,
    displayName: input.username || '用户',
    avatarUrl: input.avatar,
    email: input.email,
  });
  saveUserProfile(created);
  return created;
}
