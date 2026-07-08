import { useRouter } from "next/router";
import { useMemo } from "react";

/** 解析 `pages/admin/[[...slug]].tsx` 捕获的路径片段 */
export function useAdminSlugSegments(): string[] {
  const router = useRouter();
  return useMemo(() => {
    const raw = router.query.slug;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [router.query.slug]);
}
