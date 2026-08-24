// ============================================================================
// LAYER 0 — fallback consent (apps/expo/src/layer0/)
// ============================================================================
// Whether the user has agreed to skip the "Layer 0 isn't available, use
// Layer 1 (server + tokens) instead?" prompt on every future analysis.
// Stored on-device only (SecureStore, like the session token in ../auth.ts)
// — deliberately never sent to the server. Storing it server-side would mean
// keeping a device-identified record just to remember a UI preference, which
// cuts against the "nothing about you leaves this device unless you choose
// Layer 1" promise this app is built (and marketed) around. Re-prompting
// after a reinstall is a fine trade-off for that.
import * as SecureStore from 'expo-secure-store';

const CONSENT_KEY = 'snapsist_layer1_fallback_consent';

export async function getLayer1FallbackConsent(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(CONSENT_KEY);
  return raw === 'always';
}

export async function setLayer1FallbackConsent(always: boolean): Promise<void> {
  if (always) {
    await SecureStore.setItemAsync(CONSENT_KEY, 'always');
  } else {
    await SecureStore.deleteItemAsync(CONSENT_KEY);
  }
}
