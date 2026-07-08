import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { type PropsWithChildren } from 'react';
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { DarkMode, LightMode, Language as LanguageIcon } from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES, type Language } from '../../i18n/types';
import { cn } from '../../../ragent/lib/utils';

const RagentChatUserMenu = dynamic(
  () =>
    import('../../components/ragent/RagentChatUserMenu').then((m) => m.RagentChatUserMenu),
  { ssr: false },
);
interface DesktopLayoutProps extends PropsWithChildren {
  /**
   * 控制页面内容容器最大宽度（只影响本 Layout 包裹的页面）
   * 例如：'max-w-6xl' | 'max-w-7xl' | 'max-w-[90rem]'
   */
  maxWidthClassName?: string;
  /** 合并到 <main>，托管聊天页需 overflow-hidden + flex 以把高度传给侧栏/消息区 */
  mainClassName?: string;
  /** 合并到根节点；聊天页用 h-screen overflow-hidden 禁止整页滚动 */
  rootClassName?: string;
}

export default function DesktopLayout({
  children,
  maxWidthClassName = 'max-w-6xl',
  mainClassName,
  rootClassName
}: DesktopLayoutProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const { mode, toggleMode } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const [langMenuAnchor, setLangMenuAnchor] = React.useState<null | HTMLElement>(null);

  const isDark = mode === 'dark';
  const rootClass = isDark
    ? 'bg-neutral-950 text-neutral-100'
    : 'bg-white text-neutral-900';
  const rootMinH = rootClassName?.includes('h-') ? '' : 'min-h-screen';
  const headerBorderClass = isDark ? 'border-neutral-800/60' : 'border-neutral-200';
  const headerStickyClass = isDark
    ? 'sticky top-0 z-50 border-b bg-neutral-950/85 backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/70'
    : 'sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70';
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
    <div className={cn(rootClass, 'flex flex-col', rootMinH, rootClassName)}>
      <header className={`shrink-0 px-8 py-3 ${headerStickyClass} ${headerBorderClass}`}>
        <div className={`mx-auto flex ${maxWidthClassName} items-center justify-between`}>
          <h1 className="text-xl font-semibold tracking-wide">SWT Helper</h1>
          <div className="flex items-center gap-4">
            <nav className={`flex gap-6 text-sm ${navTextClass}`}>
              <Link
                href="/"
                className={`transition-colors ${linkHoverClass} ${
                  pathname === "/" || pathname.startsWith("/chat") ? linkActiveClass : ""
                }`}
              >
                {t("nav.chat")}
              </Link>
              <Link
                href="/compare"
                className={`transition-colors ${linkHoverClass} ${
                  pathname === "/compare" ? linkActiveClass : ""
                }`}
              >
                {t("nav.home")}
              </Link>
              <Link
                href="/jobs"
                className={`transition-colors ${linkHoverClass} ${
                  pathname === "/jobs" ? linkActiveClass : ""
                }`}
              >
                {t("nav.jobs")}
              </Link>
              <Link
                href="/market"
                className={`transition-colors ${linkHoverClass} ${
                  pathname === "/market" ? linkActiveClass : ""
                }`}
              >
                {t("nav.market")}
              </Link>
              <Link
                href="/deals"
                className={`transition-colors ${linkHoverClass} ${
                  pathname === "/deals" ? linkActiveClass : ""
                }`}
              >
                {t("nav.deals")}
              </Link>
              <Link
                href="/docs"
                className={`transition-colors ${linkHoverClass} ${
                  pathname.startsWith("/docs") ? linkActiveClass : ""
                }`}
              >
                {t("nav.docs")}
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
              {pathname !== '/login' ? <RagentChatUserMenu /> : null}
            </div>
          </div>
        </div>
      </header>
      <main
        className={cn(
          'mx-auto w-full flex-1 min-h-0 px-8',
          maxWidthClassName,
          mainClassName ??
            'overflow-y-auto pt-5 pb-10'
        )}
      >
        {children}
      </main>
    </div>
  );
}

