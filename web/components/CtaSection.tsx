'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { TESTFLIGHT_URL } from '@/lib/config';

export default function CtaSection() {
  const { t } = useLanguage();

  return (
    <section id="get" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(60%_80%_at_50%_20%,var(--accent-soft)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="mx-auto max-w-content px-6 py-24 text-center md:py-32">
        <h2 className="balance mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          {t.cta.headline}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] text-muted">{t.cta.sub}</p>
        <a
          href={TESTFLIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-9 inline-block rounded-full bg-accent px-8 py-4 text-[15px] font-bold text-white shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5"
        >
          {t.cta.button}
        </a>
        <p className="mt-4 text-xs font-medium text-muted">{t.cta.note}</p>
      </div>
    </section>
  );
}
