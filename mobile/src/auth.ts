import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './config';

export interface Session {
  token: string;
  email: string;
  plan: string;
}

const SESSION_KEY = 'snapsist_session';

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

async function authedRequest<T>(path: string, method: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function signup(email: string, password: string): Promise<Session> {
  const session = await postJson<Session>('/auth/signup', { email, password });
  await saveSession(session);
  return session;
}

export async function login(email: string, password: string): Promise<Session> {
  const session = await postJson<Session>('/auth/login', { email, password });
  await saveSession(session);
  return session;
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function cancelPlan(token: string): Promise<{ email: string; plan: string }> {
  const user = await authedRequest<{ email: string; plan: string }>('/account/cancel-plan', 'POST', token);
  const session = await loadSession();
  if (session) await saveSession({ ...session, plan: user.plan });
  return user;
}

export async function deleteAccount(token: string): Promise<void> {
  await authedRequest<void>('/account', 'DELETE', token);
  await clearSession();
}
