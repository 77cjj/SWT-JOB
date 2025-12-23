import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider, CssBaseline } from '@mui/material';
import React from 'react';
import { AppThemeProvider, useAppTheme } from '../context/AppThemeContext';
import { I18nProvider } from '../context/I18nContext';
import { createAppTheme } from '../theme/theme';
import '../index.css';
import 'nextra-theme-docs/style.css';
import '../nextra-overrides.css';

function SWTApp({ Component, pageProps }: AppProps) {
  const { mode } = useAppTheme();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  React.useEffect(() => {
    document.body.dataset.app = 'swt';
    document.body.dataset.theme = mode;
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDocs = router.pathname.startsWith('/docs');
  const isAdmin = router.pathname === '/admin';

  React.useEffect(() => {
    // 让全局 CSS 可以区分 docs 与非 docs 页面，避免覆盖 Nextra 的 light/dark 主题样式
    if (isDocs) {
      document.body.dataset.app = 'docs';
      delete document.body.dataset.theme;
    } else if (isAdmin) {
      // Admin 页面不使用任何主题
      document.body.dataset.app = 'admin';
      delete document.body.dataset.theme;
    }
  }, [isDocs, isAdmin]);

  // Admin 和 Docs 页面不应用 MUI 主题
  // Admin 页面需要禁用 StrictMode 以避免与 Decap CMS 的 DOM 操作冲突
  if (isAdmin) {
    return (
      <React.Fragment>
        <Component {...pageProps} />
      </React.Fragment>
    );
  }
  
  if (isDocs) {
    return <Component {...pageProps} />;
  }

  return (
    <I18nProvider>
      <AppThemeProvider>
        {/* @ts-expect-error - router is provided by Next.js internally */}
        <SWTApp Component={Component} pageProps={pageProps} />
      </AppThemeProvider>
    </I18nProvider>
  );
}

