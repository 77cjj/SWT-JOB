import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider, CssBaseline } from '@mui/material';
import React from 'react';
import { AppThemeProvider, useAppTheme } from '../context/AppThemeContext';
import { I18nProvider } from '../context/I18nContext';
import { createAppTheme } from '../theme/theme';
import '../index.css';
import '../ragent-local.css';
import 'nextra-theme-docs/style.css';
import '../docs.css';
import '../nextra-overrides.css';
import { Analytics } from '@vercel/analytics/next';
import { DocsRouteLoadingProvider } from '../context/DocsRouteLoadingContext';

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
      <Analytics />
    </ThemeProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDocs = router.pathname.startsWith('/docs');
  const [docsRouteLoading, setDocsRouteLoading] = React.useState(false);

  React.useEffect(() => {
    if (isDocs) {
      document.body.dataset.page = 'docs';
    } else {
      delete document.body.dataset.page;
    }
  }, [isDocs]);

  React.useEffect(() => {
    const onStart = (url: string) => {
      setDocsRouteLoading(url.startsWith('/docs'));
    };
    const onEnd = () => setDocsRouteLoading(false);

    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onEnd);
    router.events.on('routeChangeError', onEnd);
    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onEnd);
      router.events.off('routeChangeError', onEnd);
    };
  }, [router.events]);

  return (
    <I18nProvider>
      <AppThemeProvider>
        <DocsRouteLoadingProvider value={docsRouteLoading}>
          {/* @ts-expect-error - router is provided by Next.js internally */}
          <SWTApp Component={Component} pageProps={pageProps} />
          {docsRouteLoading ? (
            <div className="docs-route-progress" aria-hidden />
          ) : null}
        </DocsRouteLoadingProvider>
      </AppThemeProvider>
    </I18nProvider>
  );
}
