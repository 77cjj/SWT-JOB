import type { Language } from '../i18n/types';

/**
 * 展示用外汇：金额计算仍以 USD 为基准，展示时按汇率换算。
 * 后续加币种：在 CURRENCIES 注册，并在 currenciesForLanguage 里挂到对应语言即可。
 */
export type CurrencyCode = 'USD' | 'CNY';

export interface CurrencyMeta {
  code: CurrencyCode;
  /** 展示符号 */
  symbol: string;
  /** 1 USD = rate 该币种 */
  rateFromUsd: number;
  /** Intl 格式化用 */
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: {
    code: 'USD',
    symbol: '$',
    rateFromUsd: 1,
    locale: 'en-US',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    rateFromUsd: 7.2,
    locale: 'zh-CN',
  },
};

/** 各语言可循环切换的币种列表；首项为默认展示 */
export function currenciesForLanguage(language: Language): CurrencyCode[] {
  switch (language) {
    case 'zh':
      return ['USD', 'CNY'];
    case 'en':
      return ['USD', 'CNY'];
    default:
      return ['USD'];
  }
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
