from .config import settings
from .models import Category

VALID_CATEGORIES: list[Category] = [
    "business_card",
    "receipt",
    "event_flyer",
    "document",
    "other",
]

# Keyword heuristics mapping Vision label/text hints to a category.
_KEYWORDS: dict[Category, list[str]] = {
    "receipt": ["receipt", "total", "subtotal", "tax", "invoice", "cashier"],
    "business_card": ["business card", "card", "logo"],
    "event_flyer": ["flyer", "poster", "event", "ticket", "invitation"],
    "document": ["document", "text", "paper", "letter", "form"],
}


def classify_image(
    image_bytes: bytes, mock_category: str | None = None
) -> tuple[Category, float, str | None]:
    """Returns (category, confidence, ocr_text). ocr_text is the raw text Vision
    read off the photo (None if nothing was detected or Vision isn't configured).
    Falls back to a mock result when no Google credentials are configured, so the
    pipeline is testable end to end before real keys are provisioned."""
    if not settings.vision_enabled:
        category = mock_category if mock_category in VALID_CATEGORIES else "business_card"
        return category, 0.99, None  # type: ignore[return-value]

    from google.cloud import vision

    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)

    label_response = client.label_detection(image=image)
    text_response = client.text_detection(image=image)

    labels = " ".join(l.description.lower() for l in label_response.label_annotations)
    raw_text = text_response.text_annotations[0].description if text_response.text_annotations else ""
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
