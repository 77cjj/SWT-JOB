"use client";

import DesktopLayout from "../../layout/desktop/Layout";
import MobileLayout from "../../layout/mobile/Layout";
import useDevice from "../../hooks/useDevice";
import { RagentProviders } from "./RagentProviders";
import { RedirectIfAuthed } from "../../lib/ragent/guards";
import { LoginPage } from "@/pages/LoginPage";

export function HostedLoginPage() {
  const isMobile = useDevice();
  const inner = (
    <RagentProviders embedded>
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    </RagentProviders>
  );
  return isMobile ? <MobileLayout>{inner}</MobileLayout> : <DesktopLayout>{inner}</DesktopLayout>;
}
