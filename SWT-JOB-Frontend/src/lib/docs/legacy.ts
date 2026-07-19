import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { DOC_SECTIONS, resolveDocSectionKey } from "./sections";
import type { DocNavSection, DocPageData, DocsNavigation } from "./types";

const DOCS_ROOT = path.join(process.cwd(), "src/pages/docs");
let legacyDocsCache: DocPageData[] | null = null;
let legacyDocsPromise: Promise<DocPageData[]> | null = null;
const SHOULD_CACHE_LEGACY_DOCS = process.env.NODE_ENV !== "development";

const ROOT_META: Record<string, string> = {
  intro: "入门必读",
  apply: "报名选岗",
  visa: "签证护照",
  departure: "行前准备",
  arrival: "抵美落地",
  living: "在美生活",
  transport: "交通出行",
  return: "归国收尾",
};

/** 显式定义侧栏顺序与显示标题；未列出的文件按路径字母序追加 */
const SECTION_META: Record<string, Record<string, string>> = {
  intro: {
    faq: "常见问题",
    eligibility: "适合人群",
    "project-costs": "项目收支概览",
    myths: "常见误区",
  },
  apply: {
    agency: "机构与费用",
    timeline: "全流程时间线",
    roles: "常见岗位",
    selection: "选岗指南",
    interview: "面试准备",
  },
  visa: {
    passport: "护照办理",
    "passport-lost": "护照遗失处理",
    "visa-materials": "签证材料清单",
    "visa-interview": "面签流程",
    "visa-faq": "签证常见问题",
  },
  departure: {
    packing: "行李清单",
    flights: "机票购买",
    "sim-card": "电话卡与通讯",
    "money-prep": "资金与银行卡",
    "online-tools": "线上面试工具",
    whatsapp: "WhatsApp 使用",
    "email-templates": "邮件沟通模板",
  },
  arrival: {
    "arrival-guide": "抵美动线总览",
    "sevis-checkin": "SEVIS 与月检",
    "i94-ssn": "I-94 与 SSN",
    "settling-in": "首周安顿",
  },
  living: {
    "work-rules": "工作规则与上岗口语",
    "second-job": "第二份工作",
    "living-cost": "生活成本",
    housing: "住宿指南",
    food: "饮食与做饭",
    medical: "就医与保险",
    safety: "安全与应急",
    reselling: "代购与购物",
  },
  transport: {
    uber: "打车 (Uber/Lyft)",
    bus: "公交出行",
    metro: "地铁出行",
    coach: "长途巴士",
    train: "火车 (Amtrak)",
    "car-rental": "租车指南",
    bicycle: "骑行通勤",
    "domestic-travel": "境内旅行",
  },
  return: {
    taxes: "税务与退税",
    "grace-travel": "Grace Period 旅行",
    "side-hustles": "副业与羊毛",
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
  if (!SHOULD_CACHE_LEGACY_DOCS) return loadLegacyDocs();
  if (legacyDocsCache) return legacyDocsCache;
  if (legacyDocsPromise) return legacyDocsPromise;

  legacyDocsPromise = loadLegacyDocs().then((docs) => {
    legacyDocsCache = docs;
    legacyDocsPromise = null;
    return docs;
  });
  return legacyDocsPromise;
}

function normalizeRelativePath(sectionKey: string, filename: string): string {
  const withExt = filename.includes(".")
    ? filename.replace(/\\/g, "/")
    : `${sectionKey}/${filename}.mdx`;
  return withExt.replace(/\.(mdx|md)$/i, "");
}

async function loadLegacyDocs(): Promise<DocPageData[]> {
  const docs: DocPageData[] = [];

  try {
    const indexDoc = await readMarkdownFile("index.mdx");
    docs.push({
      id: "docs-index",
      source: "docs",
      title:
        typeof indexDoc.data.title === "string"
          ? indexDoc.data.title
          : extractTitleFromMarkdown(indexDoc.content, "文档首页"),
      slug: [],
      fullSlug: "",
      section: null,
      order: 0,
      status: "published",
      markdown: indexDoc.content,
      summary:
        typeof indexDoc.data.summary === "string" ? indexDoc.data.summary : undefined,
      seoDescription:
        typeof indexDoc.data.description === "string"
          ? indexDoc.data.description
          : typeof indexDoc.data.seoDescription === "string"
            ? indexDoc.data.seoDescription
            : undefined,
      legacyPath: "src/pages/docs/index.mdx",
    });
  } catch {
    // ignore missing legacy index, keep other docs available
  }

  const sectionDocs = await Promise.all(
    DOC_SECTIONS.map(async (section) => {
      const metaEntries = SECTION_META[section.key] ?? {};
      const walked = await walkSectionFiles(section.key);
      const normalizedPaths = Array.from(
        new Set<string>([
          ...Object.keys(metaEntries).map((key) =>
            normalizeRelativePath(section.key, key),
          ),
          ...walked.map((p) => normalizeRelativePath(section.key, p)),
        ]),
      );

      normalizedPaths.sort((a, b) => {
        const keys = Object.keys(metaEntries);
        const slugA = a.split("/").pop() ?? a;
        const slugB = b.split("/").pop() ?? b;
        const idxA = keys.indexOf(slugA);
        const idxB = keys.indexOf(slugB);
        if (idxA >= 0 && idxB >= 0) return idxA - idxB;
        if (idxA >= 0) return -1;
        if (idxB >= 0) return 1;
        return a.localeCompare(b);
      });

      const rows = await Promise.all(
        normalizedPaths.map(async (normalized, order) => {
          const relativePath = `${normalized}.mdx`;
          const slugParts = normalized.split("/").filter(Boolean);
          const slugTail = slugParts.at(-1) ?? "doc";
          try {
            const file = await readMarkdownFile(relativePath);
            const fallbackTitle =
              metaEntries[slugTail] ??
              extractTitleFromMarkdown(file.content, slugTail);
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
      return rows.filter((doc): doc is NonNullable<typeof doc> => doc !== null);
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
      title: ROOT_META[section.key] ?? section.title,
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
  return resolveDocSectionKey(value);
}
