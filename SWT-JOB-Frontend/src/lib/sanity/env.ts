export const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || "";

export const SANITY_DATASET =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "";

export const SANITY_API_VERSION =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-04-01";

export const SANITY_STUDIO_BASE_PATH =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH || "/studio";

export const SANITY_STUDIO_URL =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "";

export const SANITY_PREVIEW_URL =
  process.env.NEXT_PUBLIC_SANITY_PREVIEW_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:3000");

export const SANITY_READ_TOKEN = process.env.SANITY_API_READ_TOKEN || "";
export const SANITY_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN || "";
export const SANITY_REVALIDATE_SECRET =
  process.env.SANITY_REVALIDATE_SECRET || "";

export function hasSanityConfig() {
  return Boolean(SANITY_PROJECT_ID && SANITY_DATASET);
}
