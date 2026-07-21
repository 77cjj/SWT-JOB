"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";
import { useAuthStore } from "@/stores/authStore";
import { Toast } from "@/components/common/Toast";
import { LoginDialog } from "./LoginDialog";

/**
 * 全站挂载登录弹窗与 Toast，使顶栏「请登录」在任意页面可用。
 * /login 仅负责打开弹窗并跳回；/admin、google-complete 不重复挂载弹窗。
 */
export function GlobalAuthShell() {
  const router = useRouter();

  useEffect(() => {
    useAuthStore.getState().checkAuth().catch(() => null);
  }, []);

  const skipLoginDialog =
    router.pathname === "/login" ||
    router.pathname.startsWith("/admin") ||
    router.pathname === "/auth/google-complete";

  const inner = (
    <>
      <Toast />
      {!skipLoginDialog ? <LoginDialog /> : null}
    </>
  );

  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}
