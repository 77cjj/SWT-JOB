import Link from 'next/link';
import { useRouter } from 'next/router';
import type { PropsWithChildren } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';

export default function DesktopLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = router.pathname;
  const { mode, toggleMode } = useAppTheme();

  const isDark = mode === 'dark';
  const rootClass = isDark
    ? 'min-h-screen bg-neutral-950 text-neutral-100'
    : 'min-h-screen bg-white text-neutral-900';
  const headerBorderClass = isDark ? 'border-neutral-800/60' : 'border-neutral-200';
  const navTextClass = isDark ? 'text-neutral-400' : 'text-neutral-600';
  const linkHoverClass = isDark ? 'hover:text-neutral-100' : 'hover:text-neutral-900';
  const linkActiveClass = isDark ? 'text-neutral-100 font-semibold' : 'text-neutral-900 font-semibold';

  return (
    <div className={rootClass}>
      <header className={`border-b px-10 py-6 ${headerBorderClass}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-wide">SWT Job Picker</h1>
          <div className="flex items-center gap-4">
            <nav className={`flex gap-6 text-sm uppercase ${navTextClass}`}>
              <Link
                href="/"
                className={`transition-colors ${linkHoverClass} ${pathname === '/' ? linkActiveClass : ''}`}
              >
                选岗模拟对比
              </Link>
              <Link
                href="/docs"
                className={`transition-colors ${linkHoverClass} ${
                  pathname.startsWith('/docs') ? linkActiveClass : ''
                }`}
              >
                SWT文档
              </Link>
            </nav>

            <Tooltip title={isDark ? '切换到亮色' : '切换到暗色'}>
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
      </header>
      <main className="mx-auto max-w-6xl px-10 py-12">{children}</main>
    </div>
  );
}

