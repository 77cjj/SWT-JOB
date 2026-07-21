export type CommentContextKind = 'doc' | 'deal';

export function commentContextKey(kind: CommentContextKind, id: string): string {
  return `${kind}:${id}`;
}
