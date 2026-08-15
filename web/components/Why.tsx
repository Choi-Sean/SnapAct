'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Why() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border bg-surface-alt/50">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{t.why.eyebrow}</p>
          <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.why.headline}</h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {t.why.items.map((item, i) => (
            <div key={item.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 font-mono text-sm font-bold text-accent">
                {i + 1}
              </div>
              <h3 className="mt-4 text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
