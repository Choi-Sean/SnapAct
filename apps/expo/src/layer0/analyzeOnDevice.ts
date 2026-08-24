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
import { recognizeText } from './textRecognition';

/**
 * Returns a fully-resolved AnalyzeResponse if Layer 0 could handle this
 * photo entirely on-device, or null if the caller should fall through to
 * Layer 1 (../api.ts's analyzePhoto) — either because the category needs
 * Claude's extraction (business_card/receipt/event_flyer, per
 * backend/app/pricing.py's LAYER0_CATEGORIES) or because the on-device OCR
 * call itself failed (in which case the failure is also recorded via
 * markLayer0RuntimeUnavailable so capability.ts reflects it).
 *
 * `metadata` (EXIF-derived, see metadata.ts) is optional and only nudges
 * confidence — classifyText's keyword scoring is still the sole basis for
 * which category wins.
 */
export async function analyzeOnDevice(uri: string, locale: Locale, metadata?: PhotoMetadata): Promise<AnalyzeResponse | null> {
  let rawText: string;
  try {
    rawText = await recognizeText(uri, locale);
  } catch {
    markLayer0RuntimeUnavailable();
    return null;
  }

  const classified = classifyText(rawText);
  const category = classified.category;
  const confidence = applyMetadataNudge(category, classified.confidence, metadata);
  if (!LAYER0_CATEGORIES.includes(category)) {
    return null;
  }

  if (category === 'medication') {
    const medication = extractMedication(rawText);
    const hasUsableFields = Boolean(medication.name || medication.dosage);
    return {
      mock: false,
      category,
      confidence,
      suggested_action: hasUsableFields ? 'reminder' : 'none',
      medication: hasUsableFields ? medication : undefined,
      needs_time_selection: hasUsableFields && !medication.specific_times?.length,
      raw_text: rawText,
    };
  }

  // document / other: no structured fields to extract — same minimal shape
  // Layer 1 already returns for these (backend/app/main.py skips the Claude
  // call for "other", and for "document" without recognizable content).
  return {
    mock: false,
    category,
    confidence,
    suggested_action: 'none',
    raw_text: rawText,
  };
}
