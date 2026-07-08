import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { currentSessionId, sessions } = useChatStore();
  const currentSession = React.useMemo(
    () => sessions.find((session) => session.id === currentSessionId),
    [sessions, currentSessionId]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            aria-label="切换侧边栏"
            className="text-gray-500 hover:bg-gray-100 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="text-base font-medium text-gray-900 dark:text-neutral-100">
            {currentSession?.title || "新对话"}
          </p>
        </div>
      </div>
    </header>
  );
}
