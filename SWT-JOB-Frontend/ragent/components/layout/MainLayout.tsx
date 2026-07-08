import * as React from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useChatShell } from "@/context/ChatShellContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { userMenuInTopNav, embeddedInSwt } = useChatShell();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div
      className={
        embeddedInSwt
          ? "flex h-full min-h-0 w-full min-w-0 flex-1 flex-row items-stretch bg-white dark:bg-neutral-950"
          : "flex min-h-screen bg-[#FAFAFA] dark:bg-neutral-950"
      }
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hideUserMenu={userMenuInTopNav}
      />
      <div
        className={
          embeddedInSwt
            ? "flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-neutral-950"
            : "flex min-h-screen flex-1 flex-col bg-white dark:bg-neutral-950"
        }
      >
        {embeddedInSwt ? null : <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />}
        <main
          className={
            embeddedInSwt
              ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-950"
              : "flex flex-1 min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-950"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
