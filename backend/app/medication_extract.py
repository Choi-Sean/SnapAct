"""
LAYER 1 — medication field extraction, regex port of
apps/expo/src/layer0/medicationExtract.ts (and apps/ios/ShareExtension/
MedicationExtractor.swift). Used when Layer 0 couldn't run on the device
and a medication photo falls through to the server — same deterministic
regex/keyword approach as the on-device version, not an LLM call, so a
medication result looks the same regardless of which layer produced it.
See main.py's "LAYER 1" section header for how this fits into /analyze.
"""
import re

from .models import MealRelation, MedicationPayload

# All 7 languages the app has shipped UI or OCR support for at some point —
# mirrors medicationExtract.ts's MEAL_KEYWORDS exactly. Keep both in sync.
_MEAL_BEFORE = ["before meals", "before meal", "식전", "食前", "饭前", "餐前", "antes de las comidas", "antes de comer", "avant les repas", "vor den mahlzeiten"]
_MEAL_AFTER = ["after meals", "after meal", "식후30분", "식후 30분", "식후", "食後", "饭后", "餐后", "después de las comidas", "después de comer", "après les repas", "nach den mahlzeiten"]
_MEAL_WITH = ["with meals", "with food", "식사와 함께", "식사 중", "食事と一緒に", "食事中", "随餐", "与餐同服", "con las comidas", "con la comida", "avec les repas", "zu den mahlzeiten", "mit dem essen"]

_DOSAGE_RE = re.compile(r"(\d+(?:[.,]\d+)?\s?(?:mg|mcg|ml|g|iu))\b|(\d+\s?(?:정|캡슐|錠|カプセル|片|粒|胶囊|膠囊))", re.IGNORECASE)
_FREQUENCY_RE = re.compile(r"(\d+)\s*(?:times a day|times daily|회|回|次|veces al día|fois par jour|mal täglich)", re.IGNORECASE)
# Tried in order: the specific-suffix pattern first, so "7일분" (duration)
# doesn't lose to an earlier, unrelated "1일 3회" (frequency) in the same
# text matching the bare "일"/"日"/"天" fallback instead.
_DURATION_SPECIFIC_RE = re.compile(r"(\d+)\s*(?:days?|일분|일치|일간|日分|日間|días?|jours?|tage)\b", re.IGNORECASE)
_DURATION_BARE_RE = re.compile(r"(\d+)\s*(?:일|日|天)\b", re.IGNORECASE)
_HHMM_RE = re.compile(r"\b([01]?\d|2[0-3]):([0-5]\d)\b")
_KOREAN_AMPM_RE = re.compile(r"(오전|오후)\s*(\d{1,2})\s*시")


def _detect_meal_relation(haystack: str) -> MealRelation:
    if any(kw in haystack for kw in _MEAL_AFTER):
        return "after_meal"
    if any(kw in haystack for kw in _MEAL_BEFORE):
        return "before_meal"
    if any(kw in haystack for kw in _MEAL_WITH):
        return "with_meal"
    return "unspecified"


def _extract_specific_times(raw_text: str) -> list[str]:
    times: list[str] = []
    for match in _HHMM_RE.finditer(raw_text):
        times.append(f"{int(match.group(1)):02d}:{match.group(2)}")
    for match in _KOREAN_AMPM_RE.finditer(raw_text):
        hour = int(match.group(2)) % 12
        if match.group(1) == "오후":
            hour += 12
        times.append(f"{hour:02d}:00")
    # Dedupe, preserve first-seen order.
    seen: set[str] = set()
    return [t for t in times if not (t in seen or seen.add(t))]


def _guess_name(raw_text: str) -> str | None:
    for line in raw_text.split("\n"):
        line = line.strip()
        if len(line) >= 2:
            return line[:40]
    return None


def extract(raw_text: str) -> MedicationPayload:
    haystack = raw_text.lower()
    dosage_match = _DOSAGE_RE.search(raw_text)
    frequency_match = _FREQUENCY_RE.search(haystack)
    duration_match = _DURATION_SPECIFIC_RE.search(haystack) or _DURATION_BARE_RE.search(haystack)
    specific_times = _extract_specific_times(raw_text)

    return MedicationPayload(
        name=_guess_name(raw_text),
        dosage=(dosage_match.group(1) or dosage_match.group(2)).strip() if dosage_match else None,
        times_per_day=int(frequency_match.group(1)) if frequency_match else (len(specific_times) or None),
        duration_days=int(duration_match.group(1)) if duration_match else None,
        relation_to_meal=_detect_meal_relation(haystack),
        specific_times=specific_times or None,
    )
