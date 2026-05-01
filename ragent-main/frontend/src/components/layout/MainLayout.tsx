import * as React from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useChatShell } from "@/context/ChatShellContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { userMenuInTopNav } = useChatShell();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [hosted] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as typeof window & { __SWT_CHAT_HOSTED__?: boolean }).__SWT_CHAT_HOSTED__
    );
  });

  return (
    <div className={`flex min-h-screen ${hosted ? "bg-transparent" : "bg-[#FAFAFA]"}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hideUserMenu={userMenuInTopNav}
      />
      <div className={`flex min-h-screen flex-1 flex-col ${hosted ? "bg-transparent" : "bg-white"}`}>
        {hosted ? null : <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />}
        <main className={`flex-1 min-h-0 overflow-hidden ${hosted ? "bg-transparent" : "bg-white"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
