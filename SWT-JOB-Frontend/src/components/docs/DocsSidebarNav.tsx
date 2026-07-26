"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "@mui/icons-material";

import type { DocNavSection, DocPageData, DocsNavigation } from "../../lib/docs/types";
import { toChineseTitle } from "../../lib/docs/title";
import { hasSanityConfig } from "../../lib/sanity/env";
import { openDocsSearch } from "./DocsSearchDialog";

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
  const showStudioLink = hasSanityConfig();

  return (
    <div className="docs-sidebar-inner">
      <div className="docs-sidebar-search-wrap">
        <button
          type="button"
          className="docs-sidebar-search-trigger"
          onClick={openDocsSearch}
          aria-label="搜索文档"
        >
          <Search sx={{ fontSize: 18, opacity: 0.55 }} />
          <span>搜索文档…</span>
          <kbd className="docs-sidebar-kbd">⌘K</kbd>
        </button>
      </div>
      {navigation.home ? (
        <Link
          href={navigation.home.href}
          className={`docs-nav-link ${page.fullSlug === "" ? "is-active" : ""}`}
        >
          {toChineseTitle(navigation.home.title)}
        </Link>
      ) : null}
      {navigation.sections.map((section) => {
        const activeHere = sectionHasActivePage(section, page);
        return (
          <CollapsibleSection
            key={`${section.key}-${activeHere ? "1" : "0"}`}
            section={section}
            page={page}
            defaultOpen={activeHere}
          />
        );
      })}
      {showStudioLink ? (
        <div className="docs-sidebar-footer">
          <a
            href="/studio/structure"
            className="docs-studio-link"
            target="_blank"
            rel="noreferrer"
          >
            打开内容后台
          </a>
        </div>
      ) : null}
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
      <div className="docs-nav-section-panel" data-open={open}>
        <div className="docs-nav-section-panel-inner">
          <nav className="docs-nav-section-links" aria-hidden={!open}>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={open ? undefined : -1}
                className={`docs-nav-link ${
                  page.fullSlug === item.slug.join("/") ? "is-active" : ""
                }`}
              >
                {toChineseTitle(item.title)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
