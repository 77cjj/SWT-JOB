import { useCallback, useEffect, useRef, useState } from "react";

export const DOCS_TOC_ACTIVATION_OFFSET = 88;
const BOTTOM_THRESHOLD = 16;
const SCROLL_SETTLE_MS = 140;
const SCROLL_LOCK_MAX_MS = 2400;

function getActiveHeadingId(
  scrollRoot: HTMLElement,
  headingIds: string[],
): string | null {
  if (headingIds.length === 0) return null;

  const rootRect = scrollRoot.getBoundingClientRect();
  const line = rootRect.top + DOCS_TOC_ACTIVATION_OFFSET;
  const rootBottom = rootRect.bottom;

  let closestId: string | null = null;
  let closestDist = Infinity;
  let lastPassedId: string | null = null;

  for (const id of headingIds) {
    const el = scrollRoot.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) continue;

    const rect = el.getBoundingClientRect();
    const top = rect.top;
    const bottom = rect.bottom;

    if (top <= line) {
      lastPassedId = id;
    }

    const visible = bottom > rootRect.top + 8 && top < rootBottom - 8;
    if (!visible) continue;

    const dist = Math.abs(top - line);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = id;
    } else if (dist === closestDist && closestId) {
      const currentIndex = headingIds.indexOf(closestId);
      const nextIndex = headingIds.indexOf(id);
      if (nextIndex > currentIndex) {
        closestId = id;
      }
    }
  }

  const active = closestId ?? lastPassedId ?? headingIds[0];

  const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
  const atBottom = scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD;

  if (atBottom) {
    const lastId = headingIds[headingIds.length - 1];
    const activeIndex = headingIds.indexOf(active);
    const lastIndex = headingIds.length - 1;

    if (activeIndex >= lastIndex - 1) {
      return lastId;
    }
  }

  return active;
}

export function scrollDocsHeadingIntoView(
  scrollRoot: HTMLElement,
  headingId: string,
) {
  const el = scrollRoot.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`);
  if (!el) return;

  const rootTop = scrollRoot.getBoundingClientRect().top;
  const target =
    scrollRoot.scrollTop +
    (el.getBoundingClientRect().top - rootTop) -
    DOCS_TOC_ACTIVATION_OFFSET;

  scrollRoot.scrollTo({
    top: Math.max(0, target),
    behavior: "smooth",
  });
}

export function useDocsTocScrollSpy(
  scrollRoot: HTMLElement | null,
  headingIds: string[],
  enabled = true,
) {
  const headingKey = headingIds.join("\u0000");
  const [activeId, setActiveId] = useState<string | null>(
    () => headingIds[0] ?? null,
  );
  const lockedIdRef = useRef<string | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const scrollLockMaxTimerRef = useRef<number | null>(null);

  useEffect(() => {
    lockedIdRef.current = null;
    setActiveId(headingIds[0] ?? null);
  }, [headingKey]);

  const navigateToHeading = useCallback(
    (headingId: string) => {
      if (!scrollRoot) return;

      lockedIdRef.current = headingId;
      setActiveId(headingId);
      scrollDocsHeadingIntoView(scrollRoot, headingId);

      if (scrollLockMaxTimerRef.current !== null) {
        window.clearTimeout(scrollLockMaxTimerRef.current);
      }

      scrollLockMaxTimerRef.current = window.setTimeout(() => {
        scrollLockMaxTimerRef.current = null;
        if (lockedIdRef.current === headingId) {
          lockedIdRef.current = null;
          setActiveId(getActiveHeadingId(scrollRoot, headingIds) ?? headingId);
        }
      }, SCROLL_LOCK_MAX_MS);
    },
    [scrollRoot, headingKey],
  );

  useEffect(() => {
    if (!enabled || !scrollRoot || headingIds.length === 0) return;

    let frame = 0;
    let ticking = false;

    const releaseLock = () => {
      const lockedId = lockedIdRef.current;
      if (!lockedId) return;

      lockedIdRef.current = null;

      if (scrollLockMaxTimerRef.current !== null) {
        window.clearTimeout(scrollLockMaxTimerRef.current);
        scrollLockMaxTimerRef.current = null;
      }

      const next = getActiveHeadingId(scrollRoot, headingIds);
      setActiveId(next ?? lockedId);
    };

    const scheduleReleaseLock = () => {
      if (!lockedIdRef.current) return;

      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }

      scrollEndTimerRef.current = window.setTimeout(() => {
        scrollEndTimerRef.current = null;
        releaseLock();
      }, SCROLL_SETTLE_MS);
    };

    const syncActive = () => {
      ticking = false;

      if (lockedIdRef.current) {
        const lockedId = lockedIdRef.current;
        setActiveId((prev) => (prev === lockedId ? prev : lockedId));
        return;
      }

      const next = getActiveHeadingId(scrollRoot, headingIds);
      setActiveId((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (lockedIdRef.current) {
        const lockedId = lockedIdRef.current;
        setActiveId((prev) => (prev === lockedId ? prev : lockedId));
        scheduleReleaseLock();
      }

      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(syncActive);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onScroll)
        : null;

    resizeObserver?.observe(scrollRoot);
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    frame = window.requestAnimationFrame(syncActive);

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(frame);

      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }

      if (scrollLockMaxTimerRef.current !== null) {
        window.clearTimeout(scrollLockMaxTimerRef.current);
      }
    };
  }, [enabled, scrollRoot, headingKey]);

  return { activeId, navigateToHeading };
}
