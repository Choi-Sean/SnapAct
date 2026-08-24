"""
Text-pattern payment-card detector — a stopgap for the Tier-0 "never leaves
the device" blocking guarantee that apps/expo/modules/coreml-classify/'s
on-device image classifier was meant to provide (see pricing.py's L1
paragraph). That model isn't linked into a real build yet, so today nothing
stops a payment card photo from reaching this server at all. This runs on
whatever OCR text Vision already extracted (server-side) — no image
classification needed — and is mirrored 1:1 in
apps/expo/src/layer0/sensitiveCard.ts (on-device, runs before anything is
even uploaded) and apps/ios/ShareExtension/SensitiveCardDetector.swift.

Two independent signals, either one blocks:
  1. A Luhn-valid 13-19 digit run — this is the strong one. Real, unmasked
     card numbers pass Luhn by construction; a phone number, tracking
     number, or receipt total practically never does. Low false-positive
     rate on its own.
  2. A card-brand keyword (VISA/MASTERCARD/...) together with an expiry
     date/keyword — catches a photo where the number OCR'd badly but the
     rest of the card is legible. Requiring *both* (not just the brand
     word alone) keeps a receipt that mentions "paid by Visa" from
     tripping this — no expiry date on a receipt.
"""
import re

_DIGIT_RUN_RE = re.compile(r"(?:\d[ -]?){13,19}")

_STRONG_BRAND_KEYWORDS = [
    "visa", "mastercard", "master card", "american express", "amex",
    "discover", "jcb", "unionpay", "diners club",
    "신용카드", "체크카드", "직불카드",
    "クレジットカード", "デビットカード",
    "信用卡", "借记卡",
]

_EXPIRY_PATTERN_RE = re.compile(r"\b(0[1-9]|1[0-2])\s*/\s*\d{2}\b")
_EXPIRY_KEYWORDS = ["good thru", "valid thru", "expires", "exp date", "유효기간", "만료일", "有効期限"]


def _luhn_valid(digits: str) -> bool:
    total = 0
    parity = len(digits) % 2
    for i, ch in enumerate(digits):
        d = int(ch)
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def _has_luhn_valid_card_number(text: str) -> bool:
    for match in _DIGIT_RUN_RE.finditer(text):
        digits = re.sub(r"[ -]", "", match.group())
        if 13 <= len(digits) <= 19 and _luhn_valid(digits):
            return True
    return False


def looks_like_payment_card(text: str) -> bool:
    if not text:
        return False
    if _has_luhn_valid_card_number(text):
        return True
    lower = text.lower()
    has_brand = any(kw in lower for kw in _STRONG_BRAND_KEYWORDS)
    has_expiry = bool(_EXPIRY_PATTERN_RE.search(text)) or any(kw in lower for kw in _EXPIRY_KEYWORDS)
    return has_brand and has_expiry
