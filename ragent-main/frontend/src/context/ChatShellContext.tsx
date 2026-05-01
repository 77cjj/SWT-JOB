import { createContext, useContext, type ReactNode } from "react";

export type ChatShellValue = {
  /** 为 true 时用户菜单由 SWT 顶栏展示，侧栏底部收起 */
  userMenuInTopNav: boolean;
};

const ChatShellContext = createContext<ChatShellValue>({ userMenuInTopNav: false });

export function ChatShellProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChatShellValue;
}) {
  return <ChatShellContext.Provider value={value}>{children}</ChatShellContext.Provider>;
}

export function useChatShell(): ChatShellValue {
  return useContext(ChatShellContext);
}
