/** 内联骨架：仅用于 DocsLayout 的 main / TOC，继承真实容器布局 */
export function DocsMainSkeleton() {
  return (
    <div className="docs-skel-main" aria-hidden>
      <div className="docs-skel-main-inner">
        <div className="docs-skel-breadcrumb" />
        <div className="docs-skel-article">
          <div className="docs-skel-title" />
          <div className="docs-skel-summary" />
        </div>
        <div className="docs-skel-content">
          <span className="docs-skel-line" />
          <span className="docs-skel-line" />
          <span className="docs-skel-line" />
          <span className="docs-skel-line" />
          <span className="docs-skel-line" />
          <span className="docs-skel-line" />
        </div>
      </div>
    </div>
  );
}

export function DocsTocSkeleton() {
  return (
    <div className="docs-skel-toc" aria-hidden>
      <div className="docs-skel-toc-title" />
      <div className="docs-skel-toc-links">
        <span className="docs-skel-toc-link" />
        <span className="docs-skel-toc-link" />
        <span className="docs-skel-toc-link" />
        <span className="docs-skel-toc-link" />
      </div>
    </div>
  );
}
