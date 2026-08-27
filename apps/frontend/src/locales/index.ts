/**
 * ERMS i18n Locale Index
 * Supports: 'zh-TW' (繁體中文) | 'en' (English)
 */

import zhTW from './zh-TW';
import en from './en';

export type SupportedLocale = 'zh-TW' | 'en';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
};

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  'zh-TW': '🇹🇼',
  'en': '🇺🇸',
};

// Derive a structural type (string values) so both locales satisfy it
type DeepString<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepString<T[K]> : string;
};

export type Translations = DeepString<typeof zhTW>;

export const locales: Record<SupportedLocale, Translations> = {
  'zh-TW': zhTW as unknown as Translations,
  'en': en as unknown as Translations,
};

export default locales;
