import type { DocsNavigation } from "./types";

/** 非 MDX 的特殊页面，注入侧栏导航 */
export function injectSpecialNavItems(navigation: DocsNavigation): DocsNavigation {
  const sections = navigation.sections.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  const applySection = sections.find((section) => section.key === "apply");
  if (applySection) {
    const timelineIndex = applySection.items.findIndex((item) =>
      item.slug.join("/").endsWith("apply/timeline"),
    );
    const insertAt = timelineIndex >= 0 ? timelineIndex + 1 : 1;
    if (!applySection.items.some((item) => item.href === "/docs/journey")) {
      applySection.items.splice(insertAt, 0, {
        title: "互动时间线看板",
        href: "/docs/journey",
        slug: ["journey"],
        order: insertAt,
      });
    }
  }

  return { ...navigation, sections };
}
