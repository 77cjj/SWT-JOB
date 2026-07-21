import type { DocComment } from '../docs/comments/demoComments';
import { DEMO_DOC_COMMENTS } from '../docs/comments/demoComments';
import { DEMO_DEAL_COMMENTS } from './demoDealComments';
import type { CommentContextKind } from './commentContext';

export function getCommentsForContext(kind: CommentContextKind, contextId: string): DocComment[] {
  if (!contextId) return [];
  if (kind === 'doc') {
    return DEMO_DOC_COMMENTS.filter((c) => c.docSlug === contextId);
  }
  return DEMO_DEAL_COMMENTS.filter((c) => c.dealId === contextId);
}

export function getAllDemoCommentsForKind(kind: CommentContextKind): DocComment[] {
  return kind === 'doc' ? DEMO_DOC_COMMENTS : DEMO_DEAL_COMMENTS;
}
