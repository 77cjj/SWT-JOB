/** 展示用币种（选岗计算器 UI 估算，非实时汇率） */
export type CurrencyCode =
  | 'USD'
  | 'CNY'
  | 'BRL'
  | 'TRY'
  | 'RUB'
  | 'UAH'
  | 'RON'
  | 'PLN'
  | 'MXN'
  | 'KZT'
  | 'THB'
  | 'VND'
  | 'PHP'
  | 'CZK'
  | 'HUF'
  | 'RSD'
  | 'BGN'
  | 'AZN'
  | 'GEL'
  | 'AMD';

/** SWT 主要派出国语言，按项目规模与历史发送量大致排序 */
export type Language =
  | 'zh'
  | 'en'
  | 'pt'
  | 'tr'
  | 'ru'
  | 'uk'
  | 'ro'
  | 'pl'
  | 'es'
  | 'kk'
  | 'th'
  | 'vi'
  | 'fil'
  | 'cs'
  | 'hu'
  | 'sr'
  | 'bg'
  | 'az'
  | 'ka'
  | 'hy';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  defaultCurrency: CurrencyCode;
  region: string;
}

/**
 * 按 SWT 参与重要性排列。
 * 英文界面默认 USD；其余语言默认本国货币，选岗计算器点击金额可切 USD。
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', defaultCurrency: 'CNY', region: 'China' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', defaultCurrency: 'USD', region: 'International' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', defaultCurrency: 'BRL', region: 'Brazil' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', defaultCurrency: 'TRY', region: 'Turkey' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', defaultCurrency: 'RUB', region: 'Russia' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', defaultCurrency: 'UAH', region: 'Ukraine' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', defaultCurrency: 'RON', region: 'Romania' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', defaultCurrency: 'PLN', region: 'Poland' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇲🇽', defaultCurrency: 'MXN', region: 'Latin America' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', defaultCurrency: 'KZT', region: 'Kazakhstan' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', defaultCurrency: 'THB', region: 'Thailand' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', defaultCurrency: 'VND', region: 'Vietnam' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', defaultCurrency: 'PHP', region: 'Philippines' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', defaultCurrency: 'CZK', region: 'Czech Republic' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', defaultCurrency: 'HUF', region: 'Hungary' },
  { code: 'sr', name: 'Serbian', nativeName: 'Srpski', flag: '🇷🇸', defaultCurrency: 'RSD', region: 'Serbia' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', defaultCurrency: 'BGN', region: 'Bulgaria' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycanca', flag: '🇦🇿', defaultCurrency: 'AZN', region: 'Azerbaijan' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', defaultCurrency: 'GEL', region: 'Georgia' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲', defaultCurrency: 'AMD', region: 'Armenia' },
];

export const DEFAULT_LANGUAGE: Language = 'zh';

/** 薅羊毛等仅含 zh/en 的双语文案：非中文一律读英文 */
export function resolveBilingualLang(language: Language): 'zh' | 'en' {
  return language === 'zh' ? 'zh' : 'en';
}
