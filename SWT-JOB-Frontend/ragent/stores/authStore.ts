// @ts-nocheck
/* eslint-disable */

import { create } from "zustand";
import { toast } from "sonner";

import type { User } from "@/types";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  requestPasswordReset as requestPasswordResetApi,
} from "@/services/authService";
import { RAGENT_BYPASS_AUTH } from "@/config/runtimeEnv";
import { setAuthToken } from "@/services/api";
import { useChatStore } from "@/stores/chatStore";
import { storage } from "@/utils/storage";
import { getTranslation } from "../../src/i18n";
import { readUiLanguage } from "../../src/i18n/readUiLanguage";

export type AuthDialogMode = "login" | "register" | "forgot";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginDialogOpen: boolean;
  loginDialogReason: string | null;
  authDialogMode: AuthDialogMode;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  requestPasswordReset: (account: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  openLoginDialog: (reason?: string) => void;
  openRegisterDialog: (reason?: string) => void;
  setAuthDialogMode: (mode: AuthDialogMode) => void;
  closeLoginDialog: () => void;
}

function authT(key: string): string {
  const translation = getTranslation(readUiLanguage());
  const keys = key.split(".");
  let value: unknown = translation;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === "string" ? value : key;
}

function applyAuthSession(
  set: (partial: Partial<AuthState>) => void,
  data: { userId?: string; role?: string; token?: string; avatar?: string; username?: string },
  fallbackUsername: string,
) {
  const user = {
    userId: data.userId,
    username: data.username || fallbackUsername,
    role: data.role,
    token: data.token,
    avatar: data.avatar,
  };
  storage.setToken(user.token);
  storage.setUser(user);
  setAuthToken(user.token);
  set({ user, token: user.token, isAuthenticated: true });
  useChatStore.getState().cancelGeneration();
  useChatStore.setState({
    sessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    isCreatingNew: true,
    webSearchEnabled: false,
    thinkingStartAt: null,
    streamTaskId: null,
    streamAbort: null,
    streamingMessageId: null,
    cancelRequested: false,
  });
}

/** 仅在非生产环境且显式开启时，跳过真实登录校验。 */
const BYPASS_AUTH = RAGENT_BYPASS_AUTH;
const DEV_BYPASS_TOKEN = "local-dev-token";

export const useAuthStore = create<AuthState>((set, get) => ({
  user:
    storage.getUser() ||
    (BYPASS_AUTH
      ? {
          userId: "local-admin",
          username: "admin",
          role: "admin",
          token: DEV_BYPASS_TOKEN,
        }
      : null),
  token: storage.getToken() || (BYPASS_AUTH ? DEV_BYPASS_TOKEN : null),
  isAuthenticated: BYPASS_AUTH ? true : Boolean(storage.getToken()),
  isLoading: false,
  loginDialogOpen: false,
  loginDialogReason: null,
  authDialogMode: "login",
  openLoginDialog: (reason) => {
    set({
      loginDialogOpen: true,
      authDialogMode: "login",
      loginDialogReason: reason?.trim() || null,
    });
  },
  openRegisterDialog: (reason) => {
    set({
      loginDialogOpen: true,
      authDialogMode: "register",
      loginDialogReason: reason?.trim() || null,
    });
  },
  setAuthDialogMode: (mode) => {
    set({ authDialogMode: mode });
  },
  closeLoginDialog: () => {
    set({ loginDialogOpen: false, loginDialogReason: null, authDialogMode: "login" });
  },
  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await loginRequest(username, password);
      applyAuthSession(set, data, username);
      get().fetchCurrentUser().catch(() => null);
      toast.success(authT("auth.loginSuccess"), { position: "top-center" });
    } catch (error) {
      toast.error((error as Error).message || authT("auth.loginFailed"));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  register: async (username, password, email) => {
    set({ isLoading: true });
    try {
      const data = await registerRequest(username, password, email);
      applyAuthSession(set, data, username);
      get().fetchCurrentUser().catch(() => null);
      toast.success(authT("auth.registerSuccess"), { position: "top-center" });
    } catch (error) {
      toast.error((error as Error).message || authT("auth.registerFailed"));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  requestPasswordReset: async (account) => {
    set({ isLoading: true });
    try {
      const data = await requestPasswordResetApi(account);
      toast.message(data?.message || authT("auth.forgotPasswordToast"), { position: "top-center" });
    } catch (error) {
      toast.error((error as Error).message || authT("auth.forgotPasswordFailed"));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  googleLogin: async (idToken) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        message?: string;
        data?: { userId?: string; role?: string; token?: string; avatar?: string; username?: string };
      };
      if (!res.ok || !payload.ok || !payload.data?.token) {
        throw new Error(payload.message || "Google login failed");
      }
      applyAuthSession(set, payload.data, payload.data.userId || "user");
      get().fetchCurrentUser().catch(() => null);
      toast.success(authT("auth.loginSuccess"), { position: "top-center" });
    } catch (error) {
      toast.error((error as Error).message || authT("auth.loginFailed"));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore network errors on logout
    }
    useChatStore.getState().cancelGeneration();
    useChatStore.setState({
      sessions: [],
      currentSessionId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      isCreatingNew: false,
      webSearchEnabled: false,
      thinkingStartAt: null,
      streamTaskId: null,
      streamAbort: null,
      streamingMessageId: null,
      cancelRequested: false,
    });
    storage.clearAuth();
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
    toast.success(authT("common.logout"), { position: "top-center" });
  },
  checkAuth: async () => {
    if (BYPASS_AUTH) {
      const persistedToken = storage.getToken();
      const persistedUser = storage.getUser();
      if (persistedToken && persistedToken !== DEV_BYPASS_TOKEN) {
        setAuthToken(persistedToken);
        set({ token: persistedToken, user: persistedUser, isAuthenticated: true });
        await get().fetchCurrentUser();
        return;
      }
      const fallbackUser = storage.getUser() || {
        userId: "local-admin",
        username: "admin",
        role: "admin",
        token: DEV_BYPASS_TOKEN,
      };
      const fallbackToken = storage.getToken() || DEV_BYPASS_TOKEN;
      storage.setUser(fallbackUser);
      storage.setToken(fallbackToken);
      setAuthToken(fallbackToken);
      set({ token: fallbackToken, user: fallbackUser, isAuthenticated: true });
      return;
    }

    const token = storage.getToken();
    const user = storage.getUser();
    setAuthToken(token);
    set({ token, user, isAuthenticated: Boolean(token) });
    if (token) {
      await get().fetchCurrentUser();
    }
  },
  fetchCurrentUser: async () => {
    const token = get().token || storage.getToken();
    if (!token) return;
    try {
      const data = await getCurrentUser();
      const nextUser = { ...data, token };
      storage.setUser(nextUser);
      set({ user: nextUser, token, isAuthenticated: true });
    } catch {
      if (BYPASS_AUTH) return;
      storage.clearAuth();
      setAuthToken(null);
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
  },
}));
