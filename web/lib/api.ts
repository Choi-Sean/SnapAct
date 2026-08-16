// Set NEXT_PUBLIC_API_BASE_URL in Vercel's project settings once the backend
// is deployed to Railway (see backend/README.md). Falls back to localhost for
// local development against `uvicorn app.main:app`.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface AuthResponse {
  token: string;
  email: string;
  plan: string;
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

export function signup(email: string, password: string) {
  return postJson<AuthResponse>('/auth/signup', { email, password });
}

export function login(email: string, password: string) {
  return postJson<AuthResponse>('/auth/login', { email, password });
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

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('snapsist_email');
}
