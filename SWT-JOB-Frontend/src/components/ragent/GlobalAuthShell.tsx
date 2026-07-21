"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";
import { useAuthStore } from "@/stores/authStore";
import { Toast } from "@/components/common/Toast";
import { LoginDialog } from "./LoginDialog";

/** 全站登录弹窗 + Toast；/login 路由仅负责打开弹窗并跳回，不再使用全屏登录页 */
export function GlobalAuthShell() {
  const router = useRouter();

  useEffect(() => {
    useAuthStore.getState().checkAuth().catch(() => null);
  }, []);

  const skipDialog =
    router.pathname === "/auth/google-complete" || router.pathname.startsWith("/admin");

  const inner = (
    <>
      <Toast />
      {!skipDialog ? <LoginDialog /> : null}
    </>
  );

  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}
