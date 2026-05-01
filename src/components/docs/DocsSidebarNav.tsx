"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { DocNavSection, DocPageData, DocsNavigation } from "../../lib/docs/types";
import { toChineseTitle } from "../../lib/docs/title";
import { SANITY_STUDIO_BASE_PATH } from "../../lib/sanity/env";

function sectionHasActivePage(section: DocNavSection, page: DocPageData) {
  return section.items.some((item) => item.slug.join("/") === page.fullSlug);
}

export function DocsSidebarNav({
  navigation,
  page,
}: {
  navigation: DocsNavigation;
  page: DocPageData;
}) {
  const [keyword, setKeyword] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const studioHref = `${SANITY_STUDIO_BASE_PATH || "/studio"}/structure`;

  const filtered = useMemo(() => {
    if (!normalizedKeyword) {
      return {
        home: navigation.home,
        sections: navigation.sections,
      };
    }

    const home = navigation.home
      ? toChineseTitle(navigation.home.title).toLowerCase().includes(normalizedKeyword)
        ? navigation.home
        : null
      : null;

    const sections = navigation.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          toChineseTitle(item.title).toLowerCase().includes(normalizedKeyword),
        ),
      }))
      .filter((section) => section.items.length > 0);

    return { home, sections };
  }, [navigation, normalizedKeyword]);

  return (
    <div className="docs-sidebar-inner">
      <div className="docs-sidebar-search-wrap">
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索文档..."
          className="docs-sidebar-search"
          aria-label="搜索文档"
        />
      </div>
      {filtered.home ? (
        <Link
          href={filtered.home.href}
          className={`docs-nav-link ${page.fullSlug === "" ? "is-active" : ""}`}
        >
          {toChineseTitle(filtered.home.title)}
        </Link>
      ) : null}
      {filtered.sections.map((section) => {
        const activeHere = sectionHasActivePage(section, page);
        return (
          <CollapsibleSection
            key={`${section.key}-${activeHere ? "1" : "0"}`}
            section={section}
            page={page}
            defaultOpen={normalizedKeyword ? true : activeHere}
          />
        );
      })}
      {normalizedKeyword && !filtered.home && filtered.sections.length === 0 ? (
        <p className="docs-nav-empty">未找到匹配文档</p>
      ) : null}
      <div className="docs-sidebar-footer">
        <a
          href={studioHref}
          className="docs-studio-link"
          target="_blank"
          rel="noreferrer"
        >
          打开内容后台
        </a>
      </div>
    </div>
  );
}

function CollapsibleSection({
  section,
  page,
  defaultOpen,
}: {
  section: DocNavSection;
  page: DocPageData;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="docs-nav-section">
      <button
        type="button"
        className="docs-nav-section-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="docs-nav-section-chevron" data-open={open} aria-hidden />
        <span className="docs-nav-section-title">{section.title}</span>
      </button>
      {open ? (
        <nav className="docs-nav-section-links">
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`docs-nav-link ${
                page.fullSlug === item.slug.join("/") ? "is-active" : ""
              }`}
            >
              {toChineseTitle(item.title)}
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
