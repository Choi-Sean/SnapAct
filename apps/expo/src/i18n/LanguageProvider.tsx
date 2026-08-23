import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createContext, useContext, useEffect, useState } from 'react';

import { Dictionary, Locale, dictionaries } from './dictionaries';

interface LanguageContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'snapsist_locale';
const SUPPORTED: Locale[] = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de'];

async function detectInitialLocale(): Promise<Locale> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED as string[]).includes(stored)) return stored as Locale;

  for (const l of Localization.getLocales()) {
    const short = l.languageCode?.toLowerCase();
    if (short && SUPPORTED.includes(short as Locale)) return short as Locale;
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectInitialLocale().then((l) => {
      setLocaleState(l);
      setReady(true);
    });
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LanguageContext.Provider value={{ locale, t: dictionaries[locale], setLocale, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
