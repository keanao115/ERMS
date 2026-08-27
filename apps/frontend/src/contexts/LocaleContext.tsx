'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import locales, { type SupportedLocale, type Translations } from '@/locales';

const STORAGE_KEY = 'erms_locale';
const DEFAULT_LOCALE: SupportedLocale = 'zh-TW';

interface LocaleContextValue {
  locale: SupportedLocale;
  t: Translations;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: locales[DEFAULT_LOCALE],
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);

  // Restore from localStorage or sessionStorage on mount
  useEffect(() => {
    try {
      const stored = (localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)) as SupportedLocale | null;
      if (stored && stored in locales) {
        setLocaleState(stored);
      }
    } catch {}
  }, []);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** Hook — use inside any client component */
export function useLocale() {
  return useContext(LocaleContext);
}
