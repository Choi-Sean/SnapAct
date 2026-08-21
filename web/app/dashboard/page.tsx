'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Nav from '@/components/Nav';
import {
  AccountSummary,
  clearSession,
  deleteAccount,
  getAccountSummary,
  getHistory,
  getToken,
  getTokenHistory,
  getTokenPackages,
  HistoryEntry,
  TokenPackage,
  TokenTransaction,
} from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const REASON_LABEL: Record<string, { ko: string; en: string }> = {
  signup_bonus: { ko: '가입 축하 토큰', en: 'Signup bonus' },
  purchase: { ko: '구매', en: 'Purchase' },
  analysis: { ko: '분석 사용', en: 'Analysis' },
};

export default function DashboardPage() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const router = useRouter();

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tokenHistory, setTokenHistory] = useState<TokenTransaction[]>([]);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, h, th, pkgs] = await Promise.all([
        getAccountSummary(),
        getHistory(20, 0),
        getTokenHistory(10, 0),
        getTokenPackages(),
      ]);
      setSummary(s);
      setHistory(h);
      setTokenHistory(th);
      setPackages(pkgs.packages);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(isKo ? '정말 계정을 삭제할까요? 모든 기록이 사라지고 되돌릴 수 없어요.' : 'Delete your account? All your history will be lost and this can’t be undone.')) return;
    setActionLoading('delete');
    setError(null);
    try {
      await deleteAccount();
      clearSession();
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-content px-6 py-24 text-center text-sm text-muted">
          {isKo ? '불러오는 중...' : 'Loading...'}
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-content px-6 py-12 md:py-16">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{isKo ? '대시보드' : 'Dashboard'}</h1>
        {summary && <p className="mt-1 text-[13.5px] text-muted">{summary.email}</p>}

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
            {error}
          </p>
        )}

        {summary && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Token balance card */}
            <div className="rounded-3xl border border-border bg-surface p-8">
              <h2 className="text-lg font-extrabold">{isKo ? '보유 토큰' : 'Token balance'}</h2>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-accent">{summary.token_balance}</p>
              <p className="mt-2 text-[13px] text-muted">
                {isKo
                  ? `${new Date(summary.created_at * 1000).toLocaleDateString('ko-KR')}부터 이용 중`
                  : `Member since ${new Date(summary.created_at * 1000).toLocaleDateString('en-US')}`}
              </p>
              <p className="mt-3 rounded-xl bg-good/10 px-3 py-2 text-[12.5px] font-semibold text-good">
                {isKo
                  ? '복약·문서·미인식 사진은 언제나 무료예요 — 토큰이 필요 없어요.'
                  : 'Medication, documents, and unrecognized photos are always free — no tokens needed.'}
              </p>
            </div>

            {/* Usage card */}
            <div className="rounded-3xl border border-border bg-surface p-8">
              <h2 className="text-lg font-extrabold">{isKo ? '이번 달 사용량' : 'Usage this month'}</h2>
              <p className="mt-4 text-3xl font-extrabold tracking-tight">{summary.analyses_this_month}</p>
              <p className="mt-4 text-[13px] text-muted">
                {isKo ? `총 누적 분석 ${summary.analyses_total}건` : `${summary.analyses_total} analyses all-time`}
              </p>
            </div>
          </div>
        )}

        {/* Buy tokens */}
        <div className="mt-10">
          <h2 className="text-lg font-extrabold">{isKo ? '토큰 구매' : 'Buy tokens'}</h2>
          <p className="mt-1 text-[13px] text-muted">
            {isKo ? '명함 · 영수증 · 행사 전단 분석 1회당 10토큰이 사용돼요.' : 'Business card, receipt, and event flyer analyses use 10 tokens each.'}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-2xl border border-border bg-surface p-6">
                <p className="text-2xl font-extrabold">{pkg.tokens.toLocaleString()}</p>
                <p className="text-[12px] text-muted">{isKo ? '토큰' : 'tokens'}</p>
                <p className="mt-3 text-xl font-extrabold text-accent">${pkg.price_usd}</p>
                <button
                  disabled
                  title={isKo ? '결제 연동 준비 중이에요' : 'Payment integration coming soon'}
                  className="mt-4 w-full cursor-not-allowed rounded-xl bg-surface-alt py-2.5 text-sm font-bold text-muted"
                >
                  {isKo ? '구매 (출시 예정)' : 'Buy (coming soon)'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Token history */}
        {tokenHistory.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-extrabold">{isKo ? '토큰 내역' : 'Token history'}</h2>
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
              {tokenHistory.map((tx, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <p className="text-[13px] font-semibold text-text">
                    {isKo ? REASON_LABEL[tx.reason]?.ko ?? tx.reason : REASON_LABEL[tx.reason]?.en ?? tx.reason}
                  </p>
                  <p className={`text-[13px] font-bold ${tx.amount >= 0 ? 'text-good' : 'text-muted'}`}>
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="mt-10">
          <h2 className="text-lg font-extrabold">{isKo ? '분석 기록' : 'Analysis history'}</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            {isKo
              ? '사진 자체는 본인 기기에만 저장돼요 — 여기서는 분석 결과만 확인할 수 있어요.'
              : 'Photos are only ever stored on your own device — this shows the analysis results, not the pictures.'}
          </p>
          {history.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">
              {isKo ? '아직 분석한 사진이 없어요.' : 'No analyses yet.'}
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-text">{entry.title}</p>
                    <p className="truncate text-[12px] text-muted">{entry.detail || entry.type}</p>
                  </div>
                  <p className="flex-shrink-0 text-[11.5px] text-muted">
                    {new Date(entry.created_at * 1000).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="mt-10 rounded-3xl border border-red-200 bg-red-50/40 p-8">
          <h2 className="text-lg font-extrabold text-red-700">{isKo ? '계정 삭제' : 'Delete account'}</h2>
          <p className="mt-2 text-[13px] text-muted">
            {isKo
              ? '계정과 모든 분석 기록이 영구적으로 삭제돼요. 되돌릴 수 없어요.'
              : 'Your account and all analysis history will be permanently deleted. This can’t be undone.'}
          </p>
          <button
            onClick={handleDelete}
            disabled={!!actionLoading}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {actionLoading === 'delete' ? (isKo ? '처리 중...' : 'Please wait...') : isKo ? '계정 삭제' : 'Delete account'}
          </button>
        </div>
      </main>
    </>
  );
}
