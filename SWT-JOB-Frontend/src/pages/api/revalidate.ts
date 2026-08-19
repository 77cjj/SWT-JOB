import type { NextApiRequest, NextApiResponse } from "next";

import { SANITY_REVALIDATE_SECRET } from "../../lib/sanity/env";

function extractSlug(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const slug = record.slug;
  if (typeof slug === "string" && slug.trim()) return slug.replace(/^\/+|\/+$/g, "");
  if (slug && typeof slug === "object") {
    const current = (slug as { current?: unknown }).current;
    if (typeof current === "string" && current.trim()) {
      return current.replace(/^\/+|\/+$/g, "");
    }
  }
  if (typeof record.path === "string" && record.path.startsWith("/docs/")) {
    return record.path.replace(/^\/docs\/?/, "").replace(/\/+$/, "");
  }
  return null;
}

function authorized(req: NextApiRequest): boolean {
  if (!SANITY_REVALIDATE_SECRET) return false;
  const header = String(req.headers["x-revalidate-secret"] || "").trim();
  const query = typeof req.query.secret === "string" ? req.query.secret.trim() : "";
  return header === SANITY_REVALIDATE_SECRET || query === SANITY_REVALIDATE_SECRET;
}

/**
 * Sanity 发布后立刻刷新 ISR。未配密钥时拒绝。
 * Webhook: POST /api/revalidate  Header x-revalidate-secret
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }
  if (!authorized(req)) {
    return res.status(401).json({ ok: false, message: "unauthorized" });
  }

  const slug = extractSlug(req.body);
  const paths = new Set<string>(["/docs"]);
  if (slug) paths.add(`/docs/${slug}`);

  const revalidated: string[] = [];
  for (const path of paths) {
    try {
      await res.revalidate(path);
      revalidated.push(path);
    } catch (error) {
      console.warn("[revalidate] failed", path, error);
    }
  }

  return res.status(200).json({ ok: true, revalidated });
}
