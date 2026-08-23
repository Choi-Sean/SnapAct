'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how" className="mx-auto max-w-content px-6 py-20 md:py-28">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{t.how.eyebrow}</p>
        <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.how.headline}</h2>
      </div>

      <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
        {t.how.steps.map((step, i) => (
          <li key={step.title} className="relative">
            <span className="font-mono text-sm font-medium text-muted">0{i + 1}</span>
            <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.desc}</p>
            {i < 2 && (
              <div className="mt-8 hidden h-px bg-gradient-to-r from-border to-transparent sm:hidden" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-4 sm:grid-cols-2">
        {t.how.ways.map((way) => (
          <div key={way.title} className="rounded-2xl border border-border bg-surface p-6">
            <span className="text-2xl">{way.icon}</span>
            <h3 className="mt-3 text-base font-bold">{way.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{way.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
