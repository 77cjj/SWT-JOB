export type DocStatus = "draft" | "review" | "published";

export type DocSectionKey =
  | "intro"
  | "apply"
  | "visa"
  | "departure"
  | "arrival"
  | "living"
  | "transport"
  | "return";

export interface DocSectionConfig {
  key: DocSectionKey;
  title: string;
  order: number;
}

export interface DocPageData {
  id: string;
  source: "sanity" | "docs";
  title: string;
  slug: string[];
  fullSlug: string;
  section: DocSectionKey | null;
  order: number;
  status: DocStatus;
  summary?: string;
  markdown?: string;
  /** Portable Text blocks；构建期可能带有 `_headingId`（见 `prepareDocPage`） */
  body?: unknown[];
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  legacyPath?: string;
  /** Optional section display override from content source. */
  sectionTitle?: string;
  /** Optional section order override from content source. */
  sectionOrder?: number;
}

export interface DocNavItem {
  title: string;
  href: string;
  slug: string[];
  order: number;
}

export interface DocNavSection {
  key: DocSectionKey;
  title: string;
  href: string;
  order: number;
  items: DocNavItem[];
}

export interface DocsNavigation {
  home: DocNavItem | null;
  sections: DocNavSection[];
}
