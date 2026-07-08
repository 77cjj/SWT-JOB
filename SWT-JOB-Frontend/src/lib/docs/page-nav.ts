import type { DocNavItem, DocsNavigation } from './types';

export type FlatDocPage = DocNavItem & { sectionTitle?: string };

export function flattenDocsNavigation(navigation: DocsNavigation): FlatDocPage[] {
  const pages: FlatDocPage[] = [];
  if (navigation.home) {
    pages.push({ ...navigation.home });
  }
  for (const section of navigation.sections) {
    for (const item of section.items) {
      pages.push({ ...item, sectionTitle: section.title });
    }
  }
  return pages;
}

export function getAdjacentDocPages(
  navigation: DocsNavigation,
  currentSlug: string,
): { prev: FlatDocPage | null; next: FlatDocPage | null } {
  const flat = flattenDocsNavigation(navigation);
  const idx = flat.findIndex((p) => p.slug.join('/') === currentSlug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? flat[idx - 1]! : null,
    next: idx < flat.length - 1 ? flat[idx + 1]! : null,
  };
}
