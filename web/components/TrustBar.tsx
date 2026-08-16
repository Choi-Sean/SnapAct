'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function TrustBar() {
  const { t } = useLanguage();
  const items = [...t.trust.items, ...t.trust.items, ...t.trust.items];

  return (
    <div className="border-y border-border bg-surface-alt/60 py-5">
      <p className="mx-auto mb-3 max-w-content px-6 text-center text-[11px] font-semibold uppercase tracking-wide text-muted/80 sm:text-left">
        {t.trust.label}
      </p>
      <div className="group relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent" />
        <div className="flex w-max animate-[marquee_22s_linear_infinite] gap-10 group-hover:[animation-play-state:paused]">
          {items.map((item, i) => (
            <span key={i} className="text-sm font-bold tracking-tight text-text/70">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
