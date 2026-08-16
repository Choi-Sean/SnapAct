'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Pipeline() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-border bg-[#0f1420] text-white">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-accent">{t.pipeline.eyebrow}</p>
          <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.pipeline.headline}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">{t.pipeline.sub}</p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {t.pipeline.steps.map((step) => (
            <div key={step.label} className="bg-[#0f1420] p-6">
              <span className="font-mono text-xs font-bold text-accent">{step.label}</span>
              <h3 className="mt-3 text-[15px] font-bold leading-snug">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
