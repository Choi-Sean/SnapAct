'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function TrustBar() {
  const { t } = useLanguage();

  return (
    <div className="border-y border-border bg-surface-alt/60">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5 text-xs font-semibold uppercase tracking-wide text-muted sm:justify-between">
        <span className="text-[11px] normal-case tracking-normal text-muted/80">{t.trust.label}</span>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {t.trust.items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
