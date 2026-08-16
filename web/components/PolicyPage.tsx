'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { legalDictionaries } from '@/lib/i18n/legal';

export default function PolicyPage({ docKey }: { docKey: 'terms' | 'privacy' | 'refund' | 'childSafety' }) {
  const { locale } = useLanguage();
  const doc = legalDictionaries[locale][docKey];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">
      <h1 className="balance text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.title}</h1>
      <p className="mt-2 text-[13px] text-muted">{doc.updated}</p>

      <div className="mt-10 space-y-8">
        {doc.sections.map((s) => (
          <div key={s.heading}>
            <h2 className="text-[16px] font-bold">{s.heading}</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
