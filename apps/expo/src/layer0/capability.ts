// ============================================================================
// LAYER 0 — device capability detection (apps/expo/src/layer0/)
// ============================================================================
// Google ML Kit's on-device text recognizer (see textRecognition.ts) ships
// its own bundled models for every script it supports (Latin/Chinese/
// Japanese/Korean/Devanagari) rather than depending on the OS version the
// way Apple's own Vision framework does — so, unlike an early draft of this
// plan assumed, there's no per-language OS-version gap to track here. The
// only real "unsupported" cases are: (1) the native module isn't linked at
// all (Expo Go, or a build from before this feature shipped), or (2) a
// runtime failure — e.g. an Android device without Google Play services,
// which ML Kit's on-device models depend on. (2) can only be discovered by
// actually trying, so analyzeOnDevice.ts reports it back here via
// markLayer0RuntimeUnavailable() the first time a call fails.
import { isTextRecognitionLinked } from './textRecognition';

export type Layer0UnsupportedReason = 'native_module_missing' | 'runtime_unavailable';

export interface Layer0Support {
  supported: boolean;
  reason?: Layer0UnsupportedReason;
}

let runtimeUnavailable = false;

export function markLayer0RuntimeUnavailable(): void {
  runtimeUnavailable = true;
}

export function getLayer0Support(): Layer0Support {
  if (runtimeUnavailable) return { supported: false, reason: 'runtime_unavailable' };
  if (!isTextRecognitionLinked()) return { supported: false, reason: 'native_module_missing' };
  return { supported: true };
}
