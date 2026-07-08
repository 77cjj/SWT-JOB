"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { DashboardPage } from "@/pages/admin/dashboard/DashboardPage";
import { IngestionPage } from "@/pages/admin/ingestion/IngestionPage";
import { IntentEditPage } from "@/pages/admin/intent-tree/IntentEditPage";
import { IntentListPage } from "@/pages/admin/intent-tree/IntentListPage";
import { IntentTreePage } from "@/pages/admin/intent-tree/IntentTreePage";
import { KnowledgeChunksPage } from "@/pages/admin/knowledge/KnowledgeChunksPage";
import { KnowledgeDocumentsPage } from "@/pages/admin/knowledge/KnowledgeDocumentsPage";
import { KnowledgeListPage } from "@/pages/admin/knowledge/KnowledgeListPage";
import { QueryTermMappingPage } from "@/pages/admin/query-term-mapping/QueryTermMappingPage";
import { SampleQuestionPage } from "@/pages/admin/sample-questions/SampleQuestionPage";
import { SystemSettingsPage } from "@/pages/admin/settings/SystemSettingsPage";
import { RagTraceDetailPage } from "@/pages/admin/traces/RagTraceDetailPage";
import { RagTracePage } from "@/pages/admin/traces/RagTracePage";
import { UserListPage } from "@/pages/admin/users/UserListPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function resolveAdminPage(segments: string[]): ReactNode {
  if (segments.length === 0) {
    return null;
  }
  const [a, , c] = segments;

  switch (a) {
    case "dashboard":
      return segments.length === 1 ? <DashboardPage /> : <NotFoundPage />;
    case "knowledge":
      if (segments.length === 1) {
        return <KnowledgeListPage />;
      }
      if (segments.length === 2) {
        return <KnowledgeDocumentsPage />;
      }
      if (segments.length === 4 && c === "docs") {
        return <KnowledgeChunksPage />;
      }
      return <NotFoundPage />;
    case "intent-tree":
      return segments.length === 1 ? <IntentTreePage /> : <NotFoundPage />;
    case "intent-list":
      if (segments.length === 1) {
        return <IntentListPage />;
      }
      if (segments.length === 3 && c === "edit") {
        return <IntentEditPage />;
      }
      return <NotFoundPage />;
    case "ingestion":
      return segments.length === 1 ? <IngestionPage /> : <NotFoundPage />;
    case "traces":
      if (segments.length === 1) {
        return <RagTracePage />;
      }
      if (segments.length === 2) {
        return <RagTraceDetailPage />;
      }
      return <NotFoundPage />;
    case "settings":
      return segments.length === 1 ? <SystemSettingsPage /> : <NotFoundPage />;
    case "sample-questions":
      return segments.length === 1 ? <SampleQuestionPage /> : <NotFoundPage />;
    case "mappings":
      return segments.length === 1 ? <QueryTermMappingPage /> : <NotFoundPage />;
    case "users":
      return segments.length === 1 ? <UserListPage /> : <NotFoundPage />;
    default:
      return <NotFoundPage />;
  }
}

export function AdminRagentShell() {
  const router = useRouter();
  const slug = router.query.slug;
  const segments = useMemo(() => {
    if (!slug) {
      return [] as string[];
    }
    return Array.isArray(slug) ? slug : [slug];
  }, [slug]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const pathOnly = router.asPath.split("?")[0]?.replace(/\/$/, "") || "";
    if (pathOnly === "/admin") {
      void router.replace("/admin/dashboard");
    }
  }, [router, router.isReady, router.asPath]);

  if (!router.isReady) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">加载中…</div>
    );
  }

  const page = resolveAdminPage(segments);

  if (segments.length === 0) {
    return (
      <AdminLayout>
        <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">正在跳转…</div>
      </AdminLayout>
    );
  }

  return <AdminLayout>{page}</AdminLayout>;
}
