import { api } from "@/services/api";
import type { CurrentUser, User } from "@/types";

export interface LoginResponse extends User {}
export interface CurrentUserResponse extends CurrentUser {}

export async function login(username: string, password: string) {
  return api.post<LoginResponse>("/auth/login", { username, password });
}

export async function register(username: string, password: string, email: string) {
  return api.post<LoginResponse>("/auth/register", { username, password, email });
}

export async function requestPasswordReset(account: string) {
  return api.post<{ mailConfigured?: boolean; accepted?: boolean; message?: string }>(
    "/auth/forgot-password",
    { account },
  );
}

export async function loginWithGoogle(idToken: string) {
  return api.post<LoginResponse>("/auth/google", { idToken });
}

export async function logout() {
  return api.post<void>("/auth/logout");
}

export async function getCurrentUser() {
  return api.get<CurrentUserResponse>("/user/me");
}
