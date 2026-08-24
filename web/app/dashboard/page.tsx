'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import Nav from '@/components/Nav';
import {
  AccountSummary,
  clearSession,
  createCheckoutSession,
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
  refund: { ko: '분석 실패 환불', en: 'Refund (analysis failed)' },
  admin_grant: { ko: '관리자 지급', en: 'Admin grant' },
};

// Which L0-L5 rung resolved an analysis (backend/app/pricing.py's header
// has the full map) — same color coding as the app's HistoryScreen badge.
const LAYER_BADGE_STYLE: Record<string, { color: string; backgroundColor: string; borderColor: string }> = {
  L0: { color: '#6b7280', backgroundColor: '#6b72801a', borderColor: '#6b728044' },
  L1: { color: '#7c3aed', backgroundColor: '#7c3aed1a', borderColor: '#7c3aed44' },
  L2: { color: '#2563eb', backgroundColor: '#2563eb1a', borderColor: '#2563eb44' },
  L3: { color: '#0d9488', backgroundColor: '#0d94881a', borderColor: '#0d948844' },
  L5c: { color: '#ea580c', backgroundColor: '#ea580c1a', borderColor: '#ea580c44' },
  default: { color: '#6b7280', backgroundColor: '#6b72801a', borderColor: '#6b728044' },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const router = useRouter();
  const searchParams = useSearchParams();

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tokenHistory, setTokenHistory] = useState<TokenTransaction[]>([]);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();

    // Stripe redirects back here after checkout (payments.py's
    // success_url/cancel_url) — the webhook is what actually credits
    // tokens, so re-fetch the balance rather than trust this redirect by
    // itself (it can arrive before the webhook does).
    const checkout = searchParams.get('checkout');
    if (checkout === 'success' || checkout === 'cancel') {
      setCheckoutNotice(checkout);
      router.replace('/dashboard');
    }
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

  async function handleRefreshBalance() {
    // Payment happens on this page (Stripe checkout, once wired up) but the
    // webhook that credits tokens can lag a few seconds behind the redirect
    // back here — this lets the user force a re-check instead of just
    // staring at a stale number.
    setRefreshingBalance(true);
    setError(null);
    try {
      const s = await getAccountSummary();
      setSummary(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshingBalance(false);
    }
  }

  async function handleBuy(packageId: string) {
    setActionLoading(`buy-${packageId}`);
    setError(null);
    try {
      const url = await createCheckoutSession(packageId);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setActionLoading(null);
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

        {checkoutNotice === 'success' && (
          <p className="mt-4 rounded-xl border border-good/30 bg-good/10 px-4 py-3 text-[13px] font-semibold text-good">
            {isKo
              ? '결제가 완료됐어요. 토큰은 몇 초 안에 반영돼요 — 안 보이면 잔액 옆 새로고침을 눌러주세요.'
              : "Payment complete. Tokens should appear within seconds — if not, hit the refresh icon next to your balance."}
          </p>
        )}
        {checkoutNotice === 'cancel' && (
          <p className="mt-4 rounded-xl border border-border bg-surface-alt px-4 py-3 text-[13px] font-medium text-muted">
            {isKo ? '결제가 취소됐어요.' : 'Checkout was canceled.'}
          </p>
        )}

        {summary && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Token balance card */}
            <div className="rounded-3xl border border-border bg-surface p-8">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">{isKo ? '보유 토큰' : 'Token balance'}</h2>
                <button
                  onClick={handleRefreshBalance}
                  disabled={refreshingBalance}
                  title={isKo ? '토큰 잔액 새로고침' : 'Refresh token balance'}
                  aria-label={isKo ? '토큰 잔액 새로고침' : 'Refresh token balance'}
                  className="text-base leading-none text-muted transition hover:text-text disabled:opacity-50"
                >
                  <span className={refreshingBalance ? 'inline-block animate-spin' : 'inline-block'}>🔄</span>
                </button>
              </div>
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
                  onClick={() => handleBuy(pkg.id)}
                  disabled={actionLoading === `buy-${pkg.id}`}
                  className="mt-4 w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {actionLoading === `buy-${pkg.id}` ? (isKo ? '이동 중...' : 'Redirecting...') : isKo ? '구매' : 'Buy'}
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
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <p className="text-[11.5px] text-muted">
                      {new Date(entry.created_at * 1000).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
                    </p>
                    {entry.resolved_layer && (
                      <span
                        className="rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold"
                        style={LAYER_BADGE_STYLE[entry.resolved_layer] ?? LAYER_BADGE_STYLE.default}
                      >
                        {entry.resolved_layer}
                      </span>
                    )}
                  </div>
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
