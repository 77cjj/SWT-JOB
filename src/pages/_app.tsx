import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider, CssBaseline } from '@mui/material';
import React from 'react';
import { theme } from '../theme/theme';
import '../index.css';
import 'nextra-theme-docs/style.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDocs = router.pathname.startsWith('/docs');

  React.useEffect(() => {
    // 让全局 CSS 可以区分 docs 与非 docs 页面，避免覆盖 Nextra 的 light/dark 主题样式
    document.body.dataset.app = isDocs ? 'docs' : 'swt';
  }, [isDocs]);

  // Docs 交给 Nextra 控制主题；避免被 MUI 的 dark Theme + CssBaseline 覆盖
  if (isDocs) {
    return <Component {...pageProps} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

