import * as React from "react";
import { useRouter } from "next/router";

import { SessionItem } from "@/components/session/SessionItem";
import { Loading } from "@/components/common/Loading";
import { useChatStore } from "@/stores/chatStore";

interface SessionListProps {
  onSelect?: () => void;
}

export function SessionList({ onSelect }: SessionListProps) {
  const router = useRouter();
  const { sessions, currentSessionId, isLoading, fetchSessions, deleteSession } = useChatStore();

  React.useEffect(() => {
    if (sessions.length === 0) {
      fetchSessions().catch(() => null);
    }
  }, [fetchSessions, sessions.length]);

  if (isLoading && sessions.length === 0) {
    return <Loading label="加载会话中" />;
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无会话。</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          active={currentSessionId === session.id}
          onSelect={() => {
            void router.push(`/chat/${session.id}`);
            onSelect?.();
          }}
          onDelete={() => {
            const isCurrent = currentSessionId === session.id;
            deleteSession(session.id)
              .then(() => {
                if (isCurrent) {
                  void router.push("/chat");
                }
              })
              .catch(() => null);
          }}
        />
      ))}
    </div>
  );
}
