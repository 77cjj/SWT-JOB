"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import useDevice from "../../hooks/useDevice";
import DesktopLayout from "../../layout/desktop/Layout";
import MobileLayout from "../../layout/mobile/Layout";
import { JOURNEY_PHASES } from "../../lib/journey/timeline-data";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function JourneyPhaseCard({
  id,
  phase,
  title,
  period,
  summary,
  tasks,
  docHref,
  docLabel,
  accent,
  glow,
  isVisible,
  isActive,
  onVisible,
}: (typeof JOURNEY_PHASES)[number] & {
  isVisible: boolean;
  isActive: boolean;
  onVisible: (id: string, visible: boolean) => void;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisible(id, entry.isIntersecting);
      },
      { root: null, rootMargin: "-20% 0px -35% 0px", threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [id, onVisible]);

  return (
    <article
      ref={ref}
      id={`journey-${id}`}
      className={`journey-phase${isVisible ? " is-visible" : ""}${isActive ? " is-active" : ""}`}
      style={
        {
          "--phase-accent": accent,
          "--phase-glow": glow,
        } as React.CSSProperties
      }
    >
      <div className="journey-node" aria-hidden />
      <div className="journey-card-wrap">
        <div className="journey-card">
          <div className="journey-card-head">
            <span className="journey-card-phase">PHASE {phase}</span>
            <span className="journey-card-period">{period}</span>
          </div>
          <h2>{title}</h2>
          <p className="journey-card-summary">{summary}</p>
          <ul className="journey-task-list">
            {tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
          <Link href={docHref} className="journey-card-link">
            阅读 {docLabel}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function JourneyTimelinePage() {
  const isMobile = useDevice();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState(JOURNEY_PHASES[0].id);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());

  const handleVisible = useCallback((id: string, visible: boolean) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (visible) next.add(id);
      else next.delete(id);
      return next;
    });
    if (visible) setActiveId(id);
  }, []);

  const scrollToPhase = useCallback((id: string) => {
    document.getElementById(`journey-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const content = (
    <div className="journey-root">
      <div className="journey-bg" aria-hidden>
        <div className="journey-bg-orb journey-bg-orb--a" />
        <div className="journey-bg-orb journey-bg-orb--b" />
        <div className="journey-bg-orb journey-bg-orb--c" />
        <div className="journey-grid-floor" />
      </div>

      <nav className="journey-progress-rail" aria-label="阶段进度">
        {JOURNEY_PHASES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`journey-progress-dot${activeId === item.id ? " is-active" : ""}`}
            style={
              {
                "--dot-color": item.accent,
                "--dot-glow": item.glow,
              } as React.CSSProperties
            }
            aria-label={`跳转到 ${item.title}`}
            aria-current={activeId === item.id ? "step" : undefined}
            onClick={() => scrollToPhase(item.id)}
          />
        ))}
      </nav>

      <div ref={scrollRef} className="journey-scroll">
        <header className="journey-hud">
          <Link href="/docs/apply/timeline" className="journey-hud-back">
            <ChevronLeftIcon />
            返回文档
          </Link>
          <span className="journey-hud-title">SWT Journey Map</span>
          <span style={{ width: 72 }} aria-hidden />
        </header>

        <div className="journey-scene">
          <section className="journey-hero">
            <div className="journey-hero-badge">
              <span aria-hidden>✦</span>
              Interactive Timeline
            </div>
            <h1>SWT 全程航线</h1>
            <p>
              从报名决策到归国收尾，十个阶段自上而下展开。向下滚动，沿时间轴探索每个节点该做什么。
            </p>
            <div className="journey-scroll-hint" aria-hidden>
              向下滚动
              <span />
            </div>
          </section>

          <div className="journey-track">
            <div className="journey-spine-glow" aria-hidden />
            <div className="journey-spine" aria-hidden />

            {JOURNEY_PHASES.map((item) => (
              <JourneyPhaseCard
                key={item.id}
                {...item}
                isVisible={visibleIds.has(item.id)}
                isActive={activeId === item.id}
                onVisible={handleVisible}
              />
            ))}
          </div>

          <footer className="journey-footer">
            需要详细清单？查看{" "}
            <Link href="/docs/apply/timeline">全流程时间线文档</Link>
          </footer>
        </div>
      </div>
    </div>
  );

  return isMobile ? (
    <MobileLayout mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden !p-0 !pb-16">
      {content}
    </MobileLayout>
  ) : (
    <DesktopLayout
      maxWidthClassName="max-w-none"
      mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !pt-0 !pb-0"
      rootClassName="h-[100dvh] overflow-hidden"
    >
      {content}
    </DesktopLayout>
  );
}
