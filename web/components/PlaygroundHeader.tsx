'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function PlaygroundHeader() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';

  return (
    <div className="text-center">
      <p className="inline-flex items-center rounded-full border border-border bg-surface-alt px-3 py-1.5 text-xs font-bold text-accent">
        {isKo ? '설치 없이 바로 체험' : 'No install needed'}
      </p>
      <h1 className="balance mx-auto mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
        {isKo ? '눌러보면 바로 이해돼요' : 'Click around — you&#39;ll get it in 10 seconds'}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
        {isKo
          ? '아래 카드 아무거나 눌러보세요. 사진 한 장이 실제로 어떻게 정리되는지 그대로 보여드릴게요.'
          : 'Tap any card below. This is exactly what happens when a real photo is filed on your phone.'}
      </p>
    </div>
  );
}
