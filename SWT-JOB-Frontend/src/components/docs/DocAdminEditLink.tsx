"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { getStudioEditPath, hasSanityConfig } from "../../lib/sanity/env";

export function DocAdminEditLink({ docId, source }: { docId?: string; source?: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";
  if (!isAdmin || !hasSanityConfig() || source !== "sanity" || !docId) {
    return null;
  }
  const href = getStudioEditPath(docId);
  return (
    <Link href={href} className="docs-action-btn" target="_blank" rel="noreferrer">
      编辑本页
    </Link>
  );
}
