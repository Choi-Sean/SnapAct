'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { API_BASE_URL, login, saveSession, signup } from '@/lib/api';

interface Props {
  mode: 'signup' | 'login';
}

export default function AuthForm({ mode }: Props) {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.google_oauth_enabled))
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = mode === 'signup' ? await signup(email, password) : await login(email, password);
      saveSession(auth);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleClick() {
    if (!googleEnabled) {
      setError(isKo ? 'Google 로그인은 곧 지원될 예정이에요. 이메일로 먼저 가입해보세요.' : 'Google sign-in is coming soon — try email for now.');
      return;
    }
    window.location.href = `${API_BASE_URL}/auth/google/start`;
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {mode === 'signup' ? (isKo ? '계정 만들기' : 'Create your account') : isKo ? '로그인' : 'Log in'}
      </h1>
      <p className="mt-2 text-[13.5px] text-muted">
        {mode === 'signup'
          ? isKo
            ? '무료로 시작하고, 언제든 Pro로 업그레이드하세요.'
            : 'Start free, upgrade to Pro anytime.'
          : isKo
            ? 'Snapsist 계정으로 로그인하세요.'
            : 'Welcome back.'}
      </p>

      <button
        onClick={handleGoogleClick}
        className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text transition-colors hover:bg-surface-alt"
      >
        <GoogleIcon />
        {isKo ? 'Google로 계속하기' : 'Continue with Google'}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-border" />
        {isKo ? '또는' : 'or'}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder={isKo ? '이메일' : 'Email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder={isKo ? '비밀번호 (8자 이상)' : 'Password (8+ characters)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />

        {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? (isKo ? '처리 중...' : 'Please wait...') : mode === 'signup' ? (isKo ? '계정 만들기' : 'Create account') : isKo ? '로그인' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        {mode === 'signup' ? (
          <>
            {isKo ? '이미 계정이 있으신가요? ' : 'Already have an account? '}
            <Link href="/login" className="font-semibold text-accent">
              {isKo ? '로그인' : 'Log in'}
            </Link>
          </>
        ) : (
          <>
            {isKo ? '계정이 없으신가요? ' : "Don't have an account? "}
            <Link href="/signup" className="font-semibold text-accent">
              {isKo ? '가입하기' : 'Sign up'}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 01-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.11A12 12 0 0012 24z"
      />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.61H1.29A12 12 0 000 12c0 1.94.46 3.77 1.29 5.39l3.98-3.11z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 001.29 6.61l3.98 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
