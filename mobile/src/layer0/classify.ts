// ============================================================================
// LAYER 0 — on-device classification (mobile/src/layer0/)
// ============================================================================
// Ported keyword-matching classifier, kept in exact parity with the server's
// Layer 1 classifier (backend/app/vision.py's _KEYWORDS + classify_image
// scoring) so a photo gets the same category whether it's resolved on-device
// or falls through to the server. If you change one, change the other.
import { Category } from '../types';

const KEYWORDS: Record<Category, string[]> = {
  receipt: ['receipt', 'total', 'subtotal', 'tax', 'invoice', 'cashier'],
  business_card: ['business card', 'card', 'logo'],
  event_flyer: ['flyer', 'poster', 'event', 'ticket', 'invitation'],
  medication: [
    // English
    'medication', 'prescription', 'pharmacy', 'dosage', 'tablet', 'capsule',
    'before meals', 'after meals', 'twice daily', 'once daily', 'times a day',
    // Korean
    '복용법', '복용방법', '복용', '1일', '식전', '식후', '식후30분', '정제', '캡슐', '처방', '약국', '조제',
    // Japanese
    '服用', '服用方法', '用法', '食前', '食後', '錠', 'カプセル', '処方', '薬局', '1日',
    // Chinese (simplified + traditional) — 服用/用法/处方 already covered above
    '饭前', '饭后', '餐前', '餐后', '片', '胶囊', '膠囊', '處方', '药房', '藥局', '每日', '每天',
    // Spanish
    'medicamento', 'receta', 'farmacia', 'dosis', 'comprimido', 'cápsula',
    'antes de las comidas', 'después de las comidas', 'una vez al día', 'veces al día',
    // French
    'médicament', 'ordonnance', 'pharmacie', 'comprimé', 'gélule',
    'avant les repas', 'après les repas', 'par jour', 'fois par jour',
    // German
    'medikament', 'rezept', 'apotheke', 'dosierung', 'tablette', 'kapsel',
    'vor den mahlzeiten', 'nach den mahlzeiten', 'täglich', 'mal täglich',
  ],
  document: ['document', 'text', 'paper', 'letter', 'form'],
  other: [],
};

export interface ClassifyResult {
  category: Category;
  confidence: number;
}

export function classifyText(ocrText: string): ClassifyResult {
  const haystack = ocrText.toLowerCase();
  let best: Category = 'other';
  let bestScore = 0;

  for (const category of Object.keys(KEYWORDS) as Category[]) {
    const keywords = KEYWORDS[category];
    const score = keywords.reduce((n, kw) => (haystack.includes(kw) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  const confidence = bestScore ? Math.min(0.95, 0.5 + bestScore * 0.15) : 0.3;
  return { category: best, confidence };
}
