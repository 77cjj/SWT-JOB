import React, { type PropsWithChildren } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { IconButton, Tooltip } from '@mui/material';
import {
  DarkMode,
  LightMode,
  BarChartRounded,
  HistoryRounded,
  MenuBookRounded,
  SmartToyRounded,
  LocalOfferRounded,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { useSiteFeatures } from '../../context/SiteFeaturesContext';
import type { SiteFeatureKey } from '../../lib/site/siteFeaturesApi';
import { cn } from '../../../ragent/lib/utils';
import { LanguageMenu } from '../../components/common/LanguageMenu';

const RagentChatUserMenu = dynamic(
  () =>
    import('../../components/ragent/RagentChatUserMenu').then((m) => m.RagentChatUserMenu),
  { ssr: false },
);

interface MobileLayoutProps extends PropsWithChildren {
  mainClassName?: string;
  /** 例如聊天页锁定视口高度，避免整页滚动卡住 */
  rootClassName?: string;
}

type NavKey = 'home' | 'jobs' | 'docs' | 'chat' | 'deals';

const NAV_ITEMS: {
  key: NavKey;
  feature: SiteFeatureKey;
  href: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}[] = [
  { key: 'chat', feature: 'chat', href: '/', icon: <SmartToyRounded fontSize="small" />, match: (p) => p === '/' || p.startsWith('/chat') },
  { key: 'deals', feature: 'deals', href: '/deals', icon: <LocalOfferRounded fontSize="small" />, match: (p) => p === '/deals' || p.startsWith('/deals/') },
  { key: 'home', feature: 'compare', href: '/compare', icon: <BarChartRounded fontSize="small" />, match: (p) => p === '/compare' },
  { key: 'jobs', feature: 'jobs', href: '/jobs', icon: <HistoryRounded fontSize="small" />, match: (p) => p === '/jobs' || p.startsWith('/jobs/') },
  { key: 'docs', feature: 'docs', href: '/docs', icon: <MenuBookRounded fontSize="small" />, match: (p) => p.startsWith('/docs') },
];

export default function MobileLayout({ children, mainClassName, rootClassName }: MobileLayoutProps) {
  const { mode, toggleMode } = useAppTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const pathname = router.pathname;
  const isDark = mode === 'dark';
  const authDialogOpen = useAuthStore((s) => s.loginDialogOpen);
  const { isFeatureEnabled } = useSiteFeatures();
  // 高于维护毛玻璃（1200），保证顶栏始终可点返回
  const headerZ = authDialogOpen ? 'z-[1600]' : 'z-[1300]';

  const visibleNav = NAV_ITEMS.filter((item) => isFeatureEnabled(item.feature));
  const navLabel = (key: NavKey) => {
    const full = t(`nav.${key}`);
    if (language === 'zh') {
      if (key === 'deals') return '羊毛';
      return full.slice(0, 2);
    }
    return full.split(' ')[0];
  };

  return (
    <div
      className={cn(
        'flex min-h-[100dvh] flex-col',
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-neutral-900',
        rootClassName,
      )}
      style={{ ['--app-header-height' as string]: '56px', ['--app-bottom-nav-height' as string]: '5rem' }}
    >
      <header
        className={`sticky top-0 ${headerZ} flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur-md ${
          isDark
            ? 'border-neutral-800/60 bg-neutral-950/85 supports-[backdrop-filter]:bg-neutral-950/70'
            : 'border-neutral-200 bg-white/85 supports-[backdrop-filter]:bg-white/70'
        }`}
      >
        <h1 className="text-lg font-semibold">SWT Helper</h1>
        <div className="flex items-center gap-2">
          <LanguageMenu />
          <Tooltip title={t('theme.toggle')}>
            <IconButton
              size="small"
              onClick={toggleMode}
              color="inherit"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          <RagentChatUserMenu />
        </div>
      </header>
      <main
        className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]', mainClassName)}
      >
        {children}
      </main>
      <nav
        aria-label="移动端主导航"
        className={`mobile-bottom-nav fixed inset-x-0 bottom-0 z-[1300] shrink-0 border-t pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] ${
          isDark ? 'border-neutral-800/60 bg-neutral-950/95' : 'border-neutral-200 bg-white/95'
        }`}
      >
        <div
          className="mx-auto grid max-w-lg items-stretch px-1 py-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(visibleNav.length, 1)}, minmax(0, 1fr))` }}
        >
          {visibleNav.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'mobile-nav-item group relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-tight transition-all duration-200 ease-out active:scale-95',
                  isActive
                    ? isDark
                      ? 'text-indigo-400'
                      : 'text-indigo-600'
                    : isDark
                      ? 'text-neutral-400'
                      : 'text-neutral-600',
                )}
              >
                <span
                  className={cn(
                    'mobile-nav-icon flex items-center justify-center transition-transform duration-200 ease-out',
                    isActive ? 'scale-110' : 'group-hover:scale-105',
                  )}
                >
                  {item.icon}
                </span>
                <span className="max-w-full truncate px-0.5">{navLabel(item.key)}</span>
                <span
                  className={cn(
                    'mobile-nav-indicator absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-indigo-500 transition-all duration-300 ease-out',
                    isActive ? 'w-5 opacity-100' : 'w-0 opacity-0',
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
