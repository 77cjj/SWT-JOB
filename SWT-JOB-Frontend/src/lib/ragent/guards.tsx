"use client";

import { useRouter } from "next/router";
import { useEffect, type ReactNode } from "react";
import { RAGENT_ALLOW_LOGIN_PAGE } from "@/config/runtimeEnv";
import { useAuthStore } from "@/stores/authStore";

const allowLoginPageWhileAuthed = RAGENT_ALLOW_LOGIN_PAGE;

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!router.isReady) return;
    if (!isAuthenticated) {
      void router.replace("/login");
    }
  }, [router, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!router.isReady) return;
    if (!isAuthenticated) {
      void router.replace("/login");
      return;
    }
    if (user?.role !== "admin") {
      void router.replace("/chat");
    }
  }, [router, isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }
  return <>{children}</>;
}

export function RedirectIfAuthed({
  children,
  redirectTo = "/chat",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!router.isReady || allowLoginPageWhileAuthed) return;
    if (isAuthenticated) {
      void router.replace(redirectTo);
    }
  }, [router, isAuthenticated, redirectTo]);

  if (isAuthenticated && !allowLoginPageWhileAuthed) {
    return null;
  }
  return <>{children}</>;
}
