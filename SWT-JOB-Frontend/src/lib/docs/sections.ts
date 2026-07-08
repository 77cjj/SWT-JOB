import type { DocSectionConfig, DocSectionKey } from "./types";

export const DOC_SECTIONS: DocSectionConfig[] = [
  { key: "intro", title: "入门必读", order: 10 },
  { key: "apply", title: "报名选岗", order: 20 },
  { key: "visa", title: "签证护照", order: 30 },
  { key: "departure", title: "行前准备", order: 40 },
  { key: "arrival", title: "抵美落地", order: 50 },
  { key: "living", title: "在美生活", order: 60 },
  { key: "transport", title: "交通出行", order: 70 },
  { key: "return", title: "归国收尾", order: 80 },
];

export const DOC_SECTION_MAP = new Map<DocSectionKey, DocSectionConfig>(
  DOC_SECTIONS.map((section) => [section.key, section]),
);

/** 旧版分区 slug → 新版分区，用于 Sanity 与历史链接兼容 */
export const LEGACY_SECTION_ALIASES: Record<string, DocSectionKey> = {
  preparation: "visa",
  experience: "living",
  after: "return",
  basics: "departure",
};

export function isDocSectionKey(value: string): value is DocSectionKey {
  return DOC_SECTION_MAP.has(value as DocSectionKey);
}

export function resolveDocSectionKey(
  value: string | undefined | null,
): DocSectionKey | null {
  if (!value) return null;
  if (isDocSectionKey(value)) return value;
  return LEGACY_SECTION_ALIASES[value] ?? null;
}
