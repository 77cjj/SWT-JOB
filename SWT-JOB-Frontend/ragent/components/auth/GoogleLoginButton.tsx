'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

function GoogleLoginInner() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google 登录未配置。请在 Vercel / 本地 .env 设置 NEXT_PUBLIC_GOOGLE_CLIENT_ID，并在服务器 .env 设置相同的 GOOGLE_CLIENT_ID。
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
        void loginWithGoogle(response.credential)
          .then(() => {
            const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/chat';
            void router.push(redirect);
          })
          .catch(() => {
            // toast 已在 store 内处理
          });
      }}
      onError={() => toast.error('Google 登录失败')}
      theme="outline"
      size="large"
      width="384"
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
