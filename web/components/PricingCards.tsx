'use client';

import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function PricingCards() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';

  const plans = [
    {
      name: isKo ? '무료' : 'Free',
      price: '$0',
      period: '',
      desc: isKo ? '한번 써보고 싶은 분께' : 'Try it out, no commitment',
      features: isKo
        ? ['월 15장 처리', '연락처 · 캘린더 · 미리 알림 · Wallet · 메모 · 지도', '기기 내 기록 저장']
        : ['15 photos / month', 'Contacts · Calendar · Reminders · Wallet · Notes · Maps', 'On-device history'],
      cta: isKo ? '무료로 시작하기' : 'Start for free',
      href: '/signup',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$4.99',
      period: isKo ? '/ 월' : '/ mo',
      desc: isKo ? '자주 쓰는 분께' : 'For regular use',
      features: isKo
        ? ['무제한 처리', '여러 장 한번에 일괄 처리', '기록 클라우드 동기화', '우선 처리']
        : ['Unlimited photos', 'Batch-process multiple photos at once', 'History synced across devices', 'Priority processing'],
      cta: isKo ? 'Pro 시작하기' : 'Start Pro',
      href: '/signup?plan=pro',
      highlight: true,
    },
  ];

  return (
    <div>
      <div className="text-center">
        <h1 className="balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          {isKo ? '심플한 요금제' : 'Simple pricing'}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
          {isKo ? '베타 기간엔 Pro 기능도 전부 무료로 열려있어요.' : 'During the beta, Pro features are unlocked for everyone, free.'}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-8 ${
              plan.highlight ? 'border-accent bg-accent-soft/40 shadow-xl shadow-accent/10' : 'border-border bg-surface'
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
                {isKo ? '가장 인기' : 'Most popular'}
              </span>
            )}
            <h2 className="text-xl font-extrabold">{plan.name}</h2>
            <p className="mt-1 text-[13px] text-muted">{plan.desc}</p>
            <p className="mt-5">
              <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
              <span className="text-sm font-semibold text-muted">{plan.period}</span>
            </p>

            <ul className="mt-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13.5px] text-text">
                  <span className="mt-0.5 text-good">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold ${
                plan.highlight ? 'bg-accent text-white' : 'bg-surface-alt text-text'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
