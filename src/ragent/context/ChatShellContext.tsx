import { createContext, useContext, type ReactNode } from "react";

export type ChatShellValue = {
  /** 为 true 时用户菜单由 SWT 顶栏展示，侧栏底部收起 */
  userMenuInTopNav: boolean;
  /** 嵌入主站时：隐藏 Ragent 自带顶栏，背景透明，由 SWT Layout 承担外壳 */
  embeddedInSwt: boolean;
};

const ChatShellContext = createContext<ChatShellValue>({
  userMenuInTopNav: false,
  embeddedInSwt: false,
});

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
