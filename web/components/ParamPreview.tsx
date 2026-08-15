'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function ParamPreview() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-content px-6 py-20 md:py-28">
      <div className="grid items-center gap-14 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{t.preview.eyebrow}</p>
          <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.preview.headline}</h2>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">{t.preview.sub}</p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-black/5 sm:p-8">
          <p className="text-lg font-extrabold">{t.features.items[0].title} → {t.trust.items[0]}</p>
          <p className="mt-1 text-[13px] text-muted">{t.preview.note}</p>

          <div className="mt-6 divide-y divide-border">
            {t.preview.fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-3 text-[13.5px]">
                <span className="font-semibold text-muted">{f.label}</span>
                <span className="font-mono text-text">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <div className="flex-1 rounded-xl bg-surface-alt py-3 text-center text-sm font-bold text-muted">—</div>
            <div className="flex-1 rounded-xl bg-accent py-3 text-center text-sm font-bold text-white">
              {t.preview.button}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
