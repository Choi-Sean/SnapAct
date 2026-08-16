'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

import PhoneMockup from './PhoneMockup';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="mx-auto grid max-w-content items-center gap-14 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-5 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
            {t.hero.eyebrow}
          </p>
          <h1 className="balance text-[2.75rem] font-extrabold leading-[1.02] tracking-tighter sm:text-6xl md:text-7xl">
            {t.hero.headline}
            <br />
            <span className="text-accent">{t.hero.headlineAccent}</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">{t.hero.subheadline}</p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              id="get"
              href="#get"
              className="rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5"
            >
              {t.hero.ctaPrimary}
            </a>
            <a href="#how" className="text-[15px] font-semibold text-text underline decoration-border underline-offset-4 hover:decoration-text">
              {t.hero.ctaSecondary} →
            </a>
          </div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
