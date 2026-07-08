'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from '@mui/icons-material';
import type { DocsNavigation } from '../../lib/docs/types';
import { flattenDocsNavigation } from '../../lib/docs/page-nav';
import { toChineseTitle } from '../../lib/docs/title';

export function DocsSearchDialog({ navigation }: { navigation: DocsNavigation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => flattenDocsNavigation(navigation), [navigation]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter((item) => {
        const title = toChineseTitle(item.title).toLowerCase();
        const section = (item.sectionTitle ?? '').toLowerCase();
        return title.includes(q) || section.includes(q) || item.href.includes(q);
      })
      .slice(0, 12);
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const goTo = useCallback(
    (href: string) => {
      close();
      void router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('docs-open-search', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('docs-open-search', onOpenEvent);
    };
  }, [close]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="docs-search-overlay" role="presentation" onClick={close}>
      <div
        className="docs-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="搜索文档"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="docs-search-input-wrap">
          <Search className="docs-search-input-icon" fontSize="small" />
          <input
            ref={inputRef}
            type="search"
            className="docs-search-input"
            placeholder="搜索文档标题或分区…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, results.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === 'Enter' && results[activeIndex]) {
                goTo(results[activeIndex].href);
              }
            }}
          />
          <kbd className="docs-search-kbd">esc</kbd>
        </div>
        <ul className="docs-search-results" role="listbox">
          {results.length === 0 ? (
            <li className="docs-search-empty">没有匹配的页面</li>
          ) : (
            results.map((item, index) => (
              <li key={item.href}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`docs-search-result${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(item.href)}
                >
                  <span className="docs-search-result-title">{toChineseTitle(item.title)}</span>
                  {item.sectionTitle ? (
                    <span className="docs-search-result-meta">{item.sectionTitle}</span>
                  ) : (
                    <span className="docs-search-result-meta">概览</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="docs-search-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> 选择
          </span>
          <span>
            <kbd>↵</kbd> 打开
          </span>
        </div>
      </div>
    </div>
  );
}

export function openDocsSearch() {
  window.dispatchEvent(new CustomEvent('docs-open-search'));
}
