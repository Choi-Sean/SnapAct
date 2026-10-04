// JS entry for the SnapActKit local Expo module.
//
// Native module is iOS-only and only present in a real dev/EAS build (not
// Expo Go, not an OTA update). getNative() returns null when it isn't linked,
// so callers can degrade gracefully instead of crashing.
import { requireNativeModule } from 'expo-modules-core';

/** One class the image encoder scored. `isNegative` means food/pet/scenery. */
export interface ClassScore {
  category: string;
  score: number;
  isNegative: boolean;
}

/**
 * One button, with its score broken into the parts that produced it.
 *
 * The breakdown is carried all the way to JS on purpose: an ordering you can
 * only agree with is not reviewable. `score` is what sorted the list,
 * `naturalRank` is the position before exploration moved anything.
 */
export interface RankedAction {
  position: number;
  verb: string;
  display?: string;
  origin: 'classPrimary' | 'classSecondary' | 'universal' | 'corrected';
  basePrior: number;
  slotScore?: number;
  impressions: number;
  clicks: number;
  smoothedRate: number;
  contextBoost: number;
  profileBoost: number;
  score: number;
  naturalRank: number;
}

export interface OCRResult {
  performed: boolean;
  durationMs: number;
  spanCount: number;
  characterCount: number;
  /** For on-screen review only. The interaction log stores length, never this. */
  text: string;
  languages?: string[];
  level?: 'fast' | 'accurate';
  droppedLanguages?: string[];
  /** Why recognition did not run, when it didn't. */
  skipped?: string;
}

export interface Timings {
  gateMs: number;
  signalsMs: number;
  routingMs: number;
  rankingMs: number;
  ocrMs: number;
  arbitrationMs: number;
  totalMs: number;
}

export interface AnalysisResult {
  phase: 'fast' | 'refined';
  category: string;
  score: number;
  margin: number;
  source: 'clip' | 'prefilter' | 'fallback' | 'knn';
  isUnknown: boolean;
  /** Why `unknown`, when it is — including "thresholds not configured yet". */
  unknownReason?: string;
  gateAllowsLocalProcessing: boolean;
  /** False while the blocking classifier is still being trained in training/. */
  gateModelAvailable: boolean;
  categories: string[];
  topClasses: ClassScore[];
  signals: {
    aspectRatio: number;
    isScreenshot: boolean;
    hasDocumentEdges: boolean;
    hasText: boolean;
  };
  actions: RankedAction[];
  explorationApplied: boolean;
  promoted?: string;
  correction?: { added: string[]; outcome: string };
  ocr?: OCRResult;
  timings: Timings;
  /** The pre-OCR result, so the two orderings can be compared on screen. */
  fast?: AnalysisResult;
}

export interface Diagnostics {
  /** False when the App Group is not declared — counters are per-app then. */
  counterStoreShared: boolean;
  minScore?: number;
  minMargin?: number;
  prefilterEnabled?: boolean;
  prefilterMinConfidence?: number;
  thresholdsConfigured?: boolean;
  /** Config keys still null. Non-empty means parts of ranking are inert. */
  unconfigured: string[];
  foundationModels: string;
  configError?: string;
}

let native: any | null | undefined;

function getNative(): any | null {
  if (native !== undefined) return native;
  try {
    native = requireNativeModule('SnapActKit');
  } catch {
    native = null;
  }
  return native;
}

/** True only in a build where the native module is linked (iOS dev/EAS build). */
export function isSnapActKitLinked(): boolean {
  return getNative() != null;
}

/**
 * Routes the photo at `uri` and returns the ranked actions.
 *
 * Runs the fast path, then OCR, and returns the refined result with the fast
 * one attached as `fast`. `profile` are the user's profile keys that feed
 * profileBoost. Throws if not linked.
 */
export async function analyzePhoto(uri: string, profile: string[] = []): Promise<AnalysisResult> {
  const mod = getNative();
  if (!mod) throw new Error('SnapActKit native module is not linked');
  return (await mod.analyze(uri, profile)) as AnalysisResult;
}

/**
 * Records that the user picked `verb` for the last analyzed photo.
 *
 * Records only — it does not perform the action. Returns false when there is
 * no last analysis to attribute the tap to.
 */
export async function recordChoice(verb: string): Promise<boolean> {
  const mod = getNative();
  if (!mod) return false;
  return (await mod.recordChoice(verb)) as boolean;
}

/** Clears the personalization counters and the interaction log. */
export async function resetCounters(): Promise<boolean> {
  const mod = getNative();
  if (!mod) return false;
  return (await mod.resetCounters()) as boolean;
}

/** The interaction log as JSONL, for handing to review. */
export async function exportLog(): Promise<string> {
  const mod = getNative();
  if (!mod) return '';
  return (await mod.exportLog()) as string;
}

/**
 * What is configured and what is not.
 *
 * Worth showing on the test screen: with thresholds or boosts still null,
 * every photo can come back `unknown` and the build looks broken when it is
 * only unfinished.
 */
export function diagnostics(): Diagnostics | null {
  const mod = getNative();
  if (!mod) return null;
  return mod.diagnostics() as Diagnostics;
}
