// ============================================================================
// LAYER 0 — on-device medication field extraction (mobile/src/layer0/)
// ============================================================================
// Regex/keyword based, not an LLM — this is the tradeoff for a medication
// photo never leaving the device. It will miss things Claude's Layer 1
// extraction (backend/app/claude_analysis.py) would catch; it's shipped
// anyway because for this specific category, "resolved on-device with a
// gap" beats "fully accurate but sent to the server" per the product's
// privacy stance on medication/prescription photos.
import { MealRelation, MedicationPayload } from '../types';

interface MealKeywords {
  before: string[];
  after: string[];
  with: string[];
}

// All 7 supported languages (en/ko/ja/zh/es/fr/de) — see classify.ts's
// KEYWORDS.medication for the matching classification-only keyword list.
const MEAL_KEYWORDS: MealKeywords = {
  before: ['before meals', 'before meal', '식전', '食前', '饭前', '餐前', 'antes de las comidas', 'antes de comer', 'avant les repas', 'vor den mahlzeiten'],
  after: ['after meals', 'after meal', '식후30분', '식후 30분', '식후', '食後', '饭后', '餐后', 'después de las comidas', 'después de comer', 'après les repas', 'nach den mahlzeiten'],
  with: ['with meals', 'with food', '식사와 함께', '식사 중', '食事と一緒に', '食事中', '随餐', '与餐同服', 'con las comidas', 'con la comida', 'avec les repas', 'zu den mahlzeiten', 'mit dem essen'],
};

const DOSAGE_RE = /(\d+(?:[.,]\d+)?\s?(?:mg|mcg|ml|g|iu))\b|(\d+\s?(?:정|캡슐|錠|カプセル|片|粒|胶囊|膠囊))/i;
const FREQUENCY_RE = /(\d+)\s*(?:times a day|times daily|회|回|次|veces al día|fois par jour|mal täglich)/i;
const DURATION_RE = /(\d+)\s*(?:days?|일분|일치|일간|일|日分|日間|日|天|días?|jours?|tage)\b/i;
const HHMM_RE = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;
const KOREAN_AMPM_RE = /(오전|오후)\s*(\d{1,2})\s*시/g;

function detectMealRelation(haystack: string): MealRelation {
  if (MEAL_KEYWORDS.after.some((kw) => haystack.includes(kw))) return 'after_meal';
  if (MEAL_KEYWORDS.before.some((kw) => haystack.includes(kw))) return 'before_meal';
  if (MEAL_KEYWORDS.with.some((kw) => haystack.includes(kw))) return 'with_meal';
  return 'unspecified';
}

function extractSpecificTimes(rawText: string): string[] {
  const times: string[] = [];

  for (const match of rawText.matchAll(HHMM_RE)) {
    times.push(`${match[1].padStart(2, '0')}:${match[2]}`);
  }
  for (const match of rawText.matchAll(KOREAN_AMPM_RE)) {
    let hour = parseInt(match[2], 10) % 12;
    if (match[1] === '오후') hour += 12;
    times.push(`${String(hour).padStart(2, '0')}:00`);
  }

  return [...new Set(times)];
}

// First non-empty OCR line, trimmed and length-capped — a rough stand-in for
// "the medication name," which is usually the largest/topmost text on a
// prescription label. No LLM on-device to actually identify it as a name.
function guessName(rawText: string): string | undefined {
  const line = rawText
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length >= 2);
  if (!line) return undefined;
  return line.length > 40 ? line.slice(0, 40) : line;
}

export function extractMedication(rawText: string): MedicationPayload {
  const haystack = rawText.toLowerCase();
  const dosageMatch = rawText.match(DOSAGE_RE);
  const frequencyMatch = haystack.match(FREQUENCY_RE);
  const durationMatch = haystack.match(DURATION_RE);
  const specificTimes = extractSpecificTimes(rawText);

  return {
    name: guessName(rawText),
    dosage: dosageMatch ? (dosageMatch[1] ?? dosageMatch[2])?.trim() : undefined,
    times_per_day: frequencyMatch ? parseInt(frequencyMatch[1], 10) : specificTimes.length || undefined,
    duration_days: durationMatch ? parseInt(durationMatch[1], 10) : undefined,
    relation_to_meal: detectMealRelation(haystack),
    specific_times: specificTimes.length ? specificTimes : undefined,
  };
}
