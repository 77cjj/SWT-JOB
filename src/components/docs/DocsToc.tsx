import type { DocTocItem } from "../../lib/docs/headings";

export function DocsToc({ items }: { items: DocTocItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="docs-toc" aria-label="本页目录">
      <p className="docs-toc-title">本页目录</p>
      <ul className="docs-toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className="docs-toc-item"
            style={{ paddingLeft: `${(item.depth - 2) * 0.75}rem` }}
          >
            <a href={`#${item.id}`} className="docs-toc-link">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
