'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-extrabold text-white">
            S
          </span>
          <span className="text-sm font-bold">Snapsist</span>
        </div>
        <p className="text-xs text-muted">{t.footer.tagline}</p>
        <p className="text-xs text-muted" suppressHydrationWarning>
          © {year} Snapsist. {t.footer.rights}
        </p>
      </div>
      <p className="pb-6 text-center text-[11px] text-muted/60">
        Emoji graphics by{' '}
        <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener noreferrer" className="underline">
          Twemoji
        </a>
        , licensed under CC-BY 4.0.
      </p>
    </footer>
  );
}
