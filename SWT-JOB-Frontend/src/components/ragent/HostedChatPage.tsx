"use client";

import * as React from "react";

import DesktopLayout from "../../layout/desktop/Layout";
import MobileLayout from "../../layout/mobile/Layout";
import useDevice from "../../hooks/useDevice";
import { ChatShellProvider } from "@/context/ChatShellContext";
import { ChatPage } from "@/pages/ChatPage";
import { RagentProviders } from "./RagentProviders";

export function HostedChatPage() {
  const isMobile = useDevice();

  React.useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const content = (
    <div className="chat-hosted-shell flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
      <RagentProviders embedded>
        <ChatPage />
      </RagentProviders>
    </div>
  );

  /** 主内容区占满顶栏下剩余高度；滚动交给内部 MessageList / WelcomeScreen */
  const hostedMainClass =
    "flex min-h-0 flex-1 flex-col overflow-hidden px-8 pb-0 pt-3";
  const hostedRootClass = "h-[100dvh] max-h-[100dvh] overflow-hidden";

  return (
    <ChatShellProvider value={{ userMenuInTopNav: true, embeddedInSwt: true }}>
      {isMobile ? (
        <MobileLayout
          rootClassName="h-[100dvh] max-h-[100dvh] overflow-hidden"
          mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden !px-0 !py-0 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
        >
          {content}
        </MobileLayout>
      ) : (
        <DesktopLayout
          maxWidthClassName="max-w-7xl"
          rootClassName={hostedRootClass}
          mainClassName={hostedMainClass}
        >
          {content}
        </DesktopLayout>
      )}
    </ChatShellProvider>
  );
}
