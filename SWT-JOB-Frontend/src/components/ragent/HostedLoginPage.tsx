"use client";

import { RagentProviders } from "./RagentProviders";
import { RedirectIfAuthed } from "../../lib/ragent/guards";
import { LoginPage } from "@/pages/LoginPage";

/**
 * 独立全屏登录：避免塞进主站顶栏/max-width main 后与卡片布局打架；
 * `.ragent-login-scope` 用于撤销主站对原生 button 的全局样式。
 */
export function HostedLoginPage() {
  return (
    <div className="ragent-login-scope min-h-[100svh] w-full text-slate-900 dark:text-neutral-100">
      <RagentProviders embedded>
        <RedirectIfAuthed>
          <LoginPage />
        </RedirectIfAuthed>
      </RagentProviders>
    </div>
  );
}
