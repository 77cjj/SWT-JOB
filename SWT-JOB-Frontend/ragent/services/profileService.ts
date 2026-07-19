import { api } from '@/services/api';
import type { ProfileVisibility } from '../../src/lib/member/types';

export interface UserProfileApi {
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
  badge?: string;
  contributionCount: number;
  joinedAt?: string;
  contactHidden: boolean;
}

export type UserProfileUpdatePayload = {
  displayName?: string;
  avatarColor?: string;
  bio?: string;
  programYear?: string;
  workState?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  wechat?: string;
  profileVisibility?: ProfileVisibility;
};

export async function fetchMyProfile() {
  return api.get<UserProfileApi>('/user/profile/me');
}

export async function updateMyProfile(payload: UserProfileUpdatePayload) {
  return api.put<UserProfileApi, UserProfileApi>('/user/profile/me', payload);
}

export async function fetchUserProfile(userId: string, authenticated: boolean) {
  if (authenticated) {
    return api.get<UserProfileApi>(`/user/profile/${userId}`);
  }
  return api.get<UserProfileApi>(`/public/user-profiles/${userId}`);
}
