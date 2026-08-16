'use client';

import { Emoji } from '@/components/Emoji';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

function BusinessCardMockup() {
  return (
    <div className="relative h-[92px] w-[140px] -rotate-6 rounded-xl border border-black/5 bg-white p-3.5 shadow-lg shadow-black/10">
      <div className="absolute right-3.5 top-3.5 h-3 w-3 rounded-full bg-accent" />
      <p className="text-[11px] font-extrabold leading-tight text-[#10131a]">John Smith</p>
      <p className="mt-0.5 text-[8px] font-semibold leading-tight text-[#5b6472]">Product Manager</p>
      <p className="text-[8px] leading-tight text-[#5b6472]">Snapsist Inc.</p>
      <div className="absolute bottom-3.5 left-3.5 right-3.5 h-px bg-black/10" />
      <p className="absolute bottom-1.5 left-3.5 font-mono text-[7px] text-[#5b6472]">+1 123-456-7894</p>
    </div>
  );
}

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
          <div className="flex items-center gap-4">
            <BusinessCardMockup />
            <span className="font-mono text-lg text-muted/50">→</span>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-accent-soft">
              <Emoji name="contacts" className="h-6 w-6" />
            </span>
          </div>

          <p className="mt-5 text-lg font-extrabold">
            {t.preview.sourceLabel} → {t.preview.destLabel}
          </p>
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
