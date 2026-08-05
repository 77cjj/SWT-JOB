"use client";

import { RagentProviders } from "./RagentProviders";
import { RedirectIfAuthed } from "../../lib/ragent/guards";
import { RegisterPage } from "@/pages/RegisterPage";

/**
 * 独立全屏注册页，样式与 HostedLoginPage 对齐。
 */
export function HostedRegisterPage() {
  return (
    <div className="ragent-login-scope min-h-[100svh] w-full text-slate-900 dark:text-neutral-100">
      <RagentProviders embedded>
        <RedirectIfAuthed>
          <RegisterPage />
        </RedirectIfAuthed>
      </RagentProviders>
    </div>
  );
}
