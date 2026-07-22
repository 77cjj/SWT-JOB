"use client";

import * as React from "react";
import { toast } from "sonner";

import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

type GsiCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GSI load failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GSI load failed"));
    document.head.appendChild(script);
  });
}

export type GoogleSignInButtonProps = {
  width?: number;
  className?: string;
  showSetupHints?: boolean;
  /** @deprecated 已强制 redirect，忽略此参数 */
  preferRedirect?: boolean;
  /** @deprecated popup 已移除 */
  onCredential?: (idToken: string) => void | Promise<void>;
};

/**
 * 强制 ux_mode=redirect，避免 Dialog/浏览器拦截 popup（控制台两条 GSI_LOGGER 即此问题）。
 */
export function GoogleSignInButton({
  width = 320,
  className,
  showSetupHints = false,
}: GoogleSignInButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return;
    let cancelled = false;
    const mount = containerRef.current;
    const loginUri = `${window.location.origin}/api/auth/google-callback`;

    loadGsiScript()
      .then(() => {
        if (cancelled || !mount) return;
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "redirect",
          login_uri: loginUri,
          use_fedcm_for_prompt: false,
          auto_select: false,
          // 显式禁用 One Tap，减少二次 popup
          cancel_on_tap_outside: true,
        });
        mount.innerHTML = "";
        window.google!.accounts.id.renderButton(mount, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          width,
          logo_alignment: "left",
          // 部分 GIS 版本支持；忽略未知字段无害
          click_listener: undefined,
        });
      })
      .catch(() => {
        toast.error("无法加载 Google 登录，请检查网络或广告拦截插件");
      });

    return () => {
      cancelled = true;
      if (mount) mount.innerHTML = "";
    };
  }, [width]);

  if (!GOOGLE_CLIENT_ID) return null;

  const redirectUriHint = `${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/google-callback`;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        data-google-signin="true"
        className={className ?? "flex min-h-[44px] w-full justify-center [&>div]:!w-full"}
        style={{ position: "relative", zIndex: 10_000 }}
      />
      {showSetupHints ? (
        <p className="text-center text-xs text-muted-foreground">
          将整页跳转 Google 授权。Redirect URI：
          <code className="block break-all text-[10px]">{redirectUriHint}</code>
        </p>
      ) : null}
    </div>
  );
}
