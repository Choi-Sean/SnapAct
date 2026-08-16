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
