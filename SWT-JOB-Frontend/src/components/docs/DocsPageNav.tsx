import Link from 'next/link';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import type { FlatDocPage } from '../../lib/docs/page-nav';
import { toChineseTitle } from '../../lib/docs/title';

export function DocsPageNav({
  prev,
  next,
}: {
  prev: FlatDocPage | null;
  next: FlatDocPage | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="docs-page-nav" aria-label="文档翻页">
      {prev ? (
        <Link href={prev.href} className="docs-page-nav-link docs-page-nav-link--prev">
          <ArrowBack fontSize="small" />
          <span>
            <span className="docs-page-nav-label">上一篇</span>
            <span className="docs-page-nav-title">{toChineseTitle(prev.title)}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="docs-page-nav-link docs-page-nav-link--next">
          <span>
            <span className="docs-page-nav-label">下一篇</span>
            <span className="docs-page-nav-title">{toChineseTitle(next.title)}</span>
          </span>
          <ArrowForward fontSize="small" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
