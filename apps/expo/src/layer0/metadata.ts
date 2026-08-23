// ============================================================================
// LAYER 0 — photo metadata (mobile/src/layer0/)
// ============================================================================
// EXIF alone can't tell you *what* a photo shows (no camera writes "this is
// a receipt" into EXIF) — this is a supplementary signal only, not a
// classifier. What it CAN reliably tell you: whether this came off a real
// camera sensor (Make/Model present) versus a screenshot or a downloaded/
// re-saved image (those almost always have that stripped). See the session
// discussion this was scoped from for the fuller reasoning.
//
// Sourced from expo-image-picker's `exif: true` option (AnalyzeScreen.tsx's
// pick()) — not available for expo-share-intent's shared files, which don't
// expose EXIF, so a shared photo always resolves to hasCameraExif: false.
// That's a known gap, not a bug: it just means the metadata nudge below is
// skipped for the share-sheet path, and classification falls back to OCR
// alone (the same as before this file existed).
export interface PhotoMetadata {
  hasCameraExif: boolean;
}

export function extractPhotoMetadata(exif: Record<string, unknown> | null | undefined): PhotoMetadata {
  if (!exif) return { hasCameraExif: false };
  const hasCameraExif = Boolean(exif.Make || exif.Model);
  return { hasCameraExif };
}

// Categories that are typically photographed physical objects rather than
// screenshotted/downloaded — a small confidence nudge when EXIF confirms
// this came off a camera. Deliberately small (+0.05) and one-directional:
// no camera EXIF is NOT evidence against these categories (plenty of real
// medication/business-card photos get re-saved, edited, or shared through
// an app that strips EXIF before they reach us).
const CAMERA_LIKELY_CATEGORIES = new Set(['business_card', 'medication']);

export function applyMetadataNudge(category: string, confidence: number, metadata: PhotoMetadata | undefined): number {
  if (metadata?.hasCameraExif && CAMERA_LIKELY_CATEGORIES.has(category)) {
    return Math.min(0.95, confidence + 0.05);
  }
  return confidence;
}
