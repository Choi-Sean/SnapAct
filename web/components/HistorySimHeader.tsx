'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function HistorySimHeader() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';

  return (
    <div className="text-center">
      <p className="inline-flex items-center rounded-full border border-border bg-surface-alt px-3 py-1.5 text-xs font-bold text-accent">
        {isKo ? '기록' : 'History'}
      </p>
      <h2 className="balance mx-auto mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
        {isKo ? '저장할 때마다 여기 쌓여요 — 눌러서 열어보세요' : 'Every save shows up here — click a row to open it'}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[14px] text-muted">
        {isKo
          ? '줄에 마우스를 올리면 삭제 버튼이 나와요. 눌러보면 실제로 뭐가 저장됐는지 그대로 보여드려요 — 여러 장을 한번에 처리한 기록도요.'
          : 'Hover a row to delete it, tap it to see exactly what got written — including batches of photos processed at once.'}
      </p>
    </div>
  );
}
