'use client';

import { Emoji } from '@/components/Emoji';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Features() {
  const { t } = useLanguage();

  return (
    <section id="integrations" className="border-t border-border bg-surface-alt/50">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{t.features.eyebrow}</p>
          <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.features.headline}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{t.features.sub}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg hover:shadow-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft">
                  <Emoji name={item.icon} className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-good/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-good">
                  {item.tag}
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-bold">{item.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{item.desc}</p>
              </div>
              <div className="mt-auto flex gap-1.5 pt-1">
                <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-muted">iOS</span>
                {item.platforms.includes('android') && (
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-muted">
                    Android
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
