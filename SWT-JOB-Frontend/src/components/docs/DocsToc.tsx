"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import type { DocTocItem } from "../../lib/docs/headings";
import {
  useDocsTocScrollSpy,
} from "../../hooks/useDocsTocScrollSpy";

type DocsTocProps = {
  items: DocTocItem[];
  scrollRoot: HTMLElement | null;
  enabled?: boolean;
};

type IndicatorState = {
  y: number;
  height: number;
};

export function DocsToc({ items, scrollRoot, enabled = true }: DocsTocProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<IndicatorState>({ y: 0, height: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const headingIds = items.map((item) => item.id);
  const { activeId, navigateToHeading } = useDocsTocScrollSpy(
    scrollRoot,
    headingIds,
    enabled,
  );

  const measureIndicator = useCallback(() => {
    const track = trackRef.current;
    if (!track || !activeId) {
      setIndicatorReady(false);
      return;
    }

    const link = linkRefs.current.get(activeId);
    if (!link) {
      setIndicatorReady(false);
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    setIndicator({
      y: linkRect.top - trackRect.top,
      height: linkRect.height,
    });
    setIndicatorReady(true);
  }, [activeId]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator, items]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      measureIndicator();
    });

    observer.observe(track);
    return () => observer.disconnect();
  }, [measureIndicator]);

  const setLinkRef = useCallback(
    (id: string) => (node: HTMLAnchorElement | null) => {
      if (node) {
        linkRefs.current.set(id, node);
      } else {
        linkRefs.current.delete(id);
      }
    },
    [],
  );

  const handleLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      navigateToHeading(id);
    },
    [navigateToHeading],
  );

  if (items.length === 0) return null;

  const indicatorStyle = {
    "--docs-toc-indicator-y": `${indicator.y}px`,
    "--docs-toc-indicator-h": `${indicator.height}px`,
  } as CSSProperties;

  return (
    <nav className="docs-toc" aria-label="本页目录">
      <p className="docs-toc-title">本页目录</p>
      <div ref={trackRef} className="docs-toc-track">
        <span
          className={`docs-toc-indicator${indicatorReady ? " is-visible" : ""}`}
          style={indicatorStyle}
          aria-hidden
        />
        <ul className="docs-toc-list">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li
                key={item.id}
                className="docs-toc-item"
                style={{ paddingLeft: `${(item.depth - 2) * 0.75}rem` }}
              >
                <a
                  ref={setLinkRef(item.id)}
                  href={`#${item.id}`}
                  className={`docs-toc-link docs-toc-link--depth-${item.depth}${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => handleLinkClick(event, item.id)}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
