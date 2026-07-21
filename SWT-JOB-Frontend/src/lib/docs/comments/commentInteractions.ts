import type { DocComment } from './demoComments';

const LIKES_KEY = 'swt-doc-comment-likes';
const LOCAL_COMMENTS_KEY = 'swt-doc-local-comments';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function readLikedCommentIds(): Set<string> {
  const ids = readJson<string[]>(LIKES_KEY, []);
  return new Set(ids);
}

export function toggleCommentLike(commentId: string): Set<string> {
  const next = readLikedCommentIds();
  if (next.has(commentId)) next.delete(commentId);
  else next.add(commentId);
  writeJson(LIKES_KEY, [...next]);
  return next;
}

export type LocalDocComment = DocComment & { local?: true };

export function readLocalComments(): LocalDocComment[] {
  return readJson<LocalDocComment[]>(LOCAL_COMMENTS_KEY, []);
}

export function appendLocalComment(comment: LocalDocComment) {
  const all = readLocalComments();
  all.unshift(comment);
  writeJson(LOCAL_COMMENTS_KEY, all.slice(0, 80));
}

export function mergeComments(base: DocComment[], docSlug: string): DocComment[] {
  const local = readLocalComments().filter((c) => c.docSlug === docSlug);
  return [...local, ...base.filter((c) => c.docSlug === docSlug)];
}

export function helpfulCountWithLikes(comment: DocComment, liked: Set<string>): number {
  return comment.helpfulCount + (liked.has(comment.id) ? 1 : 0);
}

export type CommentSort = 'latest' | 'hot';

export function sortComments(items: DocComment[], sort: CommentSort, liked: Set<string>): DocComment[] {
  const list = [...items];
  if (sort === 'latest') {
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    list.sort(
      (a, b) =>
        helpfulCountWithLikes(b, liked) - helpfulCountWithLikes(a, liked) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }
  return list;
}
