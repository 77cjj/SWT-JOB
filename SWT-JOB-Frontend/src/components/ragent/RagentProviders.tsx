"use client";

import { useEffect, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Toast } from "@/components/common/Toast";
import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";
import { useAuthStore } from "@/stores/authStore";
import { LoginDialog } from "../../components/ragent/LoginDialog";

type RagentProvidersProps = {
  children: ReactNode;
  /**
   * 嵌入主站时：不写 body[data-app=ragent]，主题与配色由主站 AppThemeProvider 统一提供。
   */
  embedded?: boolean;
};

export function RagentProviders({ children, embedded = false }: RagentProvidersProps) {
  useEffect(() => {
    useAuthStore.getState().checkAuth().catch(() => null);

    if (embedded) {
      return;
    }

    document.body.dataset.app = "ragent";
    delete document.body.dataset.theme;

    return () => {
      delete document.body.dataset.app;
    };
  }, [embedded]);

  return GOOGLE_CLIENT_ID ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        {children}
        <Toast />
        <LoginDialog />
      </ErrorBoundary>
    </GoogleOAuthProvider>
  ) : (
    <ErrorBoundary>
      {children}
      <Toast />
      <LoginDialog />
    </ErrorBoundary>
  );
}
