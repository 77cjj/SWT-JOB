"use client";

import { useEffect, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useAuthStore } from "@/stores/authStore";

type RagentProvidersProps = {
  children: ReactNode;
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
