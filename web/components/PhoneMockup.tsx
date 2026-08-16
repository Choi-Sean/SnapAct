'use client';

import { Emoji, EmojiName } from '@/components/Emoji';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const GRID_ICONS: EmojiName[] = ['contacts', 'calendar', 'notes', 'reminders', 'photos', 'mail', 'maps', 'wallet'];

export default function PhoneMockup() {
  const { t } = useLanguage();

  return (
    <div className="relative mx-auto w-[280px] select-none sm:w-[300px]">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-accent/10 blur-3xl" aria-hidden />
      <div className="rounded-[2.6rem] border-[10px] border-[#14161c] bg-[#14161c] shadow-2xl shadow-black/20">
        <div className="relative overflow-hidden rounded-[2rem] bg-surface">
          <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-[#14161c]" />

          <div className="flex flex-col gap-4 px-5 pb-6 pt-9">
            <div>
              <p className="text-[17px] font-extrabold text-accent">Snapsist</p>
              <p className="text-[10.5px] text-muted">{t.hero.mockCaption}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {GRID_ICONS.map((icon, i) => (
                <div
                  key={i}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface-alt"
                >
                  <Emoji name={icon} className="h-5 w-5" />
                </div>
              ))}
            </div>

            <div className="mt-1 rounded-2xl border border-border bg-surface-alt p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {t.preview.fields[0].label}
              </p>
              <div className="mt-2 space-y-1.5">
                {t.preview.fields.slice(0, 3).map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-[10.5px]">
                    <span className="text-muted">{f.label}</span>
                    <span className="font-mono font-medium text-text">{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-full bg-accent py-2 text-center text-[11px] font-bold text-white">
                {t.preview.button}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
