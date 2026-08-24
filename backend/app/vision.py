import re

from .config import settings
from .models import Category

VALID_CATEGORIES: list[Category] = [
    "business_card",
    "receipt",
    "event_flyer",
    "document",
    "medication",
    "other",
]

# Keyword heuristics mapping Vision label/text hints to a category. Medication
# was the only fully multilingual list here for a while (en/ko/ja/zh/es/fr/de)
# — the others were English-only, which meant a real, non-English business
# card (no literal "business card"/"card"/"logo" text on it, which most
# don't print) had nothing to match, while Vision's generic image labels for
# basically any photographed paper/text ("Text", "Paper", "Document") kept
# handing the win to "document" instead. Fixed two ways: (1) "text"/"paper"
# dropped from document's list — too generic to mean anything, they matched
# almost every photo Vision saw; (2) every category below got real
# translations, not just English, same treatment medication already had.
# All values must be lowercase — haystack is lowercased before matching.
_KEYWORDS: dict[Category, list[str]] = {
    "receipt": [
        "receipt", "total", "subtotal", "tax", "invoice", "cashier",
        "영수증", "합계", "부가세", "카드승인",
        "レシート", "領収書", "合計", "小計",
        "收据", "小票", "发票", "合计", "收銀",
        "recibo", "factura", "total a pagar", "subtotal",
        "reçu", "facture", "total ttc",
        "quittung", "rechnung", "gesamtbetrag", "zwischensumme",
    ],
    "business_card": [
        "business card", "card", "logo", "tel", "mobile", "fax",
        "명함", "전화", "휴대폰", "연락처", "대표", "디자이너", "팀장", "과장", "부장",
        "名刺", "携帯", "電話",
        "名片", "手机", "电话",
        "tarjeta de presentación", "tarjeta personal", "móvil", "teléfono",
        "carte de visite", "portable", "téléphone",
        "visitenkarte", "mobil", "telefon",
    ],
    "event_flyer": [
        "flyer", "poster", "event", "ticket", "invitation",
        "초대장", "행사", "전단", "일시", "장소",
        "チラシ", "招待状", "イベント", "日時", "会場",
        "传单", "邀请函", "活动", "时间", "地点",
        "folleto", "invitación", "evento",
        "dépliant", "invitation", "événement",
        "einladung", "veranstaltung",
    ],
    "medication": [
        # English
        "medication", "prescription", "pharmacy", "dosage", "tablet", "capsule",
        "before meals", "after meals", "twice daily", "once daily", "times a day",
        # Korean
        "복용법", "복용방법", "복용", "1일", "식전", "식후", "식후30분", "정제", "캡슐", "처방", "약국", "조제",
        # Japanese
        "服用", "服用方法", "用法", "食前", "食後", "錠", "カプセル", "処方", "薬局", "1日",
        # Chinese (simplified + traditional) — 服用/用法/处方 already covered above
        "饭前", "饭后", "餐前", "餐后", "片", "胶囊", "膠囊", "處方", "药房", "藥局", "每日", "每天",
        # Spanish
        "medicamento", "receta", "farmacia", "dosis", "comprimido", "cápsula",
        "antes de las comidas", "después de las comidas", "una vez al día", "veces al día",
        # French
        "médicament", "ordonnance", "pharmacie", "comprimé", "gélule",
        "avant les repas", "après les repas", "par jour", "fois par jour",
        # German
        "medikament", "rezept", "apotheke", "dosierung", "tablette", "kapsel",
        "vor den mahlzeiten", "nach den mahlzeiten", "täglich", "mal täglich",
    ],
    "document": [
        "document", "letter", "form",
        "문서", "서류", "양식",
        "書類", "文書", "用紙",
        "文档", "文件", "表格",
        "documento", "formulario",
        "document", "formulaire",
        "dokument", "formular",
    ],
}

# A phone number is one of the few signals a business card almost always has
# and a document/receipt/flyer usually doesn't print in this exact grouped
# form — much more reliable than hoping the card literally says "business
# card" on itself (most don't) or that Vision's labels happen to say so.
# Matches common groupings like "010-1234-5678", "051-123-4567", "02 1234 5678".
_PHONE_PATTERN_RE = re.compile(r"\b\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4}\b")
_PHONE_PATTERN_SCORE = 2


def classify_image(
    image_bytes: bytes, mock_category: str | None = None, force_mock: bool = False
) -> tuple[Category, float, str | None]:
    """Returns (category, confidence, ocr_text). ocr_text is the raw text Vision
    read off the photo (None if nothing was detected or Vision isn't configured).
    Falls back to a mock result when no Google credentials are configured, so the
    pipeline is testable end to end before real keys are provisioned. force_mock
    lets a caller skip the real (paid) API even when credentials are configured —
    used when the daily spend cap has been hit."""
    if force_mock or not settings.vision_enabled:
        category = mock_category if mock_category in VALID_CATEGORIES else "business_card"
        return category, 0.99, None  # type: ignore[return-value]

    import json

    from google.cloud import vision
    from google.oauth2 import service_account

    # Loaded explicitly rather than relying on the GOOGLE_APPLICATION_CREDENTIALS
    # env var: pydantic-settings reads .env into its own Settings object, it
    # doesn't export the value into the real process environment, so Google's
    # Application Default Credentials lookup would never see it otherwise.
    # On Railway the key file itself doesn't exist in the build (it's
    # gitignored), so the full JSON is passed as one env var instead and
    # parsed directly; local dev keeps using the file path.
    if settings.google_application_credentials_json:
        info = json.loads(settings.google_application_credentials_json)
        credentials = service_account.Credentials.from_service_account_info(info)
    else:
        credentials = service_account.Credentials.from_service_account_file(settings.google_application_credentials)
    client = vision.ImageAnnotatorClient(credentials=credentials)
    image = vision.Image(content=image_bytes)

    # Both features in one request instead of two separate label_detection()/
    # text_detection() calls — halves the network round-trips to Vision,
    # which was a meaningful chunk of /analyze's latency.
    response = client.annotate_image({
        "image": image,
        "features": [
            {"type_": vision.Feature.Type.LABEL_DETECTION},
            {"type_": vision.Feature.Type.TEXT_DETECTION},
        ],
    })

    labels = " ".join(l.description.lower() for l in response.label_annotations)
    raw_text = response.text_annotations[0].description if response.text_annotations else ""
    haystack = f"{labels} {raw_text.lower()}"

    scores: dict[Category, int] = {
        category: sum(1 for kw in keywords if kw in haystack) for category, keywords in _KEYWORDS.items()
    }
    if _PHONE_PATTERN_RE.search(raw_text):
        scores["business_card"] = scores.get("business_card", 0) + _PHONE_PATTERN_SCORE

    best_category: Category = "other"
    best_score = 0
    for category, score in scores.items():
        if score > best_score:
            best_score = score
            best_category = category

    confidence = min(0.95, 0.5 + best_score * 0.15) if best_score else 0.3
    return best_category, confidence, (raw_text.strip() or None)
