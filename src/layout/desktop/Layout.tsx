import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { type PropsWithChildren } from 'react';
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { DarkMode, LightMode, Language as LanguageIcon } from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n/types';

interface DesktopLayoutProps extends PropsWithChildren {
  /**
   * 控制页面内容容器最大宽度（只影响本 Layout 包裹的页面）
   * 例如：'max-w-6xl' | 'max-w-7xl' | 'max-w-[90rem]'
   */
  maxWidthClassName?: string;
}

export default function DesktopLayout({ children, maxWidthClassName = 'max-w-6xl' }: DesktopLayoutProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const { mode, toggleMode } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const [langMenuAnchor, setLangMenuAnchor] = React.useState<null | HTMLElement>(null);

  const isDark = mode === 'dark';
  const rootClass = isDark
    ? 'min-h-screen bg-neutral-950 text-neutral-100'
    : 'min-h-screen bg-white text-neutral-900';
  const headerBorderClass = isDark ? 'border-neutral-800/60' : 'border-neutral-200';
  const navTextClass = isDark ? 'text-neutral-400' : 'text-neutral-600';
  const linkHoverClass = isDark ? 'hover:text-neutral-100' : 'hover:text-neutral-900';
  const linkActiveClass = isDark ? 'text-neutral-100 font-semibold' : 'text-neutral-900 font-semibold';

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

  return (
    <div className={rootClass}>
      <header className={`border-b px-8 py-5 ${headerBorderClass}`}>
        <div className={`mx-auto flex ${maxWidthClassName} items-center justify-between`}>
          <h1 className="text-2xl font-semibold tracking-wide">SWT Helper</h1>
          <div className="flex items-center gap-4">
            <nav className={`flex gap-6 text-sm uppercase ${navTextClass}`}>
              <Link
                href="/"
                className={`transition-colors ${linkHoverClass} ${pathname === '/' ? linkActiveClass : ''}`}
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/jobs"
                className={`transition-colors ${linkHoverClass} ${pathname === '/jobs' ? linkActiveClass : ''}`}
              >
                {t('nav.jobs')}
              </Link>
              <Link
                href="/docs"
                className={`transition-colors ${linkHoverClass} ${
                  pathname.startsWith('/docs') ? linkActiveClass : ''
                }`}
              >
                {t('nav.docs')}
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Tooltip title={t('language.switch')}>
                <IconButton
                  size="small"
                  onClick={handleLangMenuOpen}
                  color="inherit"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 999,
                  }}
                >
                  <LanguageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 999,
                  }}
                >
                  {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>
      <main className={`mx-auto ${maxWidthClassName} px-8 py-10 pt-5`}>{children}</main>
    </div>
  );
}

