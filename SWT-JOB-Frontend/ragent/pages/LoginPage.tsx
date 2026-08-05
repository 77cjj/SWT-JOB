import * as React from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useRouter } from "next/router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores/authStore";
import {
  ENABLE_OAUTH_LOGIN,
  GOOGLE_CLIENT_ID,
} from "@/config/runtimeEnv";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppleSignInButton } from "@/components/auth/AppleSignInButton";
import { WeChatSignInButton } from "@/components/auth/WeChatSignInButton";
import { useI18n } from "../../src/context/I18nContext";

export function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { login, isLoading, openRegisterDialog, closeLoginDialog } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [form, setForm] = React.useState({ username: "", password: "" });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password.trim()) {
      setError(t("auth.needUsernamePassword"));
      return;
    }
    try {
      await login(form.username.trim(), form.password.trim());
      if (!remember) {
        // 如需仅在内存中保存登录态，可在此扩展。
      }
      void router.push("/chat");
    } catch (err) {
      setError((err as Error).message || t("auth.loginFailed"));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/70 bg-background/80 p-8 shadow-soft backdrop-blur">
        <div className="mb-6">
          <p className="font-display text-2xl font-semibold">{t("auth.loginTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginDesc")}</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("auth.username")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("auth.usernamePlaceholder")}
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                className="pl-10"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("auth.password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.passwordPlaceholder")}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                aria-label={t("auth.showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(value) => setRemember(Boolean(value))} />
              {t("auth.rememberMe")}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => {
                closeLoginDialog();
                openRegisterDialog();
                void router.replace("/chat");
              }}
            >
              {t("auth.noAccount")} {t("auth.goRegister")}
            </button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {ENABLE_OAUTH_LOGIN ? (
            <div className="space-y-2 py-1">
              {GOOGLE_CLIENT_ID ? <GoogleSignInButton width={320} /> : null}
              <AppleSignInButton />
              <WeChatSignInButton />
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("auth.loggingIn") : t("auth.login")}
          </Button>
        </form>
      </div>
    </div>
  );
}
