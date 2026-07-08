import type { Language } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';

export type TranslationKey = keyof typeof zh;

export const translations = {
  zh,
  en,
} as const;

export function getTranslation(lang: Language): typeof zh {
  return translations[lang] || translations.zh;
}

export function t(key: TranslationKey, lang: Language = 'zh'): string {
  const translation = getTranslation(lang);
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
}

// 支持参数替换的翻译函数
export function tWithParams(
  key: TranslationKey,
  params: Record<string, string | number>,
  lang: Language = 'zh',
): string {
  let text = t(key, lang);
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    text = text.replace(`{${paramKey}}`, String(paramValue));
  });
  return text;
}

