// ============================================================================
// LAYER 0 — orchestrator (apps/expo/src/layer0/)
// ============================================================================
// Entry point for on-device resolution: OCR (textRecognition.ts) + keyword
// classification (classify.ts), and for medication, best-effort field
// extraction (medicationExtract.ts). Called from AnalyzeScreen.tsx before
// ever reaching out to Layer 1 (../api.ts's analyzePhoto, which is
// backend/app/main.py's /analyze).
import { Locale } from '../i18n/dictionaries';
import { AnalyzeResponse } from '../types';
import { markLayer0RuntimeUnavailable } from './capability';
import { LAYER0_CATEGORIES } from './categories';
import { classifyText } from './classify';
import { extractMedication } from './medicationExtract';
import { applyMetadataNudge, PhotoMetadata } from './metadata';
import { looksLikePaymentCard } from './sensitiveCard';
import { recognizeText } from './textRecognition';

export type Layer0Outcome =
  | { kind: 'resolved'; response: AnalyzeResponse }
  // A payment-card photo, caught by sensitiveCard.ts's text-pattern check —
  // never uploaded, never analyzed further, regardless of what category
  // classifyText would have guessed. See sensitiveCard.ts's header.
  | { kind: 'blocked' }
  // Layer 0 can't resolve this itself — caller should fall through to
  // Layer 1 (../api.ts's analyzePhoto).
  | { kind: 'fallthrough' };

/**
 * `metadata` (EXIF-derived, see metadata.ts) is optional and only nudges
 * confidence — classifyText's keyword scoring is still the sole basis for
 * which category wins.
 */
export async function analyzeOnDevice(uri: string, locale: Locale, metadata?: PhotoMetadata): Promise<Layer0Outcome> {
  let rawText: string;
  try {
    rawText = await recognizeText(uri, locale);
  } catch {
    markLayer0RuntimeUnavailable();
    return { kind: 'fallthrough' };
  }

  if (looksLikePaymentCard(rawText)) {
    return { kind: 'blocked' };
  }

  const classified = classifyText(rawText);
  const category = classified.category;
  const confidence = applyMetadataNudge(category, classified.confidence, metadata);
  if (!LAYER0_CATEGORIES.includes(category)) {
    return { kind: 'fallthrough' };
  }
  // "other" with no keyword matches at all (confidence stuck at classify.ts's
  // 0.3 floor) isn't a confident "nothing recognizable here" — it's just as
  // likely a real business_card/receipt/event_flyer whose text happens to be
  // in a language classify.ts's keyword lists don't cover well (those are
  // mostly English; only medication's list is fully multilingual). Treating
  // that as a confirmed Layer 0 result would silently misfile a real
  // document as "unrecognized" and never give Layer 1's fuller
  // (language-agnostic image-label-based) classifier a chance to correct
  // it. Real matches always score >= 0.65, so this only catches genuine
  // no-evidence cases.
  if (category === 'other' && classified.confidence < 0.5) {
    return { kind: 'fallthrough' };
  }

  if (category === 'medication') {
    const medication = extractMedication(rawText);
    const hasUsableFields = Boolean(medication.name || medication.dosage);
    return {
      kind: 'resolved',
      response: {
        mock: false,
        category,
        confidence,
        suggested_action: hasUsableFields ? 'reminder' : 'none',
        medication: hasUsableFields ? medication : undefined,
        needs_time_selection: hasUsableFields && !medication.specific_times?.length,
        raw_text: rawText,
        resolved_layer: 'L3',
      },
    };
  }

  // document / other: no structured fields to extract — same minimal shape
  // Layer 1 already returns for these (backend/app/main.py skips the Claude
  // call for "other", and for "document" without recognizable content).
  return {
    kind: 'resolved',
    response: {
      mock: false,
      category,
      confidence,
      suggested_action: 'none',
      raw_text: rawText,
      resolved_layer: 'L2',
    },
  };
}
