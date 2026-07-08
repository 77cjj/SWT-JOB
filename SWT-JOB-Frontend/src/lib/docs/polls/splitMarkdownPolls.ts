export type MarkdownPollPart =
  | { type: 'markdown'; content: string }
  | { type: 'poll'; pollId: string };

const POLL_TOKEN = /\[\[poll:([a-z0-9-]+)\]\]/g;

export function splitMarkdownPolls(markdown: string): MarkdownPollPart[] {
  const parts: MarkdownPollPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = POLL_TOKEN.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: markdown.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'poll', pollId: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    parts.push({ type: 'markdown', content: markdown.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'markdown', content: markdown });
  }

  return parts;
}
