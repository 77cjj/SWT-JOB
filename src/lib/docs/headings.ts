import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { DocPageData } from "./types";

export type DocTocItem = {
  id: string;
  depth: number;
  text: string;
};

const HEADING_STYLES = new Set(["h2", "h3", "h4"]);

function portableBlockPlainText(block: Record<string, unknown>): string {
  const children = block.children;
  if (!Array.isArray(children)) return "";
  return children
    .map((child) => {
      if (child && typeof child === "object" && "text" in child) {
        return String((child as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("");
}

function styleToDepth(style: string): number {
  if (style === "h2") return 2;
  if (style === "h3") return 3;
  if (style === "h4") return 4;
  return 0;
}

function isPortableHeadingBlock(block: unknown): block is Record<string, unknown> {
  if (!block || typeof block !== "object") return false;
  const b = block as Record<string, unknown>;
  if (b._type !== "block") return false;
  const style = typeof b.style === "string" ? b.style : "";
  return HEADING_STYLES.has(style);
}

/** 在 Sanity Portable Text 块上写入 `_headingId`，供正文与目录共用（不落库，仅构建期 props）。 */
export function prepareDocPage(page: DocPageData): DocPageData {
  const next = structuredClone(page) as DocPageData;
  if (!Array.isArray(next.body) || next.body.length === 0) {
    return next;
  }

  const slugger = new GithubSlugger();
  for (const block of next.body) {
    if (!isPortableHeadingBlock(block)) continue;
    const title = portableBlockPlainText(block);
    if (!title) continue;
    block._headingId = slugger.slug(title);
  }

  return next;
}

function mdastPlainText(node: { children?: unknown[] }): string {
  if (!node.children?.length) return "";
  return node.children
    .map((child) => {
      if (!child || typeof child !== "object") return "";
      const c = child as { type?: string; value?: unknown; children?: unknown[] };
      if (c.type === "text" && typeof c.value === "string") return c.value;
      if (c.children) return mdastPlainText(c as { children: unknown[] });
      return "";
    })
    .join("");
}

function extractMarkdownHeadings(markdown: string): { depth: number; title: string }[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const out: { depth: number; title: string }[] = [];

  visit(tree, "heading", (node) => {
    const n = node as { depth?: number; children?: unknown[] };
    const depth = typeof n.depth === "number" ? n.depth : 0;
    if (depth < 2 || depth > 4) return;
    const title = mdastPlainText(n).trim();
    if (title) out.push({ depth, title });
  });

  return out;
}

export function buildDocToc(page: DocPageData): DocTocItem[] {
  if (Array.isArray(page.body) && page.body.length > 0) {
    const out: DocTocItem[] = [];
    for (const block of page.body) {
      if (!isPortableHeadingBlock(block)) continue;
      const id = typeof block._headingId === "string" ? block._headingId : "";
      const text = portableBlockPlainText(block).trim();
      const depth = styleToDepth(String(block.style ?? ""));
      if (id && text && depth) {
        out.push({ id, depth, text });
      }
    }
    return out;
  }

  const md = page.markdown ?? "";
  if (!md.trim()) return [];

  const raw = extractMarkdownHeadings(md);
  const slugger = new GithubSlugger();
  return raw.map(({ depth, title }) => ({
    depth,
    text: title,
    id: slugger.slug(title),
  }));
}
