/**
 * 文档评论 API 契约（上线后可由 Edge/Node 实现，支持幂等与限流）
 */
export type CommentVoteValue = 1 | -1 | 0;

export type PostCommentVoteBody = {
  commentId: string;
  vote: CommentVoteValue;
  /** 客户端生成的 UUID，服务端去重防双击/重试风暴 */
  idempotencyKey: string;
};

export type PostCommentBody = {
  docSlug: string;
  body: string;
  idempotencyKey: string;
};

export const COMMENT_API_ROUTES = {
  list: (docSlug: string) => `/docs/${encodeURIComponent(docSlug)}/comments`,
  vote: (commentId: string) => `/docs/comments/${encodeURIComponent(commentId)}/vote`,
} as const;

export function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 客户端发评最小间隔（ms），减轻恶意刷评；服务端仍须 rate limit */
export const COMMENT_SUBMIT_COOLDOWN_MS = 3000;

let lastCommentSubmitAt = 0;

export function canSubmitCommentNow(): boolean {
  return Date.now() - lastCommentSubmitAt >= COMMENT_SUBMIT_COOLDOWN_MS;
}

export function markCommentSubmitted(): void {
  lastCommentSubmitAt = Date.now();
}

/**
 * 预留：批量同步本地投票到服务端（debounce 后调用）
 * 高并发下应用消息队列 + 按 commentId 分片计数（Redis INCR/HLL）
 */
export async function flushCommentVoteQueue(_entries: PostCommentVoteBody[]): Promise<void> {
  // no-op until backend exists
}
