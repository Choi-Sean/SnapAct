'use client';

import { useState } from 'react';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Faq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-content px-6 py-20 md:py-28">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{t.faq.eyebrow}</p>
        <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.faq.headline}</h2>
      </div>

      <div className="mt-10 divide-y divide-border border-t border-border">
        {t.faq.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
                aria-expanded={open}
              >
                <span className="text-[15px] font-bold">{item.q}</span>
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border text-sm text-muted transition-transform ${
                    open ? 'rotate-45' : ''
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div className={`grid transition-all ${open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[62ch] text-[14px] leading-relaxed text-muted">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
