"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAuthStore } from "@/stores/authStore";
import { storage } from "@/utils/storage";
import { setAuthToken } from "@/services/api";

function decodeBase64Url(payload: string): string {
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? padded : padded + "=".repeat(4 - (padded.length % 4));
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(pad), (c: string) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("")
  );
}

/** Google / Apple / 微信 登录完成后统一落 session */
export default function OAuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const raw = typeof router.query.payload === "string" ? router.query.payload : "";
    if (!raw) {
      useAuthStore.getState().openLoginDialog("第三方登录未完成，请重试");
      void router.replace("/chat");
      return;
    }
    try {
      const json = JSON.parse(decodeBase64Url(raw)) as {
        userId?: string;
        username?: string;
        role?: string;
        token?: string;
        avatar?: string;
      };
      if (!json.token) {
        useAuthStore.getState().openLoginDialog("第三方登录未完成，请重试");
        void router.replace("/chat");
        return;
      }
      const user = {
        userId: json.userId || "",
        username: json.username || "user",
        role: json.role || "user",
        token: json.token,
        avatar: json.avatar,
      };
      storage.setToken(user.token);
      storage.setUser(user);
      setAuthToken(user.token);
      useAuthStore.setState({
        user,
        token: user.token,
        isAuthenticated: true,
        loginDialogOpen: false,
        loginDialogReason: null,
      });
      void useAuthStore.getState().fetchCurrentUser().catch(() => null);
      void router.replace("/chat");
    } catch {
      useAuthStore.getState().openLoginDialog("第三方登录未完成，请重试");
      void router.replace("/chat");
    }
  }, [router, router.isReady, router.query.payload]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
      正在完成登录…
    </div>
  );
}
