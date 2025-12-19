import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider, CssBaseline } from '@mui/material';
import React from 'react';
import { AppThemeProvider, useAppTheme } from '../context/AppThemeContext';
import { createAppTheme } from '../theme/theme';
import '../index.css';
import 'nextra-theme-docs/style.css';
import '../nextra-overrides.css';

function SWTApp({ Component, pageProps }: AppProps) {
  const { mode } = useAppTheme();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  // 同步主题到 body 的 data 属性，用于 CSS 选择器
  React.useEffect(() => {
    document.body.dataset.app = 'swt';
    document.body.dataset.theme = mode;
    // 确保 body 的背景色与主题一致，避免闪烁
    if (mode === 'dark') {
      document.body.style.backgroundColor = '#0a0a0a';
      document.body.style.color = '#f5f5f5';
    } else {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#111827';
    }
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

  React.useEffect(() => {
    // 让全局 CSS 可以区分 docs 与非 docs 页面，避免覆盖 Nextra 的 light/dark 主题样式
    if (isDocs) {
      document.body.dataset.app = 'docs';
      delete document.body.dataset.theme;
    }
  }, [isDocs]);

  // Docs 交给 Nextra 控制主题；避免被 MUI 覆盖
  if (isDocs) {
    return <Component {...pageProps} />;
  }

  return (
    <AppThemeProvider>
      <SWTApp Component={Component} pageProps={pageProps} />
    </AppThemeProvider>
  );
}

