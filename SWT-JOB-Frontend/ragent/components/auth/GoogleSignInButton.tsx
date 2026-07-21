"use client";

import * as React from "react";
import { toast } from "sonner";

import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

const SHOW_AUTH_HINTS =
  process.env.NEXT_PUBLIC_AUTH_DEBUG === "1" || process.env.NODE_ENV === "development";

type GsiCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
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
  /** redirect 模式走 /api/auth/google-callback；popup 模式用 onCredential */
  onCredential?: (idToken: string) => void | Promise<void>;
  width?: number;
  className?: string;
  /** 默认 true：整页 redirect，避免弹窗被拦 */
  preferRedirect?: boolean;
  /** 生产环境默认不展示 Console 配置长文案 */
  showSetupHints?: boolean;
};

export function GoogleSignInButton({
  onCredential,
  width = 320,
  className,
  preferRedirect = true,
  showSetupHints = SHOW_AUTH_HINTS,
}: GoogleSignInButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onCredentialRef = React.useRef(onCredential);
  onCredentialRef.current = onCredential;

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) {
      return;
    }
    let cancelled = false;
    const mount = containerRef.current;
    const origin = window.location.origin;
    const loginUri = `${origin}/api/auth/google-callback`;

    loadGsiScript()
      .then(() => {
        if (cancelled || !mount) return;

        const init: Record<string, unknown> = {
          client_id: GOOGLE_CLIENT_ID,
          use_fedcm_for_prompt: false,
          auto_select: false,
        };

        if (preferRedirect) {
          init.ux_mode = "redirect";
          init.login_uri = loginUri;
        } else if (onCredentialRef.current) {
          init.callback = (response: GsiCredentialResponse) => {
            if (response.credential) {
              void onCredentialRef.current?.(response.credential);
            } else {
              toast.error("Google 未返回登录凭证");
            }
          };
        }

        window.google!.accounts.id.initialize(init);
        mount.innerHTML = "";
        window.google!.accounts.id.renderButton(mount, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          width,
          logo_alignment: "left",
        });
      })
      .catch(() => {
        toast.error("无法加载 Google 登录组件，请检查网络或广告拦截插件");
      });

    return () => {
      cancelled = true;
      if (mount) mount.innerHTML = "";
    };
  }, [width, preferRedirect]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const isPreview =
    typeof window !== "undefined" && /vercel\.app$/i.test(window.location.hostname);

  const redirectUriHint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/google-callback`
      : "/api/auth/google-callback";

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        data-google-signin="true"
        className={className ?? "flex min-h-[44px] w-full justify-center [&>div]:!w-full"}
        style={{ position: "relative", zIndex: 10_000 }}
      />
      {showSetupHints && preferRedirect ? (
        <p className="text-center text-xs text-muted-foreground">
          开发提示：redirect URI 需包含
          <code className="block break-all text-[10px]">{redirectUriHint}</code>
        </p>
      ) : null}
      {showSetupHints && isPreview ? (
        <p className="text-center text-xs text-amber-700">
          预览域名需在 Google Console 添加 JavaScript 来源与 redirect URI，或使用正式域名。
        </p>
      ) : null}
    </div>
  );
}
