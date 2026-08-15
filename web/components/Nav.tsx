'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

import LanguageToggle from './LanguageToggle';

export default function Nav() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-extrabold text-white">
            S
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">Snapsist</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          <a href="#how" className="transition-colors hover:text-text">
            {t.nav.how}
          </a>
          <a href="#integrations" className="transition-colors hover:text-text">
            {t.nav.integrations}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href="#get"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm shadow-accent/30 transition-transform hover:-translate-y-0.5 sm:inline-block"
          >
            {t.nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
