import type { Language } from './types';
import { mergeTranslations } from './merge';
import { zh } from './locales/zh';
import { en } from './locales/en';
import { LOCALE_OVERRIDES } from './locales/overrides';

export type TranslationKey = keyof typeof zh;

const mergedCache = new Map<Language, typeof zh>();

/**
 * 获取完整翻译：中文独立；英文为基准；其它语言在英文上合并局部覆盖。
 */
export function getTranslation(lang: Language): typeof zh {
  if (lang === 'zh') return zh;

  const cached = mergedCache.get(lang);
  if (cached) return cached;

  if (lang === 'en') {
    mergedCache.set('en', en as typeof zh);
    return en as typeof zh;
  }

  const override = LOCALE_OVERRIDES[lang];
  const merged = mergeTranslations(en, override) as typeof zh;
  mergedCache.set(lang, merged);
  return merged;
}

export function t(key: TranslationKey, lang: Language = 'zh'): string {
  const translation = getTranslation(lang);
  const keys = key.split('.');
  let value: unknown = translation;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}

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

/** @deprecated 使用 getTranslation */
export const translations = { zh, en } as const;
