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
# labels are almost always in the user's own language, not the English
# vocabulary Vision's generic label detection returns, so that entry covers
# every language the app supports (en/ko/ja/zh/es/fr/de) rather than just
# English + the one language whichever engineer wrote this happened to test
# with. All values must be lowercase — haystack is lowercased before matching.
_KEYWORDS: dict[Category, list[str]] = {
    "receipt": ["receipt", "total", "subtotal", "tax", "invoice", "cashier"],
    "business_card": ["business card", "card", "logo"],
    "event_flyer": ["flyer", "poster", "event", "ticket", "invitation"],
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
    "document": ["document", "text", "paper", "letter", "form"],
}


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

    best_category: Category = "other"
    best_score = 0
    for category, keywords in _KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in haystack)
        if score > best_score:
            best_score = score
            best_category = category

    confidence = min(0.95, 0.5 + best_score * 0.15) if best_score else 0.3
    return best_category, confidence, (raw_text.strip() or None)
