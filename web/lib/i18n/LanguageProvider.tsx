'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { Dictionary, Locale, dictionaries } from './dictionaries';

interface LanguageContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'snapsist_locale';
const SUPPORTED_LOCALES: Locale[] = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de'];

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LOCALES as string[]).includes(stored)) return stored as Locale;

  const browserLangs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (const lang of browserLangs) {
    const short = lang.toLowerCase().split('-')[0] as Locale;
    if (SUPPORTED_LOCALES.includes(short)) return short;
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }

  return (
    <LanguageContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
