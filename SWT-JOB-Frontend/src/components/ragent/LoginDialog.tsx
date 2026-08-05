'use client';

import * as React from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ENABLE_OAUTH_LOGIN,
  GOOGLE_CLIENT_ID,
} from '@/config/runtimeEnv';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';
import { WeChatSignInButton } from '@/components/auth/WeChatSignInButton';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '../../context/I18nContext';
import { useSupportWidgetStore } from '../../stores/supportWidgetStore';

export function LoginDialog() {
  const { t, tWithParams } = useI18n();
  const open = useAuthStore((s) => s.loginDialogOpen);
  const mode = useAuthStore((s) => s.authDialogMode);
  const reason = useAuthStore((s) => s.loginDialogReason);
  const closeLoginDialog = useAuthStore((s) => s.closeLoginDialog);
  const setAuthDialogMode = useAuthStore((s) => s.setAuthDialogMode);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const requestSupportOpen = useSupportWidgetStore((s) => s.requestOpen);

  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = React.useState<string | null>(null);

  const isRegister = mode === 'register';

  React.useEffect(() => {
    if (!open) {
      setForm({ username: '', password: '', confirmPassword: '' });
      setLocalError(null);
      setShowPassword(false);
    }
  }, [open]);

  React.useEffect(() => {
    setLocalError(null);
  }, [mode]);

  const handleClose = () => {
    if (isLoading) return;
    closeLoginDialog();
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    if (!form.username.trim() || !form.password.trim()) {
      setLocalError(t('auth.needUsernamePassword'));
      return;
    }
    try {
      await login(form.username.trim(), form.password.trim());
      closeLoginDialog();
    } catch {
      // toast handled in store
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    const username = form.username.trim();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    if (!username || !password) {
      setLocalError(t('auth.needUsernamePassword'));
      return;
    }
    if (password.length < 6) {
      setLocalError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t('auth.passwordMismatch'));
      return;
    }
    try {
      await register(username, password);
      closeLoginDialog();
    } catch {
      // toast handled in store
    }
  };

  const handleForgotPassword = () => {
    const name = form.username.trim() || t('auth.usernameUnset');
    closeLoginDialog();
    requestSupportOpen('human', tWithParams('auth.forgotPasswordDraft', { username: name }));
    toast.message(t('auth.forgotPasswordToast'));
  };

  return (
    <Dialog
      open={open}
      // 非 modal：顶栏语言切换在弹窗打开时仍可点击；点叉关闭后留在当前页
      modal={false}
      onOpenChange={(next) => (!next ? handleClose() : undefined)}
    >
      <DialogContent
        className="max-w-md rounded-2xl border-border/70 bg-background/95 p-0 shadow-xl backdrop-blur"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (
            target?.closest('header') ||
            target?.closest('.MuiMenu-root') ||
            target?.closest('.MuiPopover-root') ||
            target?.closest('.MuiModal-root')
          ) {
            event.preventDefault();
            return;
          }
          if (!ENABLE_OAUTH_LOGIN) return;
          if (target?.closest('[data-google-signin]') || target?.closest('iframe[src*="accounts.google.com"]')) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          // 允许点击顶栏语言菜单等控件，不强制关掉弹窗
          const target = event.target as HTMLElement | null;
          if (
            target?.closest('header') ||
            target?.closest('.MuiMenu-root') ||
            target?.closest('.MuiPopover-root') ||
            target?.closest('.MuiModal-root')
          ) {
            event.preventDefault();
            return;
          }
          if (!ENABLE_OAUTH_LOGIN) return;
          if (target?.closest('[data-google-signin]') || target?.closest('iframe[src*="accounts.google.com"]')) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-2 px-6 pt-6 text-left">
          <DialogTitle className="font-display text-xl">
            {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? t('auth.registerDesc')
              : reason || t('auth.loginDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-2">
          {!isRegister && ENABLE_OAUTH_LOGIN ? (
            <div className="space-y-2">
              {GOOGLE_CLIENT_ID ? (
                <div className="flex flex-col items-center gap-1">
                  <GoogleSignInButton
                    width={300}
                    preferRedirect
                    showSetupHints={false}
                    className="flex min-h-[44px] w-full max-w-[300px] justify-center [&>div]:!w-full"
                  />
                </div>
              ) : null}
              <AppleSignInButton />
              <WeChatSignInButton />
              <p className="text-center text-xs text-muted-foreground">{t('auth.oauthHint')}</p>
            </div>
          ) : null}

          {!isRegister && ENABLE_OAUTH_LOGIN ? (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.orPassword')}</span>
              </div>
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={isRegister ? handleRegister : handlePasswordLogin}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  isRegister ? t('auth.usernameHint') : t('auth.usernamePlaceholder')
                }
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="pl-10"
                autoComplete="username"
                aria-label={t('auth.username')}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={
                  isRegister ? t('auth.newPasswordPlaceholder') : t('auth.passwordPlaceholder')
                }
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="pl-10 pr-10"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                aria-label={t('auth.password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={t('auth.showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isRegister ? (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="pl-10"
                  autoComplete="new-password"
                  aria-label={t('auth.confirmPassword')}
                />
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={handleForgotPassword}
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}
            {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isRegister
                ? isLoading
                  ? t('auth.registering')
                  : t('auth.register')
                : isLoading
                  ? t('auth.loggingIn')
                  : t('auth.login')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => setAuthDialogMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? t('auth.goLogin') : t('auth.goRegister')}
            </button>
          </p>

          <Button type="button" variant="ghost" className="w-full" onClick={handleClose}>
            {t('auth.continueBrowsing')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
