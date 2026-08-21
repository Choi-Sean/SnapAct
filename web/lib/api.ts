// Set NEXT_PUBLIC_API_BASE_URL in Vercel's project settings once the backend
// is deployed to Railway (see backend/README.md). Falls back to localhost for
// local development against `uvicorn app.main:app`.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface AuthResponse {
  token: string;
  email: string;
  token_balance: number;
}

export interface AccountSummary {
  email: string;
  token_balance: number;
  created_at: number;
  analyses_this_month: number;
  analyses_total: number;
}

export interface TokenTransaction {
  amount: number;
  reason: string;
  created_at: number;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  price_usd: number;
}

export interface HistoryEntry {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  saved_to: string | null;
  created_at: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data as T;
}

async function authedRequest<T>(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET'): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Not logged in.');

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data as T;
}

export function signup(email: string, password: string) {
  return postJson<AuthResponse>('/auth/signup', { email, password });
}

export function login(email: string, password: string) {
  return postJson<AuthResponse>('/auth/login', { email, password });
}

export function getAccountSummary() {
  return authedRequest<AccountSummary>('/account/summary');
}

export function getHistory(limit = 20, offset = 0) {
  return authedRequest<HistoryEntry[]>(`/history?limit=${limit}&offset=${offset}`);
}

export function getTokenHistory(limit = 50, offset = 0) {
  return authedRequest<TokenTransaction[]>(`/account/token-history?limit=${limit}&offset=${offset}`);
}

export async function getTokenPackages() {
  const res = await fetch(`${API_BASE_URL}/account/token-packages`);
  const data = await res.json();
  return data as { packages: TokenPackage[]; tier1_cost_per_analysis: number };
}

export function deleteAccount() {
  return authedRequest<void>('/account', 'DELETE');
}

const TOKEN_KEY = 'snapsist_token';

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem('snapsist_email', auth.email);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('snapsist_email');
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('snapsist_email');
}
