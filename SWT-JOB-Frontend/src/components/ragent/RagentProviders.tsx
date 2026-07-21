"use client";

import { useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useAuthStore } from "@/stores/authStore";

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

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
