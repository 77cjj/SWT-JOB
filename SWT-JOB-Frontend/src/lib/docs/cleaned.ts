import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import type { DocPageData, DocSectionKey } from "./types";

const CLEANED_DOCS_ROOT = path.join(process.cwd(), "sanity/清洗完毕文档");
let cleanedDocsCache: DocPageData[] | null = null;
let cleanedDocsPromise: Promise<DocPageData[]> | null = null;

type SectionHint = {
  key: DocSectionKey;
  title: string;
  order: number;
};

const DOMAIN_TO_SECTION: Record<string, SectionHint> = {
  平台使用与沟通: { key: "departure", title: "行前准备", order: 40 },
  证件与签证: { key: "visa", title: "签证护照", order: 30 },
  出发前准备: { key: "departure", title: "行前准备", order: 40 },
  抵美落地: { key: "arrival", title: "抵美落地", order: 50 },
  交通与住宿: { key: "transport", title: "交通出行", order: 70 },
  工作与生活: { key: "living", title: "在美生活", order: 60 },
  安全与应急: { key: "living", title: "在美生活", order: 60 },
};

function stripMarkdownExt(filename: string) {
  return filename.replace(/\.md$/, "");
}

function extractTitleFromMarkdown(markdown: string, fallback: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function simplifyCleanedTitle(raw: string) {
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\d+[\s._-]*/, "")
    .trim();
}

type ParsedMeta = {
  fileId: number;
  sectionKey: DocSectionKey;
  sectionTitle: string;
  sectionOrder: number;
  fullSlug: string;
};

function parseFilename(nameWithoutExt: string): ParsedMeta | null {
  const parts = nameWithoutExt.split("_");
  if (parts.length < 5) return null;

  const fileIdRaw = parts[0];
  const domain = parts[2];

  const fileId = Number(fileIdRaw);
  if (!Number.isFinite(fileId)) return null;

  const sectionHint =
    DOMAIN_TO_SECTION[domain] ?? {
      key: "departure",
      title: "行前准备",
      order: 40,
    };
  return {
    fileId,
    sectionKey: sectionHint.key,
    sectionTitle: sectionHint.title,
    sectionOrder: sectionHint.order,
    // 保持 URL 简短稳定，避免出现多级奇怪路径。
    fullSlug: `${sectionHint.key}/cleaned-doc-${fileIdRaw}`,
  };
}

export async function getCleanedDocs(): Promise<DocPageData[]> {
  if (cleanedDocsCache) return cleanedDocsCache;
  if (cleanedDocsPromise) return cleanedDocsPromise;

  cleanedDocsPromise = loadCleanedDocs().then((docs) => {
    cleanedDocsCache = docs;
    cleanedDocsPromise = null;
    return docs;
  });
  return cleanedDocsPromise;
}

async function loadCleanedDocs(): Promise<DocPageData[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CLEANED_DOCS_ROOT);
  } catch {
    return [];
  }

  const files = entries
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) => !entry.toLowerCase().startsWith("readme"));

  const parsedDocs = await Promise.all(
    files.map(async (filename) => {
      const idBase = stripMarkdownExt(filename);
      const parsed = parseFilename(idBase);
      if (!parsed) return null;
      try {
        const fullPath = path.join(CLEANED_DOCS_ROOT, filename);
        const raw = await fs.readFile(fullPath, "utf8");
        const { content, data } = matter(raw);
        const extractedTitle = extractTitleFromMarkdown(content, idBase);
        const titleCore = typeof data.title === "string" ? data.title : extractedTitle;
        const title = simplifyCleanedTitle(titleCore) || `文档 ${parsed.fileId}`;

        return {
          id: `cleaned-${idBase}`,
          source: "docs",
          title,
          slug: parsed.fullSlug.split("/"),
          fullSlug: parsed.fullSlug,
          section: parsed.sectionKey,
          // 放在对应分区靠后位置，避免把手写主文档挤下去。
          order: 200 + parsed.fileId,
          status: "published",
          summary: typeof data.summary === "string" ? data.summary : undefined,
          markdown: content,
          legacyPath: `sanity/清洗完毕文档/${filename}`,
          sectionTitle: parsed.sectionTitle,
          sectionOrder: parsed.sectionOrder,
        } satisfies DocPageData;
      } catch {
        return null;
      }
    }),
  );

  const docs = parsedDocs.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

  return docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getCleanedDocsNav(): Promise<DocPageData[]> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CLEANED_DOCS_ROOT);
  } catch {
    return [];
  }

  const files = entries
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) => !entry.toLowerCase().startsWith("readme"));

  const docs: DocPageData[] = [];
  for (const filename of files) {
    const idBase = stripMarkdownExt(filename);
    const parsed = parseFilename(idBase);
    if (!parsed) continue;

    const parts = idBase.split("_");
    const titleRaw = parts.slice(4).join("_");
    const titleCore = simplifyCleanedTitle(titleRaw || idBase);
    const title = titleCore || `文档 ${parsed.fileId}`;

    docs.push({
      id: `cleaned-nav-${idBase}`,
      source: "docs",
      title,
      slug: parsed.fullSlug.split("/"),
      fullSlug: parsed.fullSlug,
      section: parsed.sectionKey,
      order: 200 + parsed.fileId,
      status: "published",
      legacyPath: `sanity/清洗完毕文档/${filename}`,
      sectionTitle: parsed.sectionTitle,
      sectionOrder: parsed.sectionOrder,
    });
  }

  return docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getCleanedDocBySlug(slug: string[]): Promise<DocPageData | null> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(CLEANED_DOCS_ROOT);
  } catch {
    return null;
  }

  const target = slug.join("/");
  const files = entries
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) => !entry.toLowerCase().startsWith("readme"));

  for (const filename of files) {
    const idBase = stripMarkdownExt(filename);
    const parsed = parseFilename(idBase);
    if (!parsed || parsed.fullSlug !== target) continue;

    try {
      const fullPath = path.join(CLEANED_DOCS_ROOT, filename);
      const raw = await fs.readFile(fullPath, "utf8");
      const { content, data } = matter(raw);
      const extractedTitle = extractTitleFromMarkdown(content, idBase);
      const titleCore = typeof data.title === "string" ? data.title : extractedTitle;
      const title = simplifyCleanedTitle(titleCore) || `文档 ${parsed.fileId}`;

      return {
        id: `cleaned-${idBase}`,
        source: "docs",
        title,
        slug: parsed.fullSlug.split("/"),
        fullSlug: parsed.fullSlug,
        section: parsed.sectionKey,
        order: 200 + parsed.fileId,
        status: "published",
        summary: typeof data.summary === "string" ? data.summary : undefined,
        markdown: content,
        legacyPath: `sanity/清洗完毕文档/${filename}`,
        sectionTitle: parsed.sectionTitle,
        sectionOrder: parsed.sectionOrder,
      };
    } catch {
      return null;
    }
  }

  return null;
}
