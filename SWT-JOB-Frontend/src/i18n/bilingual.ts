import type { Language } from './types';
import { resolveBilingualLang } from './types';

export type BilingualText = { zh: string; en: string };
export type BilingualList = { zh: string[]; en: string[] };

export function pickBilingual(obj: BilingualText, language: Language): string {
  return obj[resolveBilingualLang(language)];
}

export function pickBilingualList(
  obj: BilingualList | undefined,
  language: Language,
): string[] {
  if (!obj) return [];
  return obj[resolveBilingualLang(language)];
}
