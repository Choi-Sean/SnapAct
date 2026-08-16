import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryEntry } from './types';

export const FREE_MONTHLY_LIMIT = 10;
const UPGRADE_PROMPT_KEY = 'snapsist_upgrade_prompted';

export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function countThisMonth(history: HistoryEntry[]): number {
  const key = monthKey(new Date().toISOString());
  return history
    .filter((e) => monthKey(e.createdAt) === key)
    .reduce((sum, e) => sum + (e.batchItems?.length ?? 1), 0);
}

export async function hasShownUpgradePrompt(): Promise<boolean> {
  return (await AsyncStorage.getItem(UPGRADE_PROMPT_KEY)) === 'true';
}

export async function markUpgradePromptShown(): Promise<void> {
  await AsyncStorage.setItem(UPGRADE_PROMPT_KEY, 'true');
}
