import type { PropsWithChildren } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useAppTheme } from '../../context/AppThemeContext';

export default function MobileLayout({ children }: PropsWithChildren) {
  const { mode, toggleMode } = useAppTheme();
  const isDark = mode === 'dark';

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
        <h1 className="text-lg font-semibold">SWT Job Picker · Mobile</h1>
        <Tooltip title={isDark ? '切换到亮色' : '切换到暗色'}>
          <IconButton
            size="small"
            onClick={toggleMode}
            color="inherit"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
      <footer
        className={`border-t px-4 py-3 text-xs ${
          isDark ? 'border-neutral-800/60 text-neutral-400' : 'border-neutral-200 text-neutral-500'
        }`}
      >
        © {new Date().getFullYear()} SWT · All rights reserved
      </footer>
    </div>
  );
}

