import type { DocSectionConfig, DocSectionKey } from "./types";

export const DOC_SECTIONS: DocSectionConfig[] = [
  { key: "intro", title: "项目介绍", order: 10 },
  { key: "preparation", title: "行前准备", order: 20 },
  { key: "experience", title: "行中指南", order: 30 },
  { key: "after", title: "行后与归国", order: 40 },
  { key: "basics", title: "基础指南", order: 50 },
];

export const DOC_SECTION_MAP = new Map<DocSectionKey, DocSectionConfig>(
  DOC_SECTIONS.map((section) => [section.key, section]),
);

export function isDocSectionKey(value: string): value is DocSectionKey {
  return DOC_SECTION_MAP.has(value as DocSectionKey);
}
