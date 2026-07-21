import type { DocComment } from './demoComments';
import type { CommentSort } from './commentInteractions';
import { displayDislikeCount, displayLikeCount, hotScore } from './commentInteractions';

export type CommentNode = DocComment & { children: CommentNode[] };

export function buildCommentForest(
  flat: DocComment[],
  sort: CommentSort,
  likes: Set<string>,
  dislikes: Set<string>,
): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  flat.forEach((c) => nodes.set(c.id, { ...c, children: [] }));

  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = nodes.get(c.id)!;
    const parentId = c.parentId?.trim();
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else if (!parentId) {
      roots.push(node);
    }
  });

  const sortReplies = (list: CommentNode[]) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    list.forEach((n) => sortReplies(n.children));
  };
  sortReplies(roots);

  if (sort === 'latest') {
    roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    roots.sort(
      (a, b) =>
        hotScore(b, likes, dislikes) - hotScore(a, likes, dislikes) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }

  return roots;
}

export function countDescendants(node: CommentNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}
