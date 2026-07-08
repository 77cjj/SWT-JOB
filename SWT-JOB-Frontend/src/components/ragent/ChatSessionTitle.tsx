"use client";

import { useRouter } from "next/router";

import { useChatStore } from "@/stores/chatStore";
import { cn } from "@/lib/utils";

type ChatSessionTitleProps = {
  className?: string;
};

/**
 * 嵌入 SWT 顶栏时展示当前会话标题（与侧栏 / URL / store 对齐）
 */
export function ChatSessionTitle({ className }: ChatSessionTitleProps) {
  const router = useRouter();
  const sessionIdFromRoute =
    typeof router.query.sessionId === "string" ? router.query.sessionId : undefined;
  const { sessions, currentSessionId, isCreatingNew } = useChatStore();

  const activeId = currentSessionId ?? sessionIdFromRoute;
  const session = activeId ? sessions.find((s) => s.id === activeId) : undefined;

  const label = (() => {
    if (isCreatingNew && !sessionIdFromRoute && !currentSessionId) return "新对话";
    if (session?.title?.trim()) return session.title.trim();
    return "新对话";
  })();

  return (
    <span
      className={cn(
        "block w-full truncate text-left text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100",
        className
      )}
      title={label}
    >
      {label}
    </span>
  );
}
