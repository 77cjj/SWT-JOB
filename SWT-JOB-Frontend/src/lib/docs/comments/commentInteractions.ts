import type { DocComment } from './demoComments';
import { createIdempotencyKey, flushCommentVoteQueue, type PostCommentVoteBody } from './commentApiContract';

const LIKES_KEY = 'swt-doc-comment-likes';
const DISLIKES_KEY = 'swt-doc-comment-dislikes';
const LOCAL_COMMENTS_KEY = 'swt-doc-local-comments';
const VOTE_QUEUE_KEY = 'swt-doc-comment-vote-queue-v1';

export type UserVote = 'like' | 'dislike' | null;

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

function readIdSet(key: string): Set<string> {
  return new Set(readJson<string[]>(key, []));
}

function writeIdSet(key: string, set: Set<string>) {
  writeJson(key, [...set]);
}

export function readUserVotes(): { likes: Set<string>; dislikes: Set<string> } {
  return {
    likes: readIdSet(LIKES_KEY),
    dislikes: readIdSet(DISLIKES_KEY),
  };
}

function enqueueVoteSync(body: PostCommentVoteBody) {
  const queue = readJson<PostCommentVoteBody[]>(VOTE_QUEUE_KEY, []);
  queue.push(body);
  writeJson(VOTE_QUEUE_KEY, queue.slice(-200));
  void flushCommentVoteQueue(queue);
}

/** 点赞/点踩互斥；返回最新集合 */
export function toggleCommentLike(commentId: string): { likes: Set<string>; dislikes: Set<string> } {
  const likes = readIdSet(LIKES_KEY);
  const dislikes = readIdSet(DISLIKES_KEY);
  if (likes.has(commentId)) {
    likes.delete(commentId);
    enqueueVoteSync({ commentId, vote: 0, idempotencyKey: createIdempotencyKey('vote') });
  } else {
    likes.add(commentId);
    dislikes.delete(commentId);
    enqueueVoteSync({ commentId, vote: 1, idempotencyKey: createIdempotencyKey('vote') });
  }
  writeIdSet(LIKES_KEY, likes);
  writeIdSet(DISLIKES_KEY, dislikes);
  return { likes, dislikes };
}

export function toggleCommentDislike(commentId: string): { likes: Set<string>; dislikes: Set<string> } {
  const likes = readIdSet(LIKES_KEY);
  const dislikes = readIdSet(DISLIKES_KEY);
  if (dislikes.has(commentId)) {
    dislikes.delete(commentId);
    enqueueVoteSync({ commentId, vote: 0, idempotencyKey: createIdempotencyKey('vote') });
  } else {
    dislikes.add(commentId);
    likes.delete(commentId);
    enqueueVoteSync({ commentId, vote: -1, idempotencyKey: createIdempotencyKey('vote') });
  }
  writeIdSet(LIKES_KEY, likes);
  writeIdSet(DISLIKES_KEY, dislikes);
  return { likes, dislikes };
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

export function displayLikeCount(comment: DocComment, likes: Set<string>): number {
  return comment.helpfulCount + (likes.has(comment.id) ? 1 : 0);
}

export function displayDislikeCount(comment: DocComment, dislikes: Set<string>): number {
  const base = comment.dislikeCount ?? 0;
  return base + (dislikes.has(comment.id) ? 1 : 0);
}

export function hotScore(comment: DocComment, likes: Set<string>, dislikes: Set<string>): number {
  return displayLikeCount(comment, likes) - displayDislikeCount(comment, dislikes);
}

export type CommentSort = 'latest' | 'hot';

export function sortComments(
  items: DocComment[],
  sort: CommentSort,
  likes: Set<string>,
  dislikes: Set<string>,
): DocComment[] {
  const list = [...items];
  if (sort === 'latest') {
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    list.sort(
      (a, b) =>
        hotScore(b, likes, dislikes) - hotScore(a, likes, dislikes) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }
  return list;
}

/** @deprecated use readUserVotes */
export function readLikedCommentIds(): Set<string> {
  return readUserVotes().likes;
}

/** @deprecated */
export function toggleCommentLikeLegacy(commentId: string): Set<string> {
  return toggleCommentLike(commentId).likes;
}

export function helpfulCountWithLikes(comment: DocComment, liked: Set<string>): number {
  return displayLikeCount(comment, liked);
}
