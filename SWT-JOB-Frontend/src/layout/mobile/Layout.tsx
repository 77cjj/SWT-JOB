import React, { type PropsWithChildren } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import {
  DarkMode,
  LightMode,
  Language as LanguageIcon,
  BarChartRounded,
  HistoryRounded,
  MenuBookRounded,
  SmartToyRounded,
  LocalOfferRounded,
} from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n/types';
import { cn } from '../../../ragent/lib/utils';

const RagentChatUserMenu = dynamic(
  () =>
    import('../../components/ragent/RagentChatUserMenu').then((m) => m.RagentChatUserMenu),
  { ssr: false },
);

interface MobileLayoutProps extends PropsWithChildren {
  mainClassName?: string;
}

type NavKey = 'home' | 'jobs' | 'docs' | 'chat' | 'deals';

const NAV_ITEMS: { key: NavKey; href: string; icon: React.ReactNode; match: (path: string) => boolean }[] = [
  { key: 'home', href: '/compare', icon: <BarChartRounded fontSize="small" />, match: (p) => p === '/compare' },
  { key: 'jobs', href: '/jobs', icon: <HistoryRounded fontSize="small" />, match: (p) => p === '/jobs' || p.startsWith('/jobs/') },
  { key: 'chat', href: '/', icon: <SmartToyRounded fontSize="small" />, match: (p) => p === '/' || p.startsWith('/chat') },
  { key: 'deals', href: '/deals', icon: <LocalOfferRounded fontSize="small" />, match: (p) => p === '/deals' || p.startsWith('/deals/') },
  { key: 'docs', href: '/docs', icon: <MenuBookRounded fontSize="small" />, match: (p) => p.startsWith('/docs') },
];

export default function MobileLayout({ children, mainClassName }: MobileLayoutProps) {
  const { mode, toggleMode } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const router = useRouter();
  const pathname = router.pathname;
  const isDark = mode === 'dark';
  const [langMenuAnchor, setLangMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleLangMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangMenuAnchor(event.currentTarget);
  };

  const handleLangMenuClose = () => {
    setLangMenuAnchor(null);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as Language);
    handleLangMenuClose();
  };

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
      className={`flex min-h-screen flex-col ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-white text-neutral-900'
      }`}
    >
      <header
        className={`sticky top-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md ${
          isDark
            ? 'border-neutral-800/60 bg-neutral-950/85 supports-[backdrop-filter]:bg-neutral-950/70'
            : 'border-neutral-200 bg-white/85 supports-[backdrop-filter]:bg-white/70'
        }`}
      >
        <h1 className="text-lg font-semibold">SWT Helper</h1>
        <div className="flex items-center gap-2">
          <IconButton
            size="small"
            onClick={handleLangMenuOpen}
            color="inherit"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <LanguageIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={langMenuAnchor}
            open={Boolean(langMenuAnchor)}
            onClose={handleLangMenuClose}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <MenuItem
                key={lang.code}
                selected={language === lang.code}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.nativeName}
              </MenuItem>
            ))}
          </Menu>
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
          {pathname !== '/login' ? <RagentChatUserMenu /> : null}
        </div>
      </header>
      <main
        className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]', mainClassName)}
      >
        {children}
      </main>
      <nav
        className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)] ${
          isDark ? 'border-neutral-800/60 bg-neutral-950' : 'border-neutral-200 bg-white'
        }`}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-stretch px-1 py-1">
          {NAV_ITEMS.map((item) => {
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
