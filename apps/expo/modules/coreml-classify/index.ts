// JS entry for the CoreMLClassify local Expo module.
//
// Native module is iOS-only and only present in a real dev/EAS build (not Expo Go,
// not an OTA update). getNative() returns null when it isn't linked, so callers can
// degrade gracefully instead of crashing.
import { requireNativeModule } from 'expo-modules-core';

export interface ClassScore {
  label: string;
  confidence: number;
}

let native: any | null | undefined;

function getNative(): any | null {
  if (native !== undefined) return native;
  try {
    native = requireNativeModule('CoreMLClassify');
  } catch {
    native = null;
  }
  return native;
}

/** True only in a build where the native module is linked (iOS dev/EAS build). */
export function isCoreMLClassifyLinked(): boolean {
  return getNative() != null;
}

/** Raw class probabilities for the image at `uri`. Throws if not linked / on failure. */
export async function classifyImage(uri: string): Promise<ClassScore[]> {
  const mod = getNative();
  if (!mod) throw new Error('CoreMLClassify native module is not linked');
  const raw = (await mod.classify(uri)) as Array<{ label: string; confidence: number }>;
  return raw.map((r) => ({ label: r.label, confidence: r.confidence }));
}
