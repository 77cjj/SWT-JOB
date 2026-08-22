import { DOC_SECTION_MAP, DOC_SECTIONS, resolveDocSectionKey } from "./sections";
import { resolveDocSlugRedirect } from "./redirects";
import { injectSpecialNavItems } from "./special-nav";
import { getLegacyDocBySlug, getLegacyDocs, getLegacyNavigation } from "./legacy";
import { sanityReadClient } from "../sanity/client";
import {
  allDocPagesNavQuery,
  allDocPagesQuery,
  docPageBySlugQuery,
} from "../sanity/queries";
import type { DocNavSection, DocPageData, DocsNavigation } from "./types";

type SanityDocRecord = {
  _id: string;
  title: string;
  slugCurrent: string;
  section: string | null;
  sectionTitle?: string;
  sectionOrder?: number;
  order?: number;
  status?: "draft" | "review" | "published";
  contentSource?: "sanity" | "server";
  enabled?: boolean;
  commentsEnabled?: boolean;
  summary?: string;
  body?: unknown[];
  seoTitle?: string;
  seoDescription?: string;
  legacyPath?: string;
  _updatedAt?: string;
};

const CACHE_TTL_MS = 30_000;
const SANITY_FETCH_TIMEOUT_MS = 6_000;

type CacheBucket<T> = { value: T; expiresAt: number };

let sanityDocsCache: CacheBucket<DocPageData[]> | null = null;
let sanityNavDocsCache: CacheBucket<DocPageData[]> | null = null;
let legacyDocsCache: CacheBucket<DocPageData[]> | null = null;

function shouldPreferLocalDocs() {
  return process.env.NODE_ENV === "development";
}

function readCache<T>(bucket: CacheBucket<T> | null): T | null {
  if (!bucket) return null;
  if (Date.now() > bucket.expiresAt) return null;
  return bucket.value;
}

function writeCache<T>(value: T): CacheBucket<T> {
  return { value, expiresAt: Date.now() + CACHE_TTL_MS };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Sanity request timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function safeSanityFetch<T>(query: string, params?: Record<string, unknown>) {
  if (!sanityReadClient) return null;
  try {
    const request = params
      ? sanityReadClient.fetch<T>(query, params as never)
      : sanityReadClient.fetch<T>(query);
    return await withTimeout(
      request,
      SANITY_FETCH_TIMEOUT_MS,
    );
  } catch (error) {
    console.warn(
      "[docs] Sanity fetch failed, using fallback:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function normalizeSanityDoc(record: SanityDocRecord): DocPageData {
  const slug = record.slugCurrent.split("/").filter(Boolean);
  const section = resolveDocSectionKey(record.section);

  return {
    id: record._id,
    source: "sanity",
    title: record.title,
    slug,
    fullSlug: record.slugCurrent,
    section,
    order: record.order ?? 0,
    status: record.status ?? "published",
    contentSource: record.contentSource ?? "sanity",
    enabled: record.enabled !== false,
    commentsEnabled: record.commentsEnabled !== false,
    summary: record.summary,
    body: record.body,
    updatedAt: record._updatedAt,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    legacyPath: record.legacyPath,
    sectionTitle: record.sectionTitle,
    sectionOrder: record.sectionOrder,
  };
}

async function getCachedLegacyDocs(): Promise<DocPageData[]> {
  if (shouldPreferLocalDocs()) return getLegacyDocs();
  const cached = readCache(legacyDocsCache);
  if (cached) return cached;
  const docs = await getLegacyDocs();
  legacyDocsCache = writeCache(docs);
  return docs;
}

async function getSanityDocs(): Promise<DocPageData[]> {
  const cached = readCache(sanityDocsCache);
  if (cached) return cached;
  const rows = await safeSanityFetch<SanityDocRecord[]>(allDocPagesQuery);
  if (!rows) return [];
  const docs = rows.map(normalizeSanityDoc);
  sanityDocsCache = writeCache(docs);
  return docs;
}

async function getSanityNavDocs(): Promise<DocPageData[]> {
  const cached = readCache(sanityNavDocsCache);
  if (cached) return cached;
  const rows = await safeSanityFetch<SanityDocRecord[]>(allDocPagesNavQuery);
  if (!rows) return [];
  const docs = rows.map(normalizeSanityDoc);
  sanityNavDocsCache = writeCache(docs);
  return docs;
}

async function getSanityDocBySlug(slug: string[]): Promise<DocPageData | null> {
  const row = await safeSanityFetch<SanityDocRecord | null>(docPageBySlugQuery, {
    slug: slug.join("/"),
  });
  return row ? normalizeSanityDoc(row) : null;
}

function withSanityGovernance(localDoc: DocPageData, control: DocPageData): DocPageData {
  return {
    ...localDoc,
    // 即便正文来自 MDX，启用与评论配置仍由这条 Sanity 记录治理，编辑入口也应回到它。
    id: control.id,
    source: "sanity",
    contentSource: "server",
    enabled: true,
    commentsEnabled: control.commentsEnabled !== false,
    updatedAt: control.updatedAt ?? localDoc.updatedAt,
  };
}

/**
 * Sanity 记录同时承担内容与治理配置：
 * - enabled=false 会阻断本地兜底，确保“停用”真的生效；
 * - contentSource=server 时使用同 slug 的仓库 MDX 正文；
 * - 没有 Sanity 控制记录的旧文档继续使用 MDX，保证迁移期间不中断。
 */
function resolveManagedDocs(sanityDocs: DocPageData[], localDocs: DocPageData[]): DocPageData[] {
  const localBySlug = new Map(localDocs.map((doc) => [doc.fullSlug, doc]));
  const controlledSlugs = new Set<string>();
  const resolved: DocPageData[] = [];

  for (const sanityDoc of sanityDocs) {
    controlledSlugs.add(sanityDoc.fullSlug);
    if (sanityDoc.enabled === false) continue;
    if (sanityDoc.contentSource === "server") {
      const localDoc = localBySlug.get(sanityDoc.fullSlug);
      resolved.push(localDoc ? withSanityGovernance(localDoc, sanityDoc) : sanityDoc);
      continue;
    }
    resolved.push(sanityDoc);
  }

  for (const localDoc of localDocs) {
    if (!controlledSlugs.has(localDoc.fullSlug)) resolved.push(localDoc);
  }

  return filterAndSortDocs(resolved);
}

function buildNavigation(docs: DocPageData[]): DocsNavigation {
  const homeDoc = docs.find((doc) => doc.fullSlug === "");

  const sections: DocNavSection[] = DOC_SECTIONS.map((section) => {
    const items = docs
      .filter((doc) => doc.section === section.key)
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map((doc) => ({
        title: doc.title,
        href: `/docs/${doc.fullSlug}`,
        slug: doc.slug,
        order: doc.order,
      }));

    const firstItem = docs.find((doc) => doc.section === section.key);

    return {
      key: section.key,
      title:
        firstItem?.sectionTitle ??
        (firstItem && firstItem.section && DOC_SECTION_MAP.get(firstItem.section)
          ? DOC_SECTION_MAP.get(firstItem.section)!.title
          : section.title),
      href: `/docs/${section.key}`,
      order: firstItem?.sectionOrder ?? section.order,
      items,
    };
  }).filter((section) => section.items.length > 0);

  return injectSpecialNavItems({
    home: homeDoc
      ? { title: homeDoc.title, href: "/docs", slug: [], order: 0 }
      : null,
    sections,
  });
}

async function getPreferredDocs() {
  const [sanityDocs, docs] = await Promise.all([getSanityDocs(), getCachedLegacyDocs()]);
  return resolveManagedDocs(sanityDocs, docs);
}

export async function getDocsNavigation(): Promise<DocsNavigation> {
  const [sanityDocs, docs] = await Promise.all([getSanityNavDocs(), getCachedLegacyDocs()]);
  const merged = resolveManagedDocs(sanityDocs, docs);
  if (merged.length > 0) return buildNavigation(merged);
  return getLegacyNavigation();
}

export async function getAllDocPaths() {
  const [sanityDocs, docs] = await Promise.all([getSanityNavDocs(), getCachedLegacyDocs()]);
  const merged = resolveManagedDocs(sanityDocs, docs);
  return merged.map((doc) => doc.slug);
}

export async function getDocBySlug(slug: string[]) {
  const redirected = resolveDocSlugRedirect(slug);
  if (redirected) {
    return getDocBySlug(redirected);
  }

  const sanityHit = await getSanityDocBySlug(slug);
  if (sanityHit?.enabled === false) return null;
  if (sanityHit?.contentSource !== "server" && sanityHit) return sanityHit;

  const docs = await getCachedLegacyDocs();
  const localHit = docs.find((doc) => doc.fullSlug === slug.join("/"));
  if (sanityHit && localHit) return withSanityGovernance(localHit, sanityHit);
  if (sanityHit) return sanityHit;
  if (localHit) return localHit;
  return getLegacyDocBySlug(slug);
}

export async function getAllDocs() {
  return getPreferredDocs();
}

const LEGACY_SECTION_PREFIXES = ["basics/", "preparation/", "experience/", "after/"];

/** 旧 Sanity slug / 清洗稿 / 已重定向路径 — 侧栏与路由列表中隐藏 */
function isObsoleteDocEntry(doc: DocPageData) {
  if (doc.fullSlug.includes("/cleaned/")) return true;
  if (doc.legacyPath?.includes("清洗完毕文档/")) return true;
  if (LEGACY_SECTION_PREFIXES.some((prefix) => doc.fullSlug.startsWith(prefix))) return true;
  if (resolveDocSlugRedirect(doc.slug)) return true;
  return false;
}

function filterAndSortDocs(docs: DocPageData[]): DocPageData[] {
  return docs
    .filter((doc) => !isObsoleteDocEntry(doc))
    .sort(
    (a, b) =>
      (a.sectionOrder ?? 999) - (b.sectionOrder ?? 999) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  );
}
