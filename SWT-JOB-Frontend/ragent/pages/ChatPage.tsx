import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { ChatSessionTitle } from "../../src/components/ragent/ChatSessionTitle";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useI18n } from "../../src/context/I18nContext";

export function ChatPage() {
  const router = useRouter();
  const { t, tWithParams } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const sessionId =
    typeof router.query.sessionId === "string" ? router.query.sessionId : undefined;
  const {
    messages,
    isLoading,
    isStreaming,
    currentSessionId,
    sessions,
    isCreatingNew,
    newChatStaleSessionId,
    fetchSessions,
    selectSession,
    createSession
  } = useChatStore();
  const showWelcome = messages.length === 0 && !isLoading;
  const [sessionsReady, setSessionsReady] = React.useState(false);
  const sessionExists = React.useMemo(() => {
    if (!sessionId) return false;
    return sessions.some((session) => session.id === sessionId);
  }, [sessionId, sessions]);

  const quotaRemaining = user?.aiQuotaRemaining;
  const quotaTotal = user?.aiQuotaTotal;
  const showQuota =
    isAuthenticated &&
    typeof quotaRemaining === "number" &&
    typeof quotaTotal === "number";
  const quotaExhausted = showQuota && quotaRemaining <= 0;

  React.useEffect(() => {
    if (!isAuthenticated) {
      setSessionsReady(true);
      return;
    }
    let active = true;
    fetchSessions()
      .catch(() => null)
      .finally(() => {
        if (active) {
          setSessionsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [fetchSessions, isAuthenticated]);

  React.useEffect(() => {
    if (!sessionId) {
      useChatStore.setState({ newChatStaleSessionId: null });
    }
  }, [sessionId]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (sessionId) {
      if (sessionsReady && !sessionExists) {
        // 新建对话首条消息：onMeta 已把 currentSessionId 设为 URL 中的 id，但 listSessions 可能尚未包含该会话
        //（或 fetchSessions 刚完成并覆盖了本地 upsert）。此时不能走「无效会话」分支，否则会 createSession + 清路由并中断 SSE。
        const { currentSessionId: activeId, isStreaming } = useChatStore.getState();
        if (activeId === sessionId || isStreaming) {
          return;
        }
        createSession().catch(() => null);
        void router.replace("/chat");
        return;
      }
      const skipStaleUrlOnly =
        isCreatingNew &&
        newChatStaleSessionId != null &&
        sessionId === newChatStaleSessionId;
      if (!skipStaleUrlOnly) {
        selectSession(sessionId).catch(() => null);
      }
      return;
    }
    if (!sessionsReady) {
      return;
    }
    if (isCreatingNew) {
      return;
    }
    if (currentSessionId) {
      return;
    }
    createSession().catch(() => null);
  }, [
    isAuthenticated,
    sessionId,
    sessionsReady,
    sessionExists,
    isCreatingNew,
    newChatStaleSessionId,
    currentSessionId,
    selectSession,
    createSession,
    router
  ]);

  // 仅在仍停留在 /chat（无 session 段）但流式首包已写入 conversationId 时，把 URL 补全为 /chat/:id。
  // 绝不能在「URL 已是 /chat/B、store 里还是 A」的过渡帧里把路由 replace 回 A，否则会与侧栏切换打架。
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (!sessionId && currentSessionId) {
      void router.replace(`/chat/${currentSessionId}`);
    }
  }, [currentSessionId, sessionId, router, isAuthenticated]);

  return (
    <MainLayout>
      <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
        {/* 仅右侧主列（与侧栏并列）：标题 + 可滚动消息区 + 输入框同宽叠放，输入框不 sticky 视口、不随整页滚动，只在该列底部 */}
        <div className="mx-auto flex min-h-0 w-full max-w-[800px] flex-1 flex-col">
          {messages.length > 0 ? (
            <header className="relative shrink-0 bg-white px-6 pb-3 pt-1 dark:bg-neutral-950">
              <ChatSessionTitle />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -bottom-3 h-3 bg-gradient-to-b from-white to-transparent dark:from-neutral-950"
              />
            </header>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              isStreaming={isStreaming}
              sessionKey={currentSessionId}
            />
          </div>
          {showWelcome ? null : (
            <div className="relative shrink-0 bg-white px-6 pt-2 pb-4 dark:bg-neutral-950">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-t from-white to-transparent dark:from-neutral-950"
              />
              {showQuota ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    {quotaExhausted
                      ? t("chat.quotaExhausted")
                      : tWithParams("chat.quotaRemaining", {
                          remaining: quotaRemaining,
                          total: quotaTotal,
                        })}
                  </span>
                  {quotaExhausted ? (
                    <Link href="/pricing" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      {t("chat.viewPricing")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <ChatInput />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
