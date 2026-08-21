'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

const POINTS_KO = [
  { icon: '🔒', title: '분석 후 즉시 삭제', desc: '사진은 정보를 추출하는 순간에만 존재해요. 처리가 끝나면 서버에서 즉시 폐기되고, 사본은 어디에도 남지 않아요.' },
  { icon: '📱', title: '원본은 오직 내 기기에만', desc: '사진 원본은 오직 사용자 기기에만 저장돼요. 서버로도, 다른 어떤 곳으로도 전송되지 않아요.' },
  { icon: '🙈', title: '저희도 볼 수 없어요', desc: '로그인해서 히스토리를 동기화해도 카테고리·요약 같은 텍스트 결과만 저장돼요 — 사진 자체는 절대 동기화되지 않아요.' },
];

const POINTS_EN = [
  { icon: '🔒', title: 'Discarded the moment it’s analyzed', desc: 'Your photo exists just long enough to extract what you asked for. The moment that’s done, it’s gone from our servers — no copy, anywhere.' },
  { icon: '📱', title: 'The original stays on your device', desc: 'Only your own phone keeps a copy of your photos. It never gets uploaded anywhere else, ever.' },
  { icon: '🙈', title: 'We can’t see it either', desc: 'Sign in to sync your history and we save the text result — category, summary — never the picture itself.' },
];

export default function PrivacyShowcase() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const points = isKo ? POINTS_KO : POINTS_EN;

  return (
    <section className="border-t border-border bg-text text-bg">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-dark">
            {isKo ? '프라이버시' : 'Privacy'}
          </p>
          <h2 className="balance mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {isKo ? '당신의 사진은, 당신만 봅니다.' : 'Your photos. Only you ever see them.'}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-bg/70">
            {isKo
              ? '저장은 해요 — 다만 당신의 기기에만요. 저희 서버로는 절대 나가지 않아요.'
              : 'We do keep a copy — just on your own device. It never leaves for our servers.'}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-bg/15 bg-bg/5 p-6">
              <span className="text-2xl">{p.icon}</span>
              <h3 className="mt-4 text-[15px] font-bold">{p.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-bg/65">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
