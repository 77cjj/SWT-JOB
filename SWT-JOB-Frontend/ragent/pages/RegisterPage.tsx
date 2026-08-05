import * as React from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";

export function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const username = form.username.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    if (!username || !password) {
      setError("请输入用户名和密码。");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位。");
      return;
    }
    try {
      await register(username, password);
      void router.push("/chat");
    } catch (err) {
      setError((err as Error).message || "注册失败，请稍后重试。");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/70 bg-background/80 p-8 shadow-soft backdrop-blur">
        <div className="mb-6">
          <p className="font-display text-2xl font-semibold">创建账号</p>
          <p className="mt-1 text-sm text-muted-foreground">
            注册后写入本站数据库，可立即使用账号密码登录。
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              用户名
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="3-32 位字母、数字、下划线或中文"
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                className="pl-10"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="至少 6 位"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="pl-10 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                aria-label="显示或隐藏密码"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="再输入一次密码"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "正在注册..." : "注册并登录"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-2 hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
