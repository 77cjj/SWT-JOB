import * as React from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import { MessageItem } from "@/components/chat/MessageItem";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  sessionKey?: string | null;
}

export function MessageList({ messages, isLoading, isStreaming, sessionKey }: MessageListProps) {
  const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);
  const lastSessionRef = React.useRef<string | null>(null);
  const pendingScrollRef = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);
  const initialTopMostItemIndex = React.useMemo(
    () => ({ index: "LAST" as const, align: "end" as const }),
    []
  );

  const scrollToBottom = React.useCallback(() => {
    virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    const nextKey = sessionKey ?? "empty";
    if (lastSessionRef.current !== nextKey) {
      lastSessionRef.current = nextKey;
      pendingScrollRef.current = true;
      setAtBottom(true);
    }
  }, [sessionKey]);

  React.useEffect(() => {
    if (!pendingScrollRef.current || isStreaming || isLoading || messages.length === 0) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      scrollToBottom();
      pendingScrollRef.current = false;
    });
    return () => window.cancelAnimationFrame(raf);
  }, [messages.length, isStreaming, isLoading, sessionKey]);

  const List = React.useMemo(() => {
    const Comp = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
      ({ className, ...props }, ref) => (
        <div
          ref={ref}
          className={cn("mx-auto max-w-[800px] px-6 pt-10 pb-2 md:px-8", className)}
          {...props}
        />
      )
    );
    Comp.displayName = "MessageList";
    return Comp;
  }, []);

  const Footer = React.useMemo(() => {
    const Comp = () => <div aria-hidden="true" className="h-8" />;
    Comp.displayName = "MessageListFooter";
    return Comp;
  }, []);

  const itemContent = React.useCallback(
    (index: number, message: Message) => (
      <div
        className={cn(
          index > 0 && "mt-10"
        )}
      >
        <MessageItem message={message} isLast={index === messages.length - 1} />
      </div>
    ),
    [messages.length]
  );

  if (messages.length === 0) {
    if (isLoading) {
      return <div className="h-full min-h-0" />;
    }
    return <WelcomeScreen />;
  }

  return (
    <Virtuoso
      key={sessionKey ?? "empty"}
      ref={virtuosoRef}
      data={messages}
      initialTopMostItemIndex={initialTopMostItemIndex}
      atBottomThreshold={150}
      defaultItemHeight={96}
      increaseViewportBy={{ top: 120, bottom: 240 }}
      computeItemKey={(_index, item) => item.id}
      atBottomStateChange={setAtBottom}
      followOutput={() => (pendingScrollRef.current || atBottom || isStreaming ? "smooth" : false)}
      className="h-full min-h-0"
      components={{ List, Footer }}
      itemContent={itemContent}
    />
  );
}
