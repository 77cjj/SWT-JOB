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

export default function GoogleCompletePage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const raw = typeof router.query.payload === "string" ? router.query.payload : "";
    if (!raw) {
      void router.replace("/login");
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
        void router.replace("/login");
        return;
      }
      const user = {
        userId: json.userId || "",
        username: json.username || "google",
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
      void router.replace("/chat");
    } catch {
      void router.replace("/login");
    }
  }, [router, router.isReady, router.query.payload]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
      正在完成 Google 登录…
    </div>
  );
}
