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
  // 首次渲染：服务端使用 'light'，客户端会在 useEffect 中同步
  const [mode, setModeState] = React.useState<AppThemeMode>(() => {
    // SSR 时返回默认值
    if (typeof window === 'undefined') return 'light';
    // 客户端首次渲染时读取 localStorage 或系统主题
    return readStoredMode() ?? getSystemMode();
  });

  // 客户端挂载后立即同步主题，确保与 localStorage 一致
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = readStoredMode();
    if (stored && stored !== mode) {
      // 如果 localStorage 中的主题与当前状态不一致，立即同步
      setModeState(stored);
    } else if (!stored) {
      // 如果没有存储的主题，使用系统主题
      const systemMode = getSystemMode();
      if (systemMode !== mode) {
        setModeState(systemMode);
      }
    }
  }, []); // 只在挂载时执行一次

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
    // 如果已经有存储的主题，不跟随系统主题
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