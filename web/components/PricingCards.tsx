'use client';

import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

// Sample pricing — keep in sync with backend/app/pricing.py TOKEN_PACKAGES.
const TOKEN_PACKAGES = [
  { id: 'small', tokens: 100, priceUsd: 2.99 },
  { id: 'medium', tokens: 500, priceUsd: 9.99 },
  { id: 'large', tokens: 1500, priceUsd: 19.99 },
];
const TIER1_TOKEN_COST = 10;

export default function PricingCards() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';

  return (
    <div>
      <div className="text-center">
        <h1 className="balance text-3xl font-extrabold tracking-tight sm:text-5xl">
          {isKo ? '심플한 요금제' : 'Simple pricing'}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted">
          {isKo
            ? '명함 · 영수증 · 행사 전단 분석은 토큰을 써요. 나머지는 전부 무료예요.'
            : 'Business card, receipt, and event flyer analyses use tokens. Everything else is free.'}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-good/30 bg-good/10 px-6 py-4 text-center text-[13.5px] font-semibold text-good">
        {isKo
          ? '복약 · 문서 · 미인식 사진은 언제나 무료예요 — 토큰도, 계정도 필요 없어요.'
          : 'Medication, documents, and unrecognized photos are always free — no tokens, no account needed.'}
      </div>

      <div className="mx-auto mt-8 grid gap-6 sm:grid-cols-3">
        {TOKEN_PACKAGES.map((pkg) => {
          const highlight = pkg.id === 'medium';
          return (
            <div
              key={pkg.id}
              className={`rounded-3xl border p-8 ${
                highlight ? 'border-accent bg-accent-soft/40 shadow-xl shadow-accent/10' : 'border-border bg-surface'
              }`}
            >
              {highlight && (
                <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
                  {isKo ? '가장 인기' : 'Most popular'}
                </span>
              )}
              <h2 className="text-2xl font-extrabold">{pkg.tokens.toLocaleString()}</h2>
              <p className="text-[13px] text-muted">{isKo ? '토큰' : 'tokens'}</p>
              <p className="mt-4 text-[13px] text-muted">
                {isKo ? `분석 약 ${Math.floor(pkg.tokens / TIER1_TOKEN_COST)}회` : `≈ ${Math.floor(pkg.tokens / TIER1_TOKEN_COST)} analyses`}
              </p>
              <p className="mt-5">
                <span className="text-4xl font-extrabold tracking-tight">${pkg.priceUsd}</span>
              </p>

              <button
                disabled
                title={isKo ? '결제 연동 준비 중이에요' : 'Payment integration coming soon'}
                className="mt-8 block w-full cursor-not-allowed rounded-xl bg-surface-alt py-3 text-center text-sm font-bold text-muted"
              >
                {isKo ? '구매 (출시 예정)' : 'Buy (coming soon)'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link href="/signup" className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white">
          {isKo ? '무료로 시작하고 토큰 받기' : 'Sign up free and get starter tokens'}
        </Link>
        <p className="mt-3 text-[12.5px] text-muted">
          {isKo ? '가입하면 무료 토큰 50개를 드려요.' : 'New accounts get 50 free tokens.'}
        </p>
      </div>
    </div>
  );
}
