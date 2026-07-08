/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Language } from '../i18n/types';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n/types';
import { getTranslation } from '../i18n';

const STORAGE_KEY = 'swt-language';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tWithParams: (key: string, params: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((lang) => lang.code === saved)) {
      return saved as Language;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // SSR 与 CSR 首帧统一默认语言，挂载后再读取本地缓存，避免 hydration mismatch
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      setLanguageState(readStoredLanguage());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const translation = getTranslation(language);
      const keys = key.split('.');
      let value: unknown = translation;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // 如果找不到翻译，返回 key
        }
      }

      return typeof value === 'string' ? value : key;
    },
    [language],
  );

  const tWithParams = useCallback(
    (key: string, params: Record<string, string | number>): string => {
      let text = t(key);
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue));
      });
      return text;
    },
    [t],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      tWithParams,
    }),
    [language, setLanguage, t, tWithParams],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

