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
          initialize: (config: {
            client_id: string;
            callback: (response: GsiCredentialResponse) => void;
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
              logo_alignment?: string;
            }
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
  onCredential: (idToken: string) => void | Promise<void>;
  width?: number;
  className?: string;
};

/**
 * 使用 Google GSI 原生 renderButton，避免 @react-oauth/google 的 iframe 在 Radix Dialog 内无法点击/弹窗。
 */
export function GoogleSignInButton({ onCredential, width = 320, className }: GoogleSignInButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onCredentialRef = React.useRef(onCredential);
  onCredentialRef.current = onCredential;

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) {
      return;
    }
    let cancelled = false;
    const mount = containerRef.current;

    loadGsiScript()
      .then(() => {
        if (cancelled || !mount) return;
        window.google!.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          use_fedcm_for_prompt: false,
          auto_select: false,
          callback: (response) => {
            if (response.credential) {
              void onCredentialRef.current(response.credential);
            } else {
              toast.error("Google 未返回登录凭证，请检查浏览器是否拦截弹窗");
            }
          },
        });
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
  }, [width]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-google-signin="true"
      className={className ?? "flex min-h-[44px] w-full justify-center [&>div]:!w-full"}
      style={{ position: "relative", zIndex: 10_000 }}
    />
  );
}
