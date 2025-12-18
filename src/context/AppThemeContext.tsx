import React from 'react';

export type AppThemeMode = 'light' | 'dark';

interface AppThemeContextValue {
  mode: AppThemeMode;
  setMode: (mode: AppThemeMode) => void;
  toggleMode: () => void;
}

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null);

const STORAGE_KEY = 'swt-theme-mode';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<AppThemeMode>('light');

  // hydrate from localStorage (client only)
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

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


