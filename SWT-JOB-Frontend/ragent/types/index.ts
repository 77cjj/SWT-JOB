export type Role = "user" | "assistant";

export type FeedbackValue = "like" | "dislike" | null;

export type MessageStatus = "streaming" | "done" | "cancelled" | "error";

export interface MessageResource {
  title?: string;
  url?: string;
  snippet?: string;
  score?: number;
  kbId?: string | number;
  docId?: string | number;
  chunkId?: string | number;
}

export interface User {
  userId: string;
  username?: string;
  role: string;
  token: string;
  avatar?: string;
  freeChatRemaining?: number | null;
}

export type CurrentUser = Omit<User, "token">;

export interface Session {
  id: string;
  title: string;
  lastTime?: string;
  /** 侧栏副标题（示例对话摘要） */
  preview?: string;
  /** 访客示例会话，非用户真实历史 */
  isDemo?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  thinking?: string;
  thinkingDuration?: number;
  isDeepThinking?: boolean;
  isThinking?: boolean;
  createdAt?: string;
  feedback?: FeedbackValue;
  status?: MessageStatus;
  resources?: MessageResource[];
}

export interface StreamMetaPayload {
  conversationId: string;
  taskId: string;
}

export interface MessageDeltaPayload {
  type: string;
  delta: string;
}

export interface CompletionPayload {
  messageId?: string | null;
  title?: string | null;
}

export interface ResourcesPayload {
  resources?: MessageResource[];
  references?: MessageResource[];
  citations?: MessageResource[];
}
