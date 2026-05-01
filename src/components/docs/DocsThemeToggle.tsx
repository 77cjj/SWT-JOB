"use client";

import { useTheme } from "next-themes";

export function DocsThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const label = isDark ? "切换到浅色模式" : "切换到深色模式";

  return (
    <button
      type="button"
      className="docs-theme-icon-btn"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
