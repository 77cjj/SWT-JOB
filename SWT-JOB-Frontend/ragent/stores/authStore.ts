// @ts-nocheck
/* eslint-disable */

import { create } from "zustand";
import { toast } from "sonner";

import type { User } from "@/types";
import type { RegisterFormData } from "../../src/lib/member/types";
import {
  getCurrentUser,
  login as loginRequest,
  loginWithGoogleIdToken,
  logout as logoutRequest,
  register as registerRequest,
} from "@/services/authService";
import { updateMyProfile } from "@/services/profileService";
import { RAGENT_BYPASS_AUTH } from "@/config/runtimeEnv";
import { setAuthToken } from "@/services/api";
import { useChatStore } from "@/stores/chatStore";
import { storage } from "@/utils/storage";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  /** 传入 Google Identity Services 返回的 ID Token（credential） */
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  refreshQuota: () => Promise<void>;
}

/** 仅在非生产环境且显式开启时，跳过真实登录校验。 */
const BYPASS_AUTH = RAGENT_BYPASS_AUTH;
const DEV_BYPASS_TOKEN = "local-dev-token";

function resetChatStore() {
  useChatStore.getState().cancelGeneration();
  useChatStore.setState({
    sessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    isCreatingNew: true,
    deepThinkingEnabled: false,
    thinkingStartAt: null,
    streamTaskId: null,
    streamAbort: null,
    streamingMessageId: null,
    cancelRequested: false,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:
    storage.getUser() ||
    (BYPASS_AUTH
      ? {
          userId: "local-admin",
          username: "admin",
          role: "admin",
          token: DEV_BYPASS_TOKEN,
          aiQuotaTotal: null,
          aiQuotaRemaining: null,
        }
      : null),
  token: storage.getToken() || (BYPASS_AUTH ? DEV_BYPASS_TOKEN : null),
  isAuthenticated: BYPASS_AUTH ? true : Boolean(storage.getToken()),
  isLoading: false,
  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const data = await loginRequest(username, password);
      const user = {
        userId: data.userId,
        username: data.username || username,
        role: data.role,
        token: data.token,
        avatar: data.avatar,
      };
      storage.setToken(user.token);
      storage.setUser(user);
      setAuthToken(user.token);
      set({ user, token: user.token, isAuthenticated: true });
      get().fetchCurrentUser().catch(() => null);
      resetChatStore();
      toast.success("登录成功");
    } catch (error) {
      toast.error((error as Error).message || "登录失败");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  register: async (data) => {
    set({ isLoading: true });
    try {
      const result = await registerRequest({
        username: data.username.trim(),
        password: data.password,
      });
      const user = {
        userId: result.userId,
        username: data.displayName?.trim() || data.username.trim(),
        role: result.role,
        token: result.token,
        avatar: result.avatar,
        aiQuotaTotal: 3,
        aiQuotaRemaining: 3,
      };
      storage.setToken(user.token);
      storage.setUser(user);
      setAuthToken(user.token);
      set({ user, token: user.token, isAuthenticated: true });
      await updateMyProfile({
        displayName: data.displayName?.trim() || data.username.trim(),
        programYear: data.programYear,
        workState: data.workState,
        jobTitle: data.jobTitle,
        phone: data.phone,
        email: data.email,
        wechat: data.wechat,
        profileVisibility: data.profileVisibility,
      }).catch(() => null);
      get().fetchCurrentUser().catch(() => null);
      resetChatStore();
      toast.success("注册成功");
    } catch (error) {
      toast.error((error as Error).message || "注册失败");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const data = await loginWithGoogleIdToken(idToken);
      const user = {
        userId: data.userId,
        username: data.username,
        role: data.role,
        token: data.token,
        avatar: data.avatar,
      };
      storage.setToken(user.token);
      storage.setUser(user);
      setAuthToken(user.token);
      set({ user, token: user.token, isAuthenticated: true });
      get().fetchCurrentUser().catch(() => null);
      resetChatStore();
      toast.success("Google 登录成功");
    } catch (error) {
      toast.error((error as Error).message || "Google 登录失败");
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
    resetChatStore();
    useChatStore.setState({ isCreatingNew: false });
    storage.clearAuth();
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
    toast.success("已退出登录");
  },
  checkAuth: async () => {
    if (BYPASS_AUTH) {
      const persistedToken = storage.getToken();
      const persistedUser = storage.getUser();
      // 开启 bypass 时，若已有真实登录态，不要再用本地假 token 覆盖，避免登录后立即掉线。
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
        aiQuotaTotal: null,
        aiQuotaRemaining: null,
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
      const nextUser = {
        ...data,
        token,
        aiQuotaTotal: data.aiQuotaTotal ?? null,
        aiQuotaRemaining: data.aiQuotaRemaining ?? null,
      };
      storage.setUser(nextUser);
      set({ user: nextUser, token, isAuthenticated: true });
    } catch {
      storage.clearAuth();
      setAuthToken(null);
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
  },
  refreshQuota: async () => {
    if (!get().isAuthenticated) return;
    await get().fetchCurrentUser();
  },
}));
