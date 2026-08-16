'use client';

import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

import LanguageToggle from './LanguageToggle';

export default function Nav() {
  const { t, locale } = useLanguage();
  const isKo = locale === 'ko';

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-extrabold text-white">
            S
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">Snapsist</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          <Link href="/playground" className="transition-colors hover:text-text">
            {isKo ? '플레이그라운드' : 'Playground'}
          </Link>
          <Link href="/#how" className="transition-colors hover:text-text">
            {t.nav.how}
          </Link>
          <Link href="/#integrations" className="transition-colors hover:text-text">
            {t.nav.integrations}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-text">
            {isKo ? '요금제' : 'Pricing'}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-text hover:text-accent sm:inline-block"
          >
            {isKo ? '로그인' : 'Log in'}
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm shadow-accent/30 transition-transform hover:-translate-y-0.5 sm:inline-block"
          >
            {isKo ? '무료로 시작하기' : 'Get started free'}
          </Link>
        </div>
      </div>
    </header>
  );
}
