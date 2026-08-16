'use client';

import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { legalDictionaries } from '@/lib/i18n/legal';

export default function Footer() {
  const { t, locale } = useLanguage();
  const legalNav = legalDictionaries[locale].nav;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-extrabold text-white">
            S
          </span>
          <span className="text-sm font-bold">Snapsist</span>
        </div>
        <p className="text-xs text-muted">{t.footer.tagline}</p>
        <p className="text-xs text-muted" suppressHydrationWarning>
          © {year} Snapsist. {t.footer.rights}
        </p>
      </div>
      <div className="mx-auto flex max-w-content flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border px-6 py-5 text-center sm:justify-start sm:text-left">
        <Link href="/terms" className="text-xs text-muted hover:text-text">
          {legalNav.terms}
        </Link>
        <Link href="/privacy" className="text-xs text-muted hover:text-text">
          {legalNav.privacy}
        </Link>
        <Link href="/refund" className="text-xs text-muted hover:text-text">
          {legalNav.refund}
        </Link>
        <Link href="/child-safety" className="text-xs text-muted hover:text-text">
          {legalNav.childSafety}
        </Link>
      </div>
    </footer>
  );
}
