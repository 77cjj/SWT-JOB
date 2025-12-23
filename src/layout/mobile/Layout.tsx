import React, { type PropsWithChildren } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import {
  DarkMode,
  LightMode,
  Language as LanguageIcon,
  BarChartRounded,
  HistoryRounded,
  MenuBookRounded,
} from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n/types';

export default function MobileLayout({ children }: PropsWithChildren) {
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

  const navLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
    return `flex flex-col items-center gap-0.5 px-2 py-2 text-[11px] leading-tight transition-colors ${
      isActive
        ? isDark
          ? 'text-indigo-400'
          : 'text-indigo-600'
        : isDark
          ? 'text-neutral-400'
          : 'text-neutral-600'
    }`;
  };

  const navLabel = (key: 'home' | 'jobs' | 'docs') => {
    const full = t(`nav.${key}`);
    // 中文保留前两个字，英文/其他语言取第一个单词，避免在小屏溢出
    if (language === 'zh') {
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
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isDark ? 'border-neutral-800/60' : 'border-neutral-200'
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
          <Tooltip title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              size="small"
              onClick={toggleMode}
              color="inherit"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 pb-20">{children}</main>
      <nav
        className={`fixed bottom-0 left-0 right-0 border-t ${
          isDark ? 'border-neutral-800/60 bg-neutral-950' : 'border-neutral-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-around py-1.5">
          <Link href="/" className={navLinkClass('/')}>
            <BarChartRounded fontSize="small" />
            <span>{navLabel('home')}</span>
          </Link>
          <Link href="/jobs" className={navLinkClass('/jobs')}>
            <HistoryRounded fontSize="small" />
            <span>{navLabel('jobs')}</span>
          </Link>
          <Link href="/docs" className={navLinkClass('/docs')}>
            <MenuBookRounded fontSize="small" />
            <span>{navLabel('docs')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

