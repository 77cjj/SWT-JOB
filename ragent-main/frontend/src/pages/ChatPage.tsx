import * as React from "react";
import { useRouter } from "next/router";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { MainLayout } from "@/components/layout/MainLayout";
import { useChatStore } from "@/stores/chatStore";

export function ChatPage() {
  const router = useRouter();
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

  React.useEffect(() => {
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
  }, [fetchSessions]);

  React.useEffect(() => {
    if (!sessionId) {
      useChatStore.setState({ newChatStaleSessionId: null });
    }
  }, [sessionId]);

  React.useEffect(() => {
    if (sessionId) {
      if (sessionsReady && !sessionExists) {
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

  React.useEffect(() => {
    if (!sessionId && currentSessionId) {
      void router.replace(`/chat/${currentSessionId}`);
    }
  }, [currentSessionId, sessionId, router]);

  return (
    <MainLayout>
      <div className="flex h-full flex-col bg-white">
        <div className="flex-1 min-h-0">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            sessionKey={currentSessionId}
          />
        </div>
        {showWelcome ? null : (
          <div className="relative z-20 bg-white">
            <div className="mx-auto max-w-[800px] px-6 pt-1 pb-4">
              <ChatInput />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
