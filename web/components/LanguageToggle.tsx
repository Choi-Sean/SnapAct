'use client';

import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { LOCALE_LABELS, Locale } from '@/lib/i18n/dictionaries';

const ORDER: Locale[] = ['en', 'ko', 'es'];

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden>🌐</span>
        {LOCALE_LABELS[locale]}
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl shadow-black/10"
        >
          {ORDER.map((code) => (
            <li key={code}>
              <button
                role="option"
                aria-selected={locale === code}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] font-medium hover:bg-surface-alt ${
                  locale === code ? 'text-accent' : 'text-text'
                }`}
              >
                {LOCALE_LABELS[code]}
                {locale === code && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
