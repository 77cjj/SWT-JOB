"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import DesktopLayout from "../layout/desktop/Layout";
import MobileLayout from "../layout/mobile/Layout";
import useDevice from "../hooks/useDevice";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "../context/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * /register：独立注册页（用户名 + 邮箱 + 密码），注册成功后跳转目标页。
 */
export default function RegisterPage() {
  const router = useRouter();
  const isMobile = useDevice();
  const { t } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const redirectTarget = () => {
    if (typeof router.query.redirect === "string" && router.query.redirect.startsWith("/")) {
      return router.query.redirect;
    }
    return "/chat";
  };

  useEffect(() => {
    if (!router.isReady || !isAuthenticated) return;
    void router.replace(redirectTarget());
  }, [isAuthenticated, router.isReady, router.query.redirect]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!username || !password) {
      setLocalError(t("auth.needUsernamePassword"));
      return;
    }
    if (!email) {
      setLocalError(t("auth.needEmail"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError(t("auth.emailInvalid"));
      return;
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fff]{3,32}$/.test(username)) {
      setLocalError(t("auth.usernameInvalid"));
      return;
    }
    if (password.length < 6 || password.length > 64) {
      setLocalError(t("auth.passwordLengthInvalid"));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t("auth.passwordMismatch"));
      return;
    }

    try {
      await register(username, password, email);
      void router.replace(redirectTarget());
    } catch {
      // toast handled in store
    }
  };

  const content = (
    <div className="relative min-h-[70vh] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 480px at 12% -10%, rgba(14, 116, 144, 0.16), transparent 55%), radial-gradient(900px 420px at 88% 0%, rgba(180, 83, 9, 0.12), transparent 50%), linear-gradient(180deg, #f7f4ef 0%, #eef2f4 42%, #f8fafb 100%)",
        }}
      />
      <div className="mx-auto flex max-w-lg flex-col px-4 py-10 sm:py-14">
        <p className="font-display text-sm font-semibold tracking-[0.18em] text-cyan-900/70 uppercase">
          SWT Job
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {t("auth.registerDesc")}
        </p>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-8 space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6"
        >
          <div className="relative">
            <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("auth.usernameHint")}
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              className="pl-10"
              autoComplete="username"
              aria-label={t("auth.username")}
            />
          </div>

          <div className="relative">
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="pl-10"
              autoComplete="email"
              aria-label={t("auth.email")}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.newPasswordPlaceholder")}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="pr-10 pl-10"
              autoComplete="new-password"
              aria-label={t("auth.password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
              aria-label={t("auth.showPassword")}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="pl-10"
              autoComplete="new-password"
              aria-label={t("auth.confirmPassword")}
            />
          </div>

          {localError ? <p className="text-sm text-red-600">{localError}</p> : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("auth.registering") : t("auth.register")}
          </Button>

          <p className="pt-1 text-center text-sm text-slate-600">
            {t("auth.hasAccount")}{" "}
            <button
              type="button"
              className="font-medium text-slate-900 underline-offset-2 hover:underline"
              onClick={() => openLoginDialog()}
            >
              {t("auth.goLogin")}
            </button>
          </p>

          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/">{t("auth.backHome")}</Link>
          </Button>
        </form>
      </div>
    </div>
  );

  return isMobile ? <MobileLayout>{content}</MobileLayout> : <DesktopLayout>{content}</DesktopLayout>;
}
