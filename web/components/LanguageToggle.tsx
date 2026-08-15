'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-1 text-xs font-semibold">
      <button
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          locale === 'en' ? 'bg-accent text-white' : 'text-muted hover:text-text'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('ko')}
        className={`rounded-full px-3 py-1.5 transition-colors ${
          locale === 'ko' ? 'bg-accent text-white' : 'text-muted hover:text-text'
        }`}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
    </div>
  );
}
