import { useEffect, useRef, type ReactNode } from "react";

import type { DocTocItem } from "../../lib/docs/headings";
import type { DocPageData, DocsNavigation } from "../../lib/docs/types";
import { toChineseTitle } from "../../lib/docs/title";
import { useDocsRouteLoading } from "../../context/DocsRouteLoadingContext";
import useDevice from "../../hooks/useDevice";
import DesktopLayout from "../../layout/desktop/Layout";
import MobileLayout from "../../layout/mobile/Layout";
import { DocsMainSkeleton, DocsTocSkeleton } from "./DocsRouteSkeletons";
import { DocsSidebarNav } from "./DocsSidebarNav";
import { DocsToc } from "./DocsToc";

type DocsLayoutProps = {
  navigation: DocsNavigation;
  page: DocPageData;
  content: ReactNode;
  toc: DocTocItem[];
};

export function DocsLayout({ navigation, page, content, toc }: DocsLayoutProps) {
  const isMobile = useDevice();
  const isRouteLoading = useDocsRouteLoading();
  const mainRef = useRef<HTMLElement | null>(null);
  const activeSection = navigation.sections.find((section) =>
    section.items.some((item) => item.slug.join("/") === page.fullSlug),
  );

  useEffect(() => {
    if (!isRouteLoading) return;
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [isRouteLoading]);

  const contentNode = (
    <div className="docs-app docs-scrollbar">
      <div className="docs-shell">
        <aside className="docs-sidebar docs-scrollbar">
          <DocsSidebarNav navigation={navigation} page={page} />
        </aside>
        <main
          ref={mainRef}
          className={`docs-main docs-scrollbar${isRouteLoading ? " is-loading" : ""}`}
        >
          {isRouteLoading ? (
            <DocsMainSkeleton />
          ) : (
            <>
              <nav className="docs-breadcrumb" aria-label="文档层级">
                <span>SWT文档</span>
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
                <h1>{toChineseTitle(page.title)}</h1>
                {page.summary ? (
                  <p className="docs-article-summary">{page.summary}</p>
                ) : null}
              </header>
              <div className="docs-content">{content}</div>
            </>
          )}
        </main>
        <aside className="docs-toc-aside docs-scrollbar" aria-label="页面大纲">
          <div className="docs-toc-inner">
            {isRouteLoading ? <DocsTocSkeleton /> : <DocsToc items={toc} />}
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
