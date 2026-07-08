import { buildDocToc } from "../../lib/docs/headings";
import { toChineseTitle } from "../../lib/docs/title";
import type { DocPageData, DocsNavigation } from "../../lib/docs/types";
import { DocsLayout } from "./DocsLayout";
import { MarkdownContent } from "./MarkdownContent";
import { PortableTextContent } from "./PortableTextContent";

function normalizeHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function stripLeadingDuplicateMarkdownTitle(markdown: string, title: string) {
  const lines = markdown.split("\n");
  const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmpty < 0) return markdown;

  const first = lines[firstNonEmpty].trim();
  const m = first.match(/^#{1,2}\s+(.+)$/);
  if (!m) return markdown;

  if (normalizeHeading(m[1]) !== normalizeHeading(title)) return markdown;

  lines.splice(firstNonEmpty, 1);
  if (lines[firstNonEmpty]?.trim() === "") lines.splice(firstNonEmpty, 1);
  return lines.join("\n");
}

function stripLeadingDuplicatePortableTitle(body: unknown[], title: string) {
  if (!Array.isArray(body) || body.length === 0) return body;
  const first = body[0];
  if (!first || typeof first !== "object") return body;
  const block = first as {
    _type?: unknown;
    style?: unknown;
    children?: Array<{ text?: unknown }>;
  };
  if (block._type !== "block") return body;
  if (block.style !== "h1" && block.style !== "h2") return body;
  const text = (block.children ?? [])
    .map((child) => String(child?.text ?? ""))
    .join("")
    .trim();
  if (!text) return body;
  if (normalizeHeading(text) !== normalizeHeading(title)) return body;
  return body.slice(1);
}

export function DocPage({
  page,
  navigation,
}: {
  page: DocPageData;
  navigation: DocsNavigation;
}) {
  const displayTitle = toChineseTitle(page.title);
  const normalizedPage: DocPageData = page.body
    ? { ...page, body: stripLeadingDuplicatePortableTitle(page.body, displayTitle) }
    : {
        ...page,
        markdown: stripLeadingDuplicateMarkdownTitle(page.markdown ?? "", displayTitle),
      };

  const toc = buildDocToc(normalizedPage);

  const content = normalizedPage.body ? (
    <PortableTextContent value={normalizedPage.body} />
  ) : (
    <MarkdownContent markdown={normalizedPage.markdown ?? ""} />
  );

  return (
    <DocsLayout page={page} navigation={navigation} content={content} toc={toc} />
  );
}
