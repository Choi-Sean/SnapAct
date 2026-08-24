// ============================================================================
// LAYER 1 — on-device vision blocking gate (apps/expo/src/layer0/)
// ============================================================================
// The fail-closed policy layer for the Core ML L1 classifier. Mirrors the
// spike's L1Gate.swift exactly (spikes/s3-l1-vision-classifier/L1Gate.swift).
// The native module (../../modules/coreml-classify) only produces class
// probabilities; THIS decides BLOCK vs ROUTE.
//
// Runs BEFORE OCR and before any upload (see AnalyzeScreen.tsx's
// resolveAnalysis) — a Tier 0 photo must never leave the device, and
// blocking must not depend on OCR succeeding.
//
// Credit: ported from a spike/module built by a collaborator on the
// layer1_initial branch, onto this session's apps/expo/ layout.
import {
  classifyImage,
  isCoreMLClassifyLinked,
  type ClassScore,
} from '../../modules/coreml-classify';

// Tier 0 classes the model can predict — must never leave the device.
const BLOCKING = new Set(['id_card', 'passport', 'payment_card', 'prescription', 'financial_doc']);
// Any blocking class above this probability blocks, even if it's not the top class.
const SUSPICION_THRESHOLD = 0.15;
// Below its per-class threshold, a routing prediction becomes `unknown` rather
// than a low-confidence guess (an `unknown`/low-confidence route is the
// normal, primary outcome — never a forced low-confidence label guess).
const ROUTE_THRESHOLD: Record<string, number> = {
  business_card: 0.75,
  receipt: 0.65,
  event_flyer: 0.55,
  document: 0.5,
  medication: 0.65,
};
const DEFAULT_ROUTE_THRESHOLD = 0.55;

export type VisionGateDecision =
  | { kind: 'block'; top: string; p: number; reason: string; scores: ClassScore[] }
  | { kind: 'route'; category: string; confidence: number; scores: ClassScore[] }
  | { kind: 'unavailable' }; // module not linked, or inference failed → caller falls through

export async function runVisionGate(uri: string): Promise<VisionGateDecision> {
  if (!isCoreMLClassifyLinked()) return { kind: 'unavailable' };

  let scores: ClassScore[];
  try {
    scores = await classifyImage(uri);
  } catch {
    // Fail-OPEN on availability (keep the app working), NOT on a real detection.
    return { kind: 'unavailable' };
  }
  if (!scores.length) return { kind: 'unavailable' };

  const sorted = [...scores].sort((a, b) => b.confidence - a.confidence);
  const top = sorted[0];

  if (BLOCKING.has(top.label)) {
    return { kind: 'block', top: top.label, p: top.confidence, reason: 'top class is Tier 0', scores: sorted };
  }
  const suspicious = sorted.find((s) => BLOCKING.has(s.label) && s.confidence > SUSPICION_THRESHOLD);
  if (suspicious) {
    return {
      kind: 'block',
      top: suspicious.label,
      p: suspicious.confidence,
      reason: `Tier 0 mass ${suspicious.confidence.toFixed(2)} > ${SUSPICION_THRESHOLD}`,
      scores: sorted,
    };
  }

  const thresh = ROUTE_THRESHOLD[top.label] ?? DEFAULT_ROUTE_THRESHOLD;
  const category = top.confidence < thresh ? 'unknown' : top.label;
  return { kind: 'route', category, confidence: top.confidence, scores: sorted };
}
