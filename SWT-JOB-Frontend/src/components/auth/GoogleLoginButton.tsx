'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import type { GoogleOAuthProfile } from '../../lib/member/types';

function decodeJwtPayload(token: string): GoogleOAuthProfile | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json) as GoogleOAuthProfile;
    return data;
  } catch {
    return null;
  }
}

function GoogleLoginInner() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google 登录未配置。请在环境变量中设置 NEXT_PUBLIC_GOOGLE_CLIENT_ID。
      </p>
    );
  }

  return (
    <GoogleLogin
      onSuccess={(response) => {
        if (!response.credential) {
          toast.error('Google 登录失败');
          return;
        }
        const profile = decodeJwtPayload(response.credential);
        if (!profile?.sub) {
          toast.error('无法解析 Google 账号信息');
          return;
        }
        void loginWithGoogle(profile).then(() => {
          void router.push('/chat');
        });
      }}
      onError={() => toast.error('Google 登录失败')}
      theme="outline"
      size="large"
      width="100%"
      text="signin_with"
      shape="rectangular"
    />
  );
}

export function GoogleLoginButton() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return <GoogleLoginInner />;
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLoginInner />
    </GoogleOAuthProvider>
  );
}
