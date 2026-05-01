// @ts-nocheck
/* eslint-disable */

import { create } from "zustand";
import { toast } from "sonner";

import type { User } from "@/types";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "@/services/authService";
import { setAuthToken } from "@/services/api";
import { useChatStore } from "@/stores/chatStore";
import { storage } from "@/utils/storage";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

/** 仅当设置 NEXT_PUBLIC_RAGENT_BYPASS_AUTH=true 时跳过真实登录校验（开发调试用）。 */
const BYPASS_AUTH =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RAGENT_BYPASS_AUTH === 'true';

export const useAuthStore = create<AuthState>((set, get) => ({
  user:
    storage.getUser() ||
    (BYPASS_AUTH
      ? {
          userId: "local-admin",
          username: "admin",
          role: "admin",
          token: "local-dev-token",
        }
      : null),
  token: storage.getToken() || (BYPASS_AUTH ? "local-dev-token" : null),
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
        avatar: data.avatar
      };
      storage.setToken(user.token);
      storage.setUser(user);
      setAuthToken(user.token);
      set({ user, token: user.token, isAuthenticated: true });
      get().fetchCurrentUser().catch(() => null);
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
        cancelRequested: false
      });
      toast.success("登录成功");
    } catch (error) {
      toast.error((error as Error).message || "登录失败");
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
      deepThinkingEnabled: false,
      thinkingStartAt: null,
      streamTaskId: null,
      streamAbort: null,
      streamingMessageId: null,
      cancelRequested: false
    });
    storage.clearAuth();
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
    toast.success("已退出登录");
  },
  checkAuth: async () => {
    if (BYPASS_AUTH) {
      const fallbackUser = storage.getUser() || {
        userId: "local-admin",
        username: "admin",
        role: "admin",
        token: "local-dev-token",
      };
      const fallbackToken = storage.getToken() || "local-dev-token";
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
      return;
    }
  }
}));
