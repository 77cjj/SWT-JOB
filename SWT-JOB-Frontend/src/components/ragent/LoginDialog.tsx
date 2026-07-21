"use client";

import * as React from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GOOGLE_CLIENT_ID } from "@/config/runtimeEnv";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthStore } from "@/stores/authStore";

export function LoginDialog() {
  const open = useAuthStore((s) => s.loginDialogOpen);
  const reason = useAuthStore((s) => s.loginDialogReason);
  const closeLoginDialog = useAuthStore((s) => s.closeLoginDialog);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({ username: "", password: "" });

  const handleClose = () => {
    if (isLoading) return;
    closeLoginDialog();
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("请输入用户名和密码");
      return;
    }
    try {
      await login(form.username.trim(), form.password.trim());
      closeLoginDialog();
    } catch {
      // toast handled in store
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? handleClose() : undefined)}>
      <DialogContent
        className="max-w-md rounded-2xl border-border/70 bg-background/95 p-0 shadow-xl backdrop-blur"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-google-signin]") || target?.closest('iframe[src*="accounts.google.com"]')) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-google-signin]") || target?.closest('iframe[src*="accounts.google.com"]')) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-2 px-6 pt-6 text-left">
          <DialogTitle className="font-display text-xl">登录后继续</DialogTitle>
          <DialogDescription>
            {reason || "登录后可使用 AI 问答、保存对话历史。不登录也可以浏览示例问题与站点内容。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center">
              <GoogleSignInButton
                width={300}
                preferRedirect={false}
                showSetupHints={false}
                className="flex min-h-[44px] w-full max-w-[300px] justify-center [&>div]:!w-full"
                onCredential={async (token) => {
                  try {
                    await useAuthStore.getState().googleLogin(token);
                    closeLoginDialog();
                  } catch {
                    // toast in store
                  }
                }}
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              未配置 Google 登录（NEXT_PUBLIC_GOOGLE_CLIENT_ID）。请先在 Vercel 与后端 .env 配置 Client ID。
            </p>
          )}

          <form className="space-y-3" onSubmit={handlePasswordLogin}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="用户名"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="pl-10"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="密码"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="显示密码"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "正在登录…" : "登录"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            体验账号：<span className="font-mono">demo</span> / <span className="font-mono">demo2026</span>
            （普通用户，非管理员）
          </p>

          <Button type="button" variant="ghost" className="w-full" onClick={handleClose}>
            暂不登录，继续浏览
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
