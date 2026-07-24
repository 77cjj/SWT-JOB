"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { WECHAT_APP_ID } from "@/config/runtimeEnv";

export function WeChatSignInButton({ className }: { className?: string }) {
  if (!WECHAT_APP_ID) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? "w-full gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200"}
      onClick={() => {
        window.location.href = "/api/auth/wechat-start";
      }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.77.93 3.33 2.36 4.24L3.5 16l2.65-.88c.73.2 1.5.31 2.35.31.28 0 .55-.02.82-.05-.17-.55-.26-1.13-.26-1.73 0-3.31 3.13-6 7-6 .34 0 .67.02 1 .06C15.94 5.64 12.6 4 8.5 4zm-2.1 4.2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.2 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM22 14.5c0-2.76-2.69-5-6-5s-6 2.24-6 5 2.69 5 6 5c.73 0 1.43-.1 2.08-.28l2.17.72-.67-1.98C21.2 17.18 22 15.92 22 14.5zm-8.4-1.1c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm3.6 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z"
        />
      </svg>
      微信扫码登录
    </Button>
  );
}
