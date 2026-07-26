import type { CurrencyCode, Language } from './types';

export type { CurrencyCode } from './types';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  /** 1 USD = rate 该币种 */
  rateFromUsd: number;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', rateFromUsd: 1, locale: 'en-US' },
  CNY: { code: 'CNY', symbol: '¥', rateFromUsd: 7.2, locale: 'zh-CN' },
  BRL: { code: 'BRL', symbol: 'R$', rateFromUsd: 5.0, locale: 'pt-BR' },
  TRY: { code: 'TRY', symbol: '₺', rateFromUsd: 32, locale: 'tr-TR' },
  RUB: { code: 'RUB', symbol: '₽', rateFromUsd: 92, locale: 'ru-RU' },
  UAH: { code: 'UAH', symbol: '₴', rateFromUsd: 41, locale: 'uk-UA' },
  RON: { code: 'RON', symbol: 'lei', rateFromUsd: 4.6, locale: 'ro-RO' },
  PLN: { code: 'PLN', symbol: 'zł', rateFromUsd: 4.0, locale: 'pl-PL' },
  MXN: { code: 'MXN', symbol: 'MX$', rateFromUsd: 17, locale: 'es-MX' },
  KZT: { code: 'KZT', symbol: '₸', rateFromUsd: 450, locale: 'kk-KZ' },
  THB: { code: 'THB', symbol: '฿', rateFromUsd: 35, locale: 'th-TH' },
  VND: { code: 'VND', symbol: '₫', rateFromUsd: 25_000, locale: 'vi-VN' },
  PHP: { code: 'PHP', symbol: '₱', rateFromUsd: 56, locale: 'fil-PH' },
  CZK: { code: 'CZK', symbol: 'Kč', rateFromUsd: 23, locale: 'cs-CZ' },
  HUF: { code: 'HUF', symbol: 'Ft', rateFromUsd: 360, locale: 'hu-HU' },
  RSD: { code: 'RSD', symbol: 'din', rateFromUsd: 108, locale: 'sr-RS' },
  BGN: { code: 'BGN', symbol: 'лв', rateFromUsd: 1.8, locale: 'bg-BG' },
  AZN: { code: 'AZN', symbol: '₼', rateFromUsd: 1.7, locale: 'az-AZ' },
  GEL: { code: 'GEL', symbol: '₾', rateFromUsd: 2.7, locale: 'ka-GE' },
  AMD: { code: 'AMD', symbol: '֏', rateFromUsd: 390, locale: 'hy-AM' },
};

export const LANGUAGE_DEFAULT_CURRENCY: Record<Language, CurrencyCode> = {
  zh: 'CNY',
  en: 'USD',
  pt: 'BRL',
  tr: 'TRY',
  ru: 'RUB',
  uk: 'UAH',
  ro: 'RON',
  pl: 'PLN',
  es: 'MXN',
  kk: 'KZT',
  th: 'THB',
  vi: 'VND',
  fil: 'PHP',
  cs: 'CZK',
  hu: 'HUF',
  sr: 'RSD',
  bg: 'BGN',
  az: 'AZN',
  ka: 'GEL',
  hy: 'AMD',
};

export function defaultCurrencyForLanguage(language: Language): CurrencyCode {
  return LANGUAGE_DEFAULT_CURRENCY[language] ?? 'USD';
}

/** 选岗计算器：默认本国货币，点击金额切到 USD（英语仅 USD） */
export function currenciesForLanguage(language: Language): CurrencyCode[] {
  const local = defaultCurrencyForLanguage(language);
  if (local === 'USD') return ['USD'];
  return [local, 'USD'];
}

export function convertFromUsd(amountUsd: number, currency: CurrencyCode): number {
  const meta = CURRENCIES[currency] ?? CURRENCIES.USD;
  return amountUsd * meta.rateFromUsd;
}

export function formatMoney(amountUsd: number, currency: CurrencyCode): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.USD;
  const value = Math.round(convertFromUsd(amountUsd, currency));
  return `${meta.symbol}${value.toLocaleString(meta.locale)}`;
}

export function nextCurrency(current: CurrencyCode, language: Language): CurrencyCode {
  const list = currenciesForLanguage(language);
  if (list.length <= 1) return list[0] ?? 'USD';
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length] ?? list[0]!;
}
