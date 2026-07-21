import type { DemoConversation } from "@/services/demoConversationService";
import { listDemoConversations } from "@/services/demoConversationService";
import type { Message, Session } from "@/types";
import { STATIC_DEMO_CONVERSATIONS } from "./demoConversationsData";

export const DEMO_SESSION_PREFIX = "demo-";

export { STATIC_DEMO_CONVERSATIONS };

const demoBySessionId = new Map<string, DemoConversation>();

function refreshDemoIndex(list: DemoConversation[]) {
  demoBySessionId.clear();
  list.forEach((item) => {
    demoBySessionId.set(`${DEMO_SESSION_PREFIX}${item.id}`, item);
  });
}

refreshDemoIndex(STATIC_DEMO_CONVERSATIONS);

export function isDemoSessionId(sessionId: string | null | undefined): boolean {
  return Boolean(sessionId?.startsWith(DEMO_SESSION_PREFIX));
}

export function demoSessionId(rawId: string): string {
  return `${DEMO_SESSION_PREFIX}${rawId}`;
}

export function getDemoConversationBySessionId(sessionId: string): DemoConversation | null {
  return demoBySessionId.get(sessionId) ?? null;
}

function sortDemos(list: DemoConversation[]): DemoConversation[] {
  return [...list].sort((a, b) => {
    const pinA = a.pinned ? 1 : 0;
    const pinB = b.pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export async function resolveDemoConversations(): Promise<DemoConversation[]> {
  try {
    const remote = await listDemoConversations();
    if (remote?.length) {
      const sorted = sortDemos(remote);
      refreshDemoIndex(sorted);
      return sorted;
    }
  } catch {
    // API 不可用（旧后端等）时用静态示例
  }
  refreshDemoIndex(STATIC_DEMO_CONVERSATIONS);
  return STATIC_DEMO_CONVERSATIONS;
}

export function demoConversationToSession(item: DemoConversation, index: number): Session {
  const daysAgo = Math.min(index, 6);
  const lastTime = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: demoSessionId(item.id),
    title: item.title || item.question.slice(0, 28),
    preview: item.description || item.question.slice(0, 48),
    lastTime,
    isDemo: true,
  };
}

/** 同步兜底：API 慢或失败时侧栏立刻有示例条目 */
export function loadGuestDemoSessionsSync(): Session[] {
  const sorted = sortDemos(STATIC_DEMO_CONVERSATIONS);
  refreshDemoIndex(sorted);
  return sorted.map((item, index) => demoConversationToSession(item, index));
}

export function demoConversationToMessages(item: DemoConversation): Message[] {
  const now = new Date().toISOString();
  if (item.turns?.length) {
    return item.turns.map((turn, index) => ({
      id: `demo-${turn.role}-${item.id}-${index}`,
      role: turn.role,
      content: turn.content,
      status: "done" as const,
      createdAt: now,
      feedback: turn.role === "assistant" ? null : undefined,
    }));
  }
  return [
    {
      id: `demo-user-${item.id}`,
      role: "user",
      content: item.question,
      status: "done",
      createdAt: now,
    },
    {
      id: `demo-assistant-${item.id}`,
      role: "assistant",
      content: item.answer || "",
      status: "done",
      createdAt: now,
      feedback: null,
    },
  ];
}

export async function loadGuestDemoSessions(): Promise<Session[]> {
  const demos = await resolveDemoConversations();
  return demos.map((item, index) => demoConversationToSession(item, index));
}
