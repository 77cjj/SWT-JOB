"use client";

import { RagentProviders } from "./RagentProviders";
import { RequireAdmin } from "../../lib/ragent/guards";
import { AdminRagentShell } from "./AdminRagentShell";

export function HostedAdminPage() {
  return (
    <RagentProviders embedded>
      <RequireAdmin>
        <AdminRagentShell />
      </RequireAdmin>
    </RagentProviders>
  );
}
