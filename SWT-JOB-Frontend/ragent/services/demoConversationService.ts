export type DemoTurn = {
  role: "user" | "assistant";
  content: string;
};

export interface DemoConversation {
  id: string;
  title?: string | null;
  description?: string | null;
  question: string;
  answer?: string | null;
  /** 多轮对话；有则优先于 question/answer */
  turns?: DemoTurn[];
  sortOrder?: number | null;
  pinned?: number | null;
}

/** 走同源 API，避免 /api/ragent 反代 502；静默失败由路由返回静态数据 */
export async function listDemoConversations(): Promise<DemoConversation[]> {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("/api/demo-conversations", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as DemoConversation[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
