import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import "../../docs.css";
import "../../nextra-overrides.css";
import "nextra-theme-docs/style.css";

import type { DocTocItem } from "../../lib/docs/headings";
import type { DocPageData, DocsNavigation } from "../../lib/docs/types";
import { getAdjacentDocPages } from "../../lib/docs/page-nav";
import { toChineseTitle } from "../../lib/docs/title";
import { useDocsRouteLoading } from "../../context/DocsRouteLoadingContext";
import useDevice from "../../hooks/useDevice";
import DesktopLayout from "../../layout/desktop/Layout";
import MobileLayout from "../../layout/mobile/Layout";
import { DocsMainSkeleton, DocsTocSkeleton } from "./DocsRouteSkeletons";
import { DocsSidebarNav } from "./DocsSidebarNav";
import { DocsToc } from "./DocsToc";
import { DocCommentsSection } from "./DocCommentsSection";
import { DocsSearchDialog } from "./DocsSearchDialog";
import { DocsPageNav } from "./DocsPageNav";

type DocsLayoutProps = {
  navigation: DocsNavigation;
  page: DocPageData;
  content: ReactNode;
  toc: DocTocItem[];
};

function formatUpdatedAt(iso?: string) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function DocsLayout({ navigation, page, content, toc }: DocsLayoutProps) {
  const isMobile = useDevice();
  const isRouteLoading = useDocsRouteLoading();
  const mainRef = useRef<HTMLElement | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const setMainRef = useCallback((node: HTMLElement | null) => {
    mainRef.current = node;
    setScrollRoot(node);
  }, []);
  const activeSection = navigation.sections.find((section) =>
    section.items.some((item) => item.slug.join("/") === page.fullSlug),
  );
  const { prev, next } = getAdjacentDocPages(navigation, page.fullSlug);
  const updatedLabel = formatUpdatedAt(page.updatedAt);

  useEffect(() => {
    if (!isRouteLoading) return;
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [isRouteLoading]);

  const handleCopyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const contentNode = (
    <div className="docs-app docs-scrollbar">
      <DocsSearchDialog navigation={navigation} />
      <div className="docs-shell">
        <aside className="docs-sidebar docs-scrollbar">
          <DocsSidebarNav navigation={navigation} page={page} />
        </aside>
        <main
          ref={setMainRef}
          className={`docs-main docs-scrollbar${isRouteLoading ? " is-loading" : ""}${page.fullSlug === "" ? " docs-main--landing" : ""}`}
        >
          {isRouteLoading ? (
            <DocsMainSkeleton />
          ) : (
            <>
              <nav className="docs-breadcrumb" aria-label="文档层级">
                <span>SWT 文档</span>
                {activeSection ? (
                  <>
                    <span className="docs-breadcrumb-sep">/</span>
                    <span>{activeSection.title}</span>
                  </>
                ) : null}
                {page.fullSlug ? (
                  <>
                    <span className="docs-breadcrumb-sep">/</span>
                    <span>{toChineseTitle(page.title)}</span>
                  </>
                ) : null}
              </nav>
              <header className="docs-article-header">
                <div className="docs-article-header-row">
                  <h1>{toChineseTitle(page.title)}</h1>
                  <div className="docs-article-actions">
                    <button
                      type="button"
                      className="docs-action-btn"
                      onClick={() => void handleCopyLink()}
                    >
                      {copied ? "已复制" : "复制链接"}
                    </button>
                  </div>
                </div>
                {page.summary ? (
                  <p className="docs-article-summary">{page.summary}</p>
                ) : null}
                {updatedLabel ? (
                  <p className="docs-article-meta">更新于 {updatedLabel}</p>
                ) : null}
              </header>
              <div className="docs-content">{content}</div>
              <DocsPageNav prev={prev} next={next} />
              {page.fullSlug ? <DocCommentsSection docSlug={page.fullSlug} /> : null}
            </>
          )}
        </main>
        <aside className="docs-toc-aside docs-scrollbar" aria-label="页面大纲">
          <div className="docs-toc-inner">
            {isRouteLoading ? (
              <DocsTocSkeleton />
            ) : (
              <DocsToc items={toc} scrollRoot={scrollRoot} enabled={!isRouteLoading} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );

  return isMobile ? (
    <MobileLayout>{contentNode}</MobileLayout>
  ) : (
    <DesktopLayout
      maxWidthClassName="max-w-7xl"
      mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden pt-5 pb-10"
    >
      {contentNode}
    </DesktopLayout>
  );
}
