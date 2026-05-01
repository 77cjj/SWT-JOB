import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { DOC_SECTION_MAP, DOC_SECTIONS, isDocSectionKey } from "./sections";
import type { DocNavSection, DocPageData, DocsNavigation } from "./types";

const DOCS_ROOT = path.join(process.cwd(), "src/pages/docs");
let legacyDocsCache: DocPageData[] | null = null;
let legacyDocsPromise: Promise<DocPageData[]> | null = null;

const ROOT_META = {
  intro: "项目介绍",
  preparation: "行前准备",
  experience: "行中指南",
  after: "行后与归国",
} as const;

const SECTION_META: Record<string, Record<string, string>> = {
  intro: {
    guide: "新手指南",
    faq: "常见问题",
  },
  preparation: {
    agency: "机构与费用",
    timeline: "全流程与签证",
    interview: "面试准备",
    flights: "机票购买",
    packing: "行李清单",
  },
  experience: {
    roles: "岗位类型",
    selection: "选岗避雷",
    "living-cost": "生活开销",
    "second-job": "第二份工作",
    safety: "安全须知",
  },
  after: {
    taxes: "税务退税",
    shopping: "购物与代购",
    travel: "结束后旅行",
  },
};

function extractTitleFromMarkdown(markdown: string, fallback: string) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function simplifyDocTitle(raw: string) {
  const compact = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^doc\s*\d+\s*/i, "")
    .trim();
  return compact
    .replace(/超详细教程|超详细攻略指南|超低价|问答汇总|重要事项/g, "")
    .replace(/赴美实习项目|赴美|在美|在美国/g, "")
    .replace(/使用指南|交通指南/g, "")
    .replace(/Skype\s*超详细Skype使用教程/gi, "Skype")
    .replace(/zoom的安装与使用/gi, "Zoom")
    .replace(/Teams的$/gi, "Teams")
    .replace(/\s+/g, " ")
    .replace(/^[：:\-｜\s]+|[：:\-｜\s]+$/g, "")
    .trim();
}

async function readMarkdownFile(relativePath: string) {
  const fullPath = path.join(DOCS_ROOT, relativePath);
  const raw = await fs.readFile(fullPath, "utf8");
  const { content, data } = matter(raw);
  return {
    content,
    data,
    fullPath,
  };
}

async function walkSectionFiles(currentRelative: string): Promise<string[]> {
  const sectionPath = path.join(DOCS_ROOT, currentRelative);
  try {
    const entries = await fs.readdir(sectionPath, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const childRelative = path.join(currentRelative, entry.name);
        if (entry.isDirectory()) {
          return walkSectionFiles(childRelative);
        }
        if (!entry.isFile()) return [];
        if (!entry.name.endsWith(".mdx") && !entry.name.endsWith(".md")) return [];
        if (childRelative === "index.mdx") return [];
        return [childRelative];
      }),
    );
    return nested.flat();
  } catch {
    return [];
  }
}

export async function getLegacyDocs(): Promise<DocPageData[]> {
  if (legacyDocsCache) return legacyDocsCache;
  if (legacyDocsPromise) return legacyDocsPromise;

  legacyDocsPromise = loadLegacyDocs().then((docs) => {
    legacyDocsCache = docs;
    legacyDocsPromise = null;
    return docs;
  });
  return legacyDocsPromise;
}

async function loadLegacyDocs(): Promise<DocPageData[]> {
  const docs: DocPageData[] = [];

  try {
    const indexDoc = await readMarkdownFile("index.mdx");
    docs.push({
      id: "docs-index",
      source: "docs",
      title: extractTitleFromMarkdown(indexDoc.content, "文档首页"),
      slug: [],
      fullSlug: "",
      section: null,
      order: 0,
      status: "published",
      markdown: indexDoc.content,
      legacyPath: "src/pages/docs/index.mdx",
    });
  } catch {
    // ignore missing legacy index, keep other docs available
  }

  const sectionDocs = await Promise.all(
    DOC_SECTIONS.map(async (section) => {
      const metaEntries = SECTION_META[section.key] ?? {};
      const filenames = Array.from(
        new Set<string>([
          ...Object.keys(metaEntries),
          ...(await walkSectionFiles(section.key)),
        ]),
      );
      filenames.sort((a, b) => a.localeCompare(b));

      const rows = await Promise.all(
        filenames.map(async (filename, order) => {
          const relativePath = filename.includes(".")
            ? filename
            : `${section.key}/${filename}.mdx`;
          const normalized = relativePath
            .replace(/\\/g, "/")
            .replace(/\.(mdx|md)$/i, "");
          const slugParts = normalized.split("/").filter(Boolean);
          const slugWithoutSection = slugParts.slice(1);
          const fallbackSlugTail = slugWithoutSection.at(-1) ?? "doc";
          try {
            const file = await readMarkdownFile(relativePath);
            const fallbackTitle =
              metaEntries[filename] ??
              extractTitleFromMarkdown(file.content, fallbackSlugTail);
            const title = simplifyDocTitle(
              typeof file.data.title === "string" ? file.data.title : fallbackTitle,
            );
            return {
              id: `docs-${normalized.replace(/\//g, "-")}`,
              source: "docs",
              title: title || fallbackTitle,
              slug: slugParts,
              fullSlug: slugParts.join("/"),
              section: section.key,
              order,
              status: "published",
              markdown: file.content,
              summary:
                typeof file.data.summary === "string" ? file.data.summary : undefined,
              seoTitle:
                typeof file.data.seoTitle === "string"
                  ? file.data.seoTitle
                  : undefined,
              seoDescription:
                typeof file.data.seoDescription === "string"
                  ? file.data.seoDescription
                  : undefined,
              legacyPath: `src/pages/docs/${relativePath.replace(/\\/g, "/")}`,
            } satisfies DocPageData;
          } catch {
            return null;
          }
        }),
      );
      return rows.filter((doc): doc is DocPageData => doc !== null);
    }),
  );

  for (const rows of sectionDocs) docs.push(...rows);
  return docs;
}

export async function getLegacyDocBySlug(
  slug: string[],
): Promise<DocPageData | null> {
  const docs = await getLegacyDocs();
  return docs.find((doc) => doc.fullSlug === slug.join("/")) ?? null;
}

export async function getLegacyDocPaths() {
  const docs = await getLegacyDocs();
  return docs.map((doc) => doc.slug);
}

export async function getLegacyNavigation(): Promise<DocsNavigation> {
  const docs = await getLegacyDocs();
  const home =
    docs.find((doc) => doc.fullSlug === "") && {
      title: docs.find((doc) => doc.fullSlug === "")!.title,
      href: "/docs",
      slug: [],
      order: 0,
    };

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

    return {
      key: section.key,
      title: ROOT_META[section.key as keyof typeof ROOT_META] ?? section.title,
      href: `/docs/${section.key}`,
      order: section.order,
      items,
    };
  }).filter((section) => section.items.length > 0);

  return {
    home: home ?? null,
    sections,
  };
}

export function normalizeLegacySection(value: string | undefined | null) {
  if (!value || !isDocSectionKey(value)) return null;
  return DOC_SECTION_MAP.get(value)?.key ?? null;
}
