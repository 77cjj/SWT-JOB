/* eslint-disable react-refresh/only-export-components */
import React from 'react';

export type AppThemeMode = 'light' | 'dark';

interface AppThemeContextValue {
  mode: AppThemeMode;
  setMode: (mode: AppThemeMode) => void;
  toggleMode: () => void;
}

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null);

const STORAGE_KEY = 'swt-theme-mode';

function readStoredMode(): AppThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function getSystemMode(): AppThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  // 首次渲染：优先 localStorage；没有则跟随系统主题
  const [mode, setModeState] = React.useState<AppThemeMode>(() => readStoredMode() ?? getSystemMode());

  const setMode = React.useCallback((next: AppThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleMode = React.useCallback(() => {
    setModeState((prev) => {
      const next: AppThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 仅当用户没有手动保存主题时，才跟随系统主题变化
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (readStoredMode()) return;

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;

    const handler = () => setModeState(mq.matches ? 'dark' : 'light');

    // 初始化一次，避免系统主题切换前状态不一致
    handler();

    try {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      // Safari 老版本
      mq.addListener?.(handler);
      return () => {
        mq.removeListener?.(handler);
      };
    }
  }, []);

  const value = React.useMemo<AppThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = React.useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}