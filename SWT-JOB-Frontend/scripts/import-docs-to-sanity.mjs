import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

/** Next.js loads `.env.local` automatically; plain `node` does not — mirror that here. */
function loadEnvFile(relPath, { override } = { override: false }) {
  const abs = path.join(process.cwd(), relPath);
  let raw;
  try {
    raw = fs.readFileSync(abs, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key.startsWith("#")) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = val;
  }
}

loadEnvFile(".env", { override: false });
loadEnvFile(".env.local", { override: true });

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-04-01";

if (!projectId || !token) {
  if (!projectId) {
    console.error("Missing SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID.");
  }
  if (!token) {
    console.error("Missing SANITY_API_WRITE_TOKEN.");
  }
  console.error(
    "Put these in the project root `.env.local` (same file Next uses), then run `npm run import:docs` again.",
  );
  process.exit(1);
}

const ROOT = path.join(process.cwd(), "src/pages/docs");
const CLEANED_ROOT = path.join(process.cwd(), "sanity/清洗完毕文档");

const sectionConfig = [
  { key: "intro", title: "项目介绍", order: 10 },
  { key: "preparation", title: "行前准备", order: 20 },
  { key: "experience", title: "行中指南", order: 30 },
  { key: "after", title: "行后与归国", order: 40 },
  { key: "basics", title: "基础指南", order: 50 },
];

const sectionMeta = {
  intro: ["guide", "faq"],
  preparation: ["agency", "timeline", "interview", "flights", "packing"],
  experience: ["roles", "selection", "living-cost", "second-job", "safety"],
  after: ["taxes", "shopping", "travel"],
  basics: ["flights"],
};

async function walkSectionFiles(sectionKey, currentRelative = "") {
  const targetDir = path.join(ROOT, sectionKey, currentRelative);
  let entries = [];
  try {
    entries = await fsp.readdir(targetDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const childRelative = currentRelative ? path.join(currentRelative, entry.name) : entry.name;
    if (entry.isDirectory()) {
      const nested = await walkSectionFiles(sectionKey, childRelative);
      files.push(...nested);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".mdx")) continue;
    files.push(childRelative.replace(/\\/g, "/"));
  }
  return files;
}

const cleanedDomainToSection = {
  平台使用与沟通: { key: "basics", title: "基础指南", order: 50 },
  证件与签证: { key: "preparation", title: "行前准备", order: 20 },
  出发前准备: { key: "preparation", title: "行前准备", order: 20 },
  抵美落地: { key: "experience", title: "行中指南", order: 30 },
  交通与住宿: { key: "experience", title: "行中指南", order: 30 },
  工作与生活: { key: "experience", title: "行中指南", order: 30 },
  安全与应急: { key: "experience", title: "行中指南", order: 30 },
};

const cleanedDomainSlugMap = {
  平台使用与沟通: "platform-communication",
  证件与签证: "documents-visa",
  出发前准备: "pre-departure",
  抵美落地: "arrival",
  交通与住宿: "transport-lodging",
  工作与生活: "work-life",
  安全与应急: "safety-emergency",
};

const cleanedTopicSlugMap = {
  WhatsApp: "whatsapp",
  使用指南: "usage-guide",
  沟通模板: "communication-template",
  护照: "passport",
  政策解读: "policy",
  签证: "visa",
  签证流程: "visa-process",
  乘机: "flight-boarding",
  机票: "flight-ticket",
  电话卡: "sim-card",
  美元_银行卡: "money-bankcard",
  行李: "packing",
  费用测算: "cost-estimation",
  抵美: "arrival",
  抵美流程: "arrival-process",
  Uber: "uber",
  住宿: "housing",
  公交车: "bus-city",
  地铁: "metro",
  巴士: "intercity-bus",
  火车: "train",
  租车: "car-rental",
  自行车: "bicycle",
  代购: "shopping-agent",
  就医: "medical-care",
  工作规范: "work-rules",
  旅行: "travel",
  美食: "food",
  安全: "safety",
};

let keyCounter = 0;
const nextKey = () => `import-${++keyCounter}`;

function span(text, marks = []) {
  return { _type: "span", _key: nextKey(), text, marks };
}

function inlineChildren(nodes = [], activeMarks = [], markDefs = []) {
  const spans = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        spans.push(span(node.value, activeMarks));
        break;
      case "strong":
        spans.push(...inlineChildren(node.children, [...activeMarks, "strong"], markDefs));
        break;
      case "emphasis":
        spans.push(...inlineChildren(node.children, [...activeMarks, "em"], markDefs));
        break;
      case "inlineCode":
        spans.push(span(node.value, [...activeMarks, "code"]));
        break;
      case "link": {
        const linkKey = nextKey();
        markDefs.push({ _key: linkKey, _type: "link", href: node.url });
        spans.push(...inlineChildren(node.children, [...activeMarks, linkKey], markDefs));
        break;
      }
      default:
        if (Array.isArray(node.children)) {
          spans.push(...inlineChildren(node.children, activeMarks, markDefs));
        }
    }
  }
  return spans.length > 0 ? spans : [span("")];
}

function block(style, children = [], extra = {}) {
  const markDefs = [];
  return {
    _type: "block",
    _key: nextKey(),
    style,
    markDefs,
    children: inlineChildren(children, [], markDefs),
    ...extra,
  };
}

function markdownToPortableText(markdown) {
  keyCounter = 0;
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const blocks = [];

  for (const node of tree.children ?? []) {
    switch (node.type) {
      case "heading":
        blocks.push(block(`h${node.depth}`, node.children));
        break;
      case "paragraph":
        blocks.push(block("normal", node.children));
        break;
      case "blockquote":
        for (const child of node.children ?? []) {
          if (child.type === "paragraph") {
            blocks.push(block("blockquote", child.children));
          }
        }
        break;
      case "list":
        for (const item of node.children ?? []) {
          const paragraph = item.children?.find((child) => child.type === "paragraph");
          blocks.push(
            block("normal", paragraph?.children ?? [], {
              listItem: node.ordered ? "number" : "bullet",
              level: 1,
            }),
          );
        }
        break;
      case "code":
        blocks.push({
          _type: "code",
          _key: nextKey(),
          language: node.lang || undefined,
          code: node.value || "",
        });
        break;
      case "thematicBreak":
        blocks.push(block("normal", [{ type: "text", value: "---" }]));
        break;
      default:
        break;
    }
  }

  return blocks;
}

async function readDoc(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  const raw = await fsp.readFile(fullPath, "utf8");
  const { content, data } = matter(raw);
  return { content, data, fullPath };
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function fallbackSlug(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function cleanedPathMeta(filenameWithoutExt) {
  const parts = filenameWithoutExt.split("_");
  if (parts.length < 5) return null;
  const numeric = Number(parts[0]);
  if (!Number.isFinite(numeric)) return null;

  const domain = parts[2];
  const topic = parts[3];
  const title = parts.slice(4).join("_");
  const section =
    cleanedDomainToSection[domain] ?? { key: "basics", title: "基础指南", order: 50 };
  const domainSlug = cleanedDomainSlugMap[domain] ?? (fallbackSlug(domain) || `domain-${parts[0]}`);
  const topicSlug = cleanedTopicSlugMap[topic] ?? (fallbackSlug(topic) || `topic-${parts[0]}`);
  const docSlug = fallbackSlug(title) || `doc-${parts[0]}`;

  return {
    id: numeric,
    titlePrefix: `${domain} / ${topic}`,
    slug: `${section.key}/cleaned/${domainSlug}/${topicSlug}/${docSlug}`,
    section,
  };
}

async function collectDocs() {
  const docs = [];

  const indexDoc = await readDoc("index.mdx");
  docs.push({
    _id: "doc-home",
    _type: "docPage",
    title: extractTitle(indexDoc.content, "文档首页"),
    slug: { current: "" },
    section: null,
    sectionTitle: null,
    sectionOrder: 0,
    order: 0,
    status: "published",
    body: markdownToPortableText(indexDoc.content),
    legacyPath: "src/pages/docs/index.mdx",
  });

  for (const section of sectionConfig) {
    const discovered = (await walkSectionFiles(section.key)).filter((relativePath) => {
      // section 首页文档由上面的 indexDoc 处理；其余统一收录。
      return relativePath !== "index.mdx";
    });

    const preferred = sectionMeta[section.key] ?? [];
    const sorted = discovered.sort((a, b) => {
      const aStem = a.replace(/\.mdx$/, "");
      const bStem = b.replace(/\.mdx$/, "");
      const aRoot = aStem.includes("/") ? null : aStem;
      const bRoot = bStem.includes("/") ? null : bStem;
      const aOrder = aRoot ? preferred.indexOf(aRoot) : -1;
      const bOrder = bRoot ? preferred.indexOf(bRoot) : -1;

      const aPinned = aOrder >= 0 ? aOrder : Number.MAX_SAFE_INTEGER;
      const bPinned = bOrder >= 0 ? bOrder : Number.MAX_SAFE_INTEGER;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return a.localeCompare(b);
    });

    for (let index = 0; index < sorted.length; index += 1) {
      const relativeInSection = sorted[index];
      const relativePath = `${section.key}/${relativeInSection}`;
      try {
        const file = await readDoc(relativePath);
        const slugCurrent = `${section.key}/${relativeInSection.replace(/\.mdx$/, "")}`;
        const idSafe = slugCurrent.replace(/[^\w-]+/g, "-");
        docs.push({
          _id: `doc-${idSafe}`,
          _type: "docPage",
          title:
            typeof file.data.title === "string"
              ? file.data.title
              : extractTitle(file.content, slugCurrent.split("/").at(-1) ?? "doc"),
          slug: { current: slugCurrent },
          section: section.key,
          sectionTitle: section.title,
          sectionOrder: section.order,
          order: index,
          status: "published",
          summary: typeof file.data.summary === "string" ? file.data.summary : undefined,
          body: markdownToPortableText(file.content),
          legacyPath: `src/pages/docs/${relativePath}`,
        });
      } catch (error) {
        console.warn(`Skipping ${relativePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  // 清洗稿已全部合并进 src/pages/docs/*.mdx，不再导入 Sanity（避免侧栏重复）
  const importCleanedDocs = process.env.IMPORT_CLEANED_DOCS === "true";
  if (!importCleanedDocs) {
    return docs;
  }

  try {
    const files = (await fsp.readdir(CLEANED_ROOT))
      .filter((name) => name.endsWith(".md"))
      .filter((name) => !name.toLowerCase().startsWith("readme"));

    for (const filename of files) {
      const filenameWithoutExt = filename.replace(/\.md$/, "");
      const meta = cleanedPathMeta(filenameWithoutExt);
      if (!meta) continue;

      try {
        const fullPath = path.join(CLEANED_ROOT, filename);
        const raw = await fsp.readFile(fullPath, "utf8");
        const { content, data } = matter(raw);
        const baseTitle = typeof data.title === "string" ? data.title : extractTitle(content, filenameWithoutExt);
        docs.push({
          _id: `doc-cleaned-${filenameWithoutExt}`,
          _type: "docPage",
          title: `${meta.titlePrefix}｜${baseTitle}`,
          slug: { current: meta.slug },
          section: meta.section.key,
          sectionTitle: meta.section.title,
          sectionOrder: meta.section.order,
          order: 1000 + meta.id,
          status: "published",
          summary: typeof data.summary === "string" ? data.summary : undefined,
          body: markdownToPortableText(content),
          legacyPath: `sanity/清洗完毕文档/${filename}`,
        });
      } catch (error) {
        console.warn(
          `Skipping cleaned doc ${filename}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  } catch {
    // ignore missing cleaned docs folder
  }

  return docs;
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
  timeout: 120_000,
});

const docs = await collectDocs();

try {
  for (const doc of docs) {
    await client.createOrReplace(doc);
    console.log(`Imported ${doc.slug.current || "docs-home"}`);
  }
  console.log(`Imported ${docs.length} documents into Sanity.`);
} catch (err) {
  const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  console.error("\n导入失败:", msg);
  if (code === "ETIMEDOUT" || msg.includes("ETIMEDOUT") || code === "ECONNRESET") {
    console.error(
      "\n当前机器无法稳定连接 Sanity API（*.api.sanity.io，多在 Google 云上）。\n" +
        "常见原因：防火墙、公司网络、地区网络限制等。\n" +
        "可尝试：换网络（如手机热点）、合规 VPN、关闭干扰性的系统代理后再执行 npm run import:docs。\n",
    );
  }
  process.exit(1);
}
