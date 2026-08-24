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
  1. A Luhn-valid card number printed in classic grouped format (4 digits,
     separator, 4 digits, separator, 4 digits, separator, 1-7 digits — e.g.
     "4111 1111 1111 1111"). This is the strong one, but it used to match
     *any* 13-19 digit run regardless of formatting, which was a real
     production false positive: a Korean receipt's unbroken barcode/receipt
     number ("0111621511030002000850") happened to pass Luhn by chance
     (~1-in-10 odds for any sufficiently long digit string, so not rare)
     and blocked a completely ordinary receipt. Requiring the grouped
     format fixes that — real printed card numbers are essentially always
     grouped this way, and a barcode/receipt/tracking number essentially
     never is.
  2. A card-brand keyword (VISA/MASTERCARD/...) together with an expiry
     date/keyword — catches a photo where the number OCR'd badly but the
     rest of the card is legible. Requiring *both* (not just the brand
     word alone) keeps a receipt that mentions "paid by Visa" from
     tripping this — no expiry date on a receipt.
"""
import re

_CARD_NUMBER_RE = re.compile(r"\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{1,7}\b")

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
    for match in _CARD_NUMBER_RE.finditer(text):
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
