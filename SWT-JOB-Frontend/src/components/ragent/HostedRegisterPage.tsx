"use client";

import { RagentProviders } from "./RagentProviders";
import { RedirectIfAuthed } from "../../lib/ragent/guards";
import { RegisterPage } from "@/pages/RegisterPage";

export function HostedRegisterPage() {
  return (
    <div className="ragent-login-scope min-h-[100svh] w-full text-slate-900 dark:text-neutral-100">
      <RagentProviders embedded>
        <RedirectIfAuthed redirectTo="/settings/profile">
          <RegisterPage />
        </RedirectIfAuthed>
      </RagentProviders>
    </div>
  );
}
