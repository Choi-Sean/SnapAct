// ============================================================================
// LAYER 0 — on-device classification (apps/expo/src/layer0/)
// ============================================================================
// Ported keyword-matching classifier, kept in exact parity with the server's
// Layer 1 classifier (backend/app/vision.py's _KEYWORDS + classify_image
// scoring) so a photo gets the same category whether it's resolved on-device
// or falls through to the server. If you change one, change the other.
import { Category } from '../types';

const KEYWORDS: Record<Category, string[]> = {
  receipt: [
    'receipt', 'total', 'subtotal', 'tax', 'invoice', 'cashier',
    '영수증', '합계', '부가세', '카드승인',
    'レシート', '領収書', '合計', '小計',
    '收据', '小票', '发票', '合计', '收銀',
    'recibo', 'factura', 'total a pagar', 'subtotal',
    'reçu', 'facture', 'total ttc',
    'quittung', 'rechnung', 'gesamtbetrag', 'zwischensumme',
  ],
  business_card: [
    'business card', 'card', 'logo', 'tel', 'mobile', 'fax',
    '명함', '전화', '휴대폰', '연락처', '대표', '디자이너', '팀장', '과장', '부장',
    '名刺', '携帯', '電話',
    '名片', '手机', '电话',
    'tarjeta de presentación', 'tarjeta personal', 'móvil', 'teléfono',
    'carte de visite', 'portable', 'téléphone',
    'visitenkarte', 'mobil', 'telefon',
  ],
  event_flyer: [
    'flyer', 'poster', 'event', 'ticket', 'invitation',
    '초대장', '행사', '전단', '일시', '장소',
    'チラシ', '招待状', 'イベント', '日時', '会場',
    '传单', '邀请函', '活动', '时间', '地点',
    'folleto', 'invitación', 'evento',
    'dépliant', 'invitation', 'événement',
    'einladung', 'veranstaltung',
  ],
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
  document: [
    'document', 'letter', 'form',
    '문서', '서류', '양식',
    '書類', '文書', '用紙',
    '文档', '文件', '表格',
    'documento', 'formulario',
    'formulaire',
    'dokument', 'formular',
  ],
  other: [],
};

// A phone number is one of the few signals a business card almost always has
// and a document/receipt/flyer usually doesn't print in this exact grouped
// form — see vision.py's matching comment for the full reasoning (this
// exists because a real, non-English business card with no literal "business
// card" text on it was falling through to "document" instead).
const PHONE_PATTERN_RE = /\b\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4}\b/;
const PHONE_PATTERN_SCORE = 2;

export interface ClassifyResult {
  category: Category;
  confidence: number;
}

export function classifyText(ocrText: string): ClassifyResult {
  const haystack = ocrText.toLowerCase();
  const scores = {} as Record<Category, number>;
  for (const category of Object.keys(KEYWORDS) as Category[]) {
    const keywords = KEYWORDS[category];
    scores[category] = keywords.reduce((n, kw) => (haystack.includes(kw) ? n + 1 : n), 0);
  }
  if (PHONE_PATTERN_RE.test(ocrText)) {
    scores.business_card = (scores.business_card ?? 0) + PHONE_PATTERN_SCORE;
  }

  let best: Category = 'other';
  let bestScore = 0;
  for (const category of Object.keys(scores) as Category[]) {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      best = category;
    }
  }

  const confidence = bestScore ? Math.min(0.95, 0.5 + bestScore * 0.15) : 0.3;
  return { category: best, confidence };
}
