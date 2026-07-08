'use client';

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

import { splitMarkdownPolls } from '../../lib/docs/polls/splitMarkdownPolls';
import { DocPollWidget } from './DocPollWidget';
import { DocCallout, parseCalloutFromBlockquote } from './DocCallout';

function DocH2({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="docs-heading docs-heading--h2">
      {children}
    </h2>
  );
}

function DocH3({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="docs-heading docs-heading--h3">
      {children}
    </h3>
  );
}

function DocH4({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h4 id={id} className="docs-heading docs-heading--h4">
      {children}
    </h4>
  );
}

function DocH5({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h5 id={id} className="docs-heading docs-heading--h5">
      {children}
    </h5>
  );
}

function DocH6({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h6 id={id} className="docs-heading docs-heading--h6">
      {children}
    </h6>
  );
}

const markdownComponents = {
  h2: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <DocH2 id={id}>{children}</DocH2>
  ),
  h3: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <DocH3 id={id}>{children}</DocH3>
  ),
  h4: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <DocH4 id={id}>{children}</DocH4>
  ),
  h5: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <DocH5 id={id}>{children}</DocH5>
  ),
  h6: ({ children, id }: { children?: ReactNode; id?: string }) => (
    <DocH6 id={id}>{children}</DocH6>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="docs-table-wrap">
      <table>{children}</table>
    </div>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => {
    const parsed = parseCalloutFromBlockquote(children);
    if (parsed) {
      return (
        <DocCallout kind={parsed.kind} title={parsed.title}>
          {parsed.body}
        </DocCallout>
      );
    }
    return <blockquote>{children}</blockquote>;
  },
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    const isExternal = href?.startsWith('http');
    return (
      <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined}>
        {children}
      </a>
    );
  },
};

function MarkdownBlock({ content }: { content: string }) {
  if (!content.trim()) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const parts = splitMarkdownPolls(markdown);

  return (
    <>
      {parts.map((part, index) =>
        part.type === 'poll' ? (
          <DocPollWidget key={`poll-${part.pollId}-${index}`} pollId={part.pollId} />
        ) : (
          <MarkdownBlock key={`md-${index}`} content={part.content} />
        ),
      )}
    </>
  );
}
