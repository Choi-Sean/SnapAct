'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Nav from '@/components/Nav';
import {
  AccountSummary,
  cancelPlan,
  clearSession,
  deleteAccount,
  getAccountSummary,
  getHistory,
  getToken,
  HistoryEntry,
  pausePlan,
  resumePlan,
} from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function DashboardPage() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const router = useRouter();

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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
      const [s, h] = await Promise.all([getAccountSummary(), getHistory(20, 0)]);
      setSummary(s);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function withAction(key: string, fn: () => Promise<unknown>) {
    setActionLoading(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setActionLoading(null);
    }
  }

  function handleCancel() {
    if (!confirm(isKo ? '정말 Pro 플랜을 취소할까요? 다음 결제부터 무료 플랜으로 전환돼요.' : 'Cancel your Pro plan? You’ll drop to the Free plan at the next billing date.')) return;
    withAction('cancel', cancelPlan);
  }

  function handlePauseToggle() {
    withAction('pause', summary?.paused ? resumePlan : pausePlan);
  }

  async function handleDelete() {
    if (!confirm(isKo ? '정말 계정을 삭제할까요? 모든 기록이 사라지고 되돌릴 수 없어요.' : 'Delete your account? All your history will be lost and this can’t be undone.')) return;
    await withAction('delete', deleteAccount);
    clearSession();
    router.push('/');
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
          <>
            {summary.paused && (
              <div className="mt-6 rounded-xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-[13px] font-semibold text-text">
                {isKo ? '⏸ 플랜이 일시정지 상태예요. 언제든 재개할 수 있어요.' : '⏸ Your plan is paused. Resume it anytime.'}
              </div>
            )}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {/* Plan card */}
              <div className="rounded-3xl border border-border bg-surface p-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">{isKo ? '내 플랜' : 'My plan'}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      summary.plan === 'pro' ? 'bg-accent text-white' : 'bg-surface-alt text-text'
                    }`}
                  >
                    {summary.plan === 'pro' ? 'Pro' : isKo ? '무료' : 'Free'}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-muted">
                  {isKo
                    ? `${new Date(summary.created_at * 1000).toLocaleDateString('ko-KR')}부터 이용 중`
                    : `Member since ${new Date(summary.created_at * 1000).toLocaleDateString('en-US')}`}
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  {summary.plan === 'pro' ? (
                    <>
                      <button
                        onClick={handlePauseToggle}
                        disabled={!!actionLoading}
                        className="rounded-xl border border-border bg-surface-alt py-2.5 text-sm font-bold text-text disabled:opacity-60"
                      >
                        {actionLoading === 'pause'
                          ? isKo
                            ? '처리 중...'
                            : 'Please wait...'
                          : summary.paused
                            ? isKo
                              ? '플랜 재개'
                              : 'Resume plan'
                            : isKo
                              ? '플랜 일시정지'
                              : 'Pause plan'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={!!actionLoading}
                        className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 disabled:opacity-60"
                      >
                        {actionLoading === 'cancel' ? (isKo ? '처리 중...' : 'Please wait...') : isKo ? '플랜 취소' : 'Cancel plan'}
                      </button>
                    </>
                  ) : (
                    <Link href="/pricing" className="rounded-xl bg-accent py-2.5 text-center text-sm font-bold text-white">
                      {isKo ? 'Pro로 업그레이드' : 'Upgrade to Pro'}
                    </Link>
                  )}
                </div>
              </div>

              {/* Usage card */}
              <div className="rounded-3xl border border-border bg-surface p-8">
                <h2 className="text-lg font-extrabold">{isKo ? '이번 달 사용량' : 'Usage this month'}</h2>
                <p className="mt-4 text-3xl font-extrabold tracking-tight">
                  {summary.analyses_this_month}
                  {summary.monthly_limit != null && <span className="text-base font-semibold text-muted"> / {summary.monthly_limit}</span>}
                </p>
                {summary.monthly_limit != null ? (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, (summary.analyses_this_month / summary.monthly_limit) * 100)}%` }}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-[13px] font-semibold text-good">{isKo ? '무제한' : 'Unlimited'}</p>
                )}
                <p className="mt-4 text-[13px] text-muted">
                  {isKo ? `총 누적 분석 ${summary.analyses_total}건` : `${summary.analyses_total} analyses all-time`}
                </p>
              </div>
            </div>
          </>
        )}

        {/* History */}
        <div className="mt-10">
          <h2 className="text-lg font-extrabold">{isKo ? '분석 기록' : 'Analysis history'}</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">
              {isKo ? '아직 분석한 사진이 없어요.' : 'No analyses yet.'}
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-4">
                  {entry.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.image_url} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-surface-alt" />
                  )}
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
