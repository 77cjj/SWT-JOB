import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { type PropsWithChildren } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useAppTheme } from '../../context/AppThemeContext';
import { useI18n } from '../../context/I18nContext';
import { useSiteFeatures } from '../../context/SiteFeaturesContext';
import { cn } from '../../../ragent/lib/utils';
import { LanguageMenu } from '../../components/common/LanguageMenu';

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
  const { t } = useI18n();
  const authDialogOpen = useAuthStore((s) => s.loginDialogOpen);
  const { isFeatureEnabled } = useSiteFeatures();

  const isDark = mode === 'dark';
  const rootClass = isDark
    ? 'bg-neutral-950 text-neutral-100'
    : 'bg-white text-neutral-900';
  const rootMinH = rootClassName?.includes('h-') ? '' : 'min-h-screen';
  const headerBorderClass = isDark ? 'border-neutral-800/60' : 'border-neutral-200';
  // 登录/注册弹窗打开时抬高顶栏，保证可切换语言
  // 高于维护毛玻璃（1200），保证顶栏始终可点返回
  const headerZ = authDialogOpen ? 'z-[1600]' : 'z-[1300]';
  const headerStickyClass = isDark
    ? `sticky top-0 ${headerZ} border-b bg-neutral-950/85 backdrop-blur-md supports-[backdrop-filter]:bg-neutral-950/70`
    : `sticky top-0 ${headerZ} border-b bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/70`;
  const navTextClass = isDark ? 'text-neutral-400' : 'text-neutral-600';
  const linkHoverClass = isDark ? 'hover:text-neutral-100' : 'hover:text-neutral-900';
  const linkActiveClass = isDark ? 'text-neutral-100 font-semibold' : 'text-neutral-900 font-semibold';
  const navLinkClass = (active: boolean) =>
    cn(
      'relative whitespace-nowrap rounded-full px-3 py-1.5 transition-colors',
      linkHoverClass,
      active
        ? cn(linkActiveClass, isDark ? 'bg-white/10' : 'bg-neutral-100')
        : navTextClass,
    );

  return (
    <div
      className={cn(rootClass, 'flex flex-col', rootMinH, rootClassName)}
      style={{ ['--app-header-height' as string]: '56px', ['--app-bottom-nav-height' as string]: '0px' }}
    >
      <header className={`shrink-0 px-5 py-2.5 lg:px-8 ${headerStickyClass} ${headerBorderClass}`}>
        <div className={`mx-auto flex min-w-0 ${maxWidthClassName} items-center justify-between gap-3`}>
          <Link href="/" className="shrink-0 !text-inherit no-underline" aria-label="SWT Helper 首页">
            <span className="text-lg font-semibold tracking-wide lg:text-xl">SWT Helper</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2 lg:gap-4">
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-2" aria-label="主导航">
              {isFeatureEnabled('chat') ? (
              <Link
                href="/"
                aria-current={pathname === "/" || pathname.startsWith("/chat") ? 'page' : undefined}
                className={navLinkClass(pathname === "/" || pathname.startsWith("/chat"))}
              >
                {t("nav.chat")}
              </Link>
              ) : null}
              {isFeatureEnabled('deals') ? (
              <div className="relative group/deals">
                <Link
                  href="/deals"
                  className={`transition-colors ${linkHoverClass} ${
                    pathname === '/deals' || pathname.startsWith('/deals/') ? linkActiveClass : ''
                  }`}
                >
                  {t('nav.deals')}
                </Link>
                <div
                  className="absolute left-0 top-full z-50 hidden min-w-[9.5rem] pt-1 group-hover/deals:block"
                  role="menu"
                >
                  <div
                    className={`rounded-lg border py-1 shadow-md ${
                      isDark
                        ? 'border-neutral-800 bg-neutral-900'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <Link
                      href="/deals"
                      className={`block px-3 py-2 text-sm transition-colors ${linkHoverClass} ${
                        pathname === '/deals' ? linkActiveClass : ''
                      }`}
                      role="menuitem"
                    >
                      {t('deals.sectionOfficial')}
                    </Link>
                    <Link
                      href="/deals/market"
                      className={`block px-3 py-2 text-sm transition-colors ${linkHoverClass} ${
                        pathname === '/deals/market' ? linkActiveClass : ''
                      }`}
                      role="menuitem"
                    >
                      {t('deals.sectionMarket')}
                    </Link>
                  </div>
                </div>
              </div>
              ) : null}
              {isFeatureEnabled('compare') ? (
              <Link
                href="/compare"
                aria-current={pathname === '/compare' ? 'page' : undefined}
                className={navLinkClass(pathname === '/compare')}
              >
                {t("nav.home")}
              </Link>
              ) : null}
              {isFeatureEnabled('jobs') ? (
              <Link
                href="/jobs"
                aria-current={pathname === '/jobs' ? 'page' : undefined}
                className={navLinkClass(pathname === '/jobs')}
              >
                {t("nav.jobs")}
                <span className="absolute -right-1 -top-1 rounded-full bg-indigo-500 px-1 text-[8px] font-bold leading-3 text-white">NEW</span>
              </Link>
              ) : null}
              {isFeatureEnabled('docs') ? (
              <Link
                href="/docs"
                aria-current={pathname.startsWith('/docs') ? 'page' : undefined}
                className={navLinkClass(pathname.startsWith('/docs'))}
              >
                {t("nav.docs")}
              </Link>
              ) : null}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageMenu />

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
              <RagentChatUserMenu />
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
