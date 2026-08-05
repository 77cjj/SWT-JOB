import type { Language } from './types';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './types';

/** 与 I18nContext 共用的 localStorage key */
export const UI_LANGUAGE_STORAGE_KEY = 'swt-language';

/**
 * 在非 React 上下文（如 zustand store）读取当前网站语言。
 * SSR / 无 window 时回退默认语言。
 */
export function readUiLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((lang) => lang.code === saved)) {
      return saved as Language;
    }
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
}
