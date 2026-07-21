"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, User, X } from "lucide-react";
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
  const googleLogin = useAuthStore((s) => s.googleLogin);
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

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      await googleLogin(idToken);
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
        <DialogHeader className="relative space-y-2 px-6 pt-6 text-left">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogTitle className="font-display text-xl">登录后继续</DialogTitle>
          <DialogDescription>
            {reason || "登录后可使用 AI 问答、保存对话历史。不登录也可以浏览示例问题与站点内容。"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {GOOGLE_CLIENT_ID ? (
            <>
              <GoogleSignInButton width={280} onCredential={handleGoogleSuccess} />
              <p className="text-center text-xs text-muted-foreground">
                若按钮无反应，可能被浏览器拦截弹窗。
                <Link href="/login" className="ml-1 text-indigo-600 underline" onClick={() => closeLoginDialog()}>
                  前往全屏登录页
                </Link>
              </p>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              未配置 Google 登录（NEXT_PUBLIC_GOOGLE_CLIENT_ID）。请先在 Vercel 与后端 .env 配置 Client ID。
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            或使用账号密码
            <span className="h-px flex-1 bg-border" />
          </div>

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

          <Button type="button" variant="ghost" className="w-full" onClick={handleClose}>
            暂不登录，继续浏览
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
