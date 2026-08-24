// Text-pattern payment-card detector — a stopgap for the Tier-0 "never
// leaves the device" guarantee that ../../modules/coreml-classify/'s
// on-device image classifier was meant to provide (see visionGate.ts). That
// model isn't linked into a real build yet, so today nothing else stops a
// payment card photo from being uploaded at all. This runs on whatever OCR
// text recognizeText() already produced — no image classification needed —
// and is mirrored 1:1 in backend/app/sensitive_content.py (server-side
// fallback) and apps/ios/ShareExtension/SensitiveCardDetector.swift.
//
// Two independent signals, either one blocks:
//   1. A Luhn-valid card number printed in classic grouped format (4 digits,
//      separator, 4 digits, separator, 4 digits, separator, 1-7 digits —
//      e.g. "4111 1111 1111 1111"). Used to match *any* 13-19 digit run
//      regardless of formatting, which was a real production false
//      positive: a receipt's unbroken barcode/receipt number happened to
//      pass Luhn by chance (~1-in-10 odds for any sufficiently long digit
//      string) and blocked an ordinary receipt. Real printed card numbers
//      are essentially always grouped this way; a barcode never is.
//   2. A card-brand keyword (VISA/MASTERCARD/...) together with an expiry
//      date/keyword — catches a photo where the number OCR'd badly but the
//      rest of the card is legible. Requiring *both* keeps a receipt that
//      mentions "paid by Visa" from tripping this — no expiry date there.

const CARD_NUMBER_RE = /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}\b/g;

const STRONG_BRAND_KEYWORDS = [
  'visa', 'mastercard', 'master card', 'american express', 'amex',
  'discover', 'jcb', 'unionpay', 'diners club',
  '신용카드', '체크카드', '직불카드',
  'クレジットカード', 'デビットカード',
  '信用卡', '借记卡',
];

const EXPIRY_PATTERN_RE = /\b(0[1-9]|1[0-2])\s*\/\s*\d{2}\b/;
const EXPIRY_KEYWORDS = ['good thru', 'valid thru', 'expires', 'exp date', '유효기간', '만료일', '有効期限'];

function luhnValid(digits: string): boolean {
  let total = 0;
  const parity = digits.length % 2;
  for (let i = 0; i < digits.length; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === parity) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

function hasLuhnValidCardNumber(text: string): boolean {
  const matches = text.match(CARD_NUMBER_RE);
  if (!matches) return false;
  for (const m of matches) {
    const digits = m.replace(/[ -]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) return true;
  }
  return false;
}

export function looksLikePaymentCard(text: string): boolean {
  if (!text) return false;
  if (hasLuhnValidCardNumber(text)) return true;
  const lower = text.toLowerCase();
  const hasBrand = STRONG_BRAND_KEYWORDS.some((kw) => lower.includes(kw));
  const hasExpiry = EXPIRY_PATTERN_RE.test(text) || EXPIRY_KEYWORDS.some((kw) => lower.includes(kw));
  return hasBrand && hasExpiry;
}
