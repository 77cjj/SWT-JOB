import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1>{children}</h1>,
    h2: ({ children, value }) => {
      const id =
        value && typeof value === "object" && "_headingId" in value
          ? String((value as { _headingId?: string })._headingId ?? "")
          : "";
      return (
        <h2 id={id || undefined} className="docs-heading docs-heading--h2">
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const id =
        value && typeof value === "object" && "_headingId" in value
          ? String((value as { _headingId?: string })._headingId ?? "")
          : "";
      return (
        <h3 id={id || undefined} className="docs-heading docs-heading--h3">
          {children}
        </h3>
      );
    },
    h4: ({ children, value }) => {
      const id =
        value && typeof value === "object" && "_headingId" in value
          ? String((value as { _headingId?: string })._headingId ?? "")
          : "";
      return (
        <h4 id={id || undefined} className="docs-heading docs-heading--h4">
          {children}
        </h4>
      );
    },
    h5: ({ children, value }) => {
      const id =
        value && typeof value === "object" && "_headingId" in value
          ? String((value as { _headingId?: string })._headingId ?? "")
          : "";
      return (
        <h5 id={id || undefined} className="docs-heading docs-heading--h5">
          {children}
        </h5>
      );
    },
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code>{children}</code>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  },
  types: {
    code: ({ value }) => (
      <pre>
        <code>{value?.code ?? ""}</code>
      </pre>
    ),
  },
};

export function PortableTextContent({ value }: { value: unknown[] }) {
  return (
    <PortableText
      value={value as PortableTextBlock[]}
      components={portableTextComponents}
    />
  );
}
