import base64
import json

from .config import settings
from .models import AnalyzeResponse, CalendarPayload, Category, ContactPayload

_MOCK_RESULTS: dict[Category, dict] = {
    "business_card": {
        "suggested_action": "contact",
        "contact": {
            "name": "Jane Kim",
            "phone": "+82-10-1234-5678",
            "email": "jane.kim@example.com",
            "company": "Acme Corp",
            "title": "Product Manager",
        },
        "summary": "Business card for Jane Kim, Product Manager at Acme Corp.",
    },
    "receipt": {
        "suggested_action": "note",
        "summary": "Receipt from Acme Cafe, total 18,500 KRW, dated 2026-08-10.",
    },
    "event_flyer": {
        "suggested_action": "calendar",
        "calendar": {
            "title": "Acme Product Launch",
            "location": "Seoul Trade Center, Hall 3",
            "start_date": "2026-09-01T18:00:00+09:00",
            "end_date": "2026-09-01T20:00:00+09:00",
            "notes": "Doors open at 5:30pm. Bring ID for registration.",
        },
        "summary": "Event flyer for the Acme Product Launch on 2026-09-01.",
    },
    "document": {
        "suggested_action": "note",
        "summary": "General document, no structured fields confidently extracted.",
    },
    "other": {
        "suggested_action": "none",
        "summary": "Could not confidently classify this image.",
    },
}

_PROMPT_HEADER = """You are analyzing a photo that was pre-classified as "{category}" by a
first-pass vision model. {source_instruction}

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:
{{
  "suggested_action": "contact" | "calendar" | "note" | "none",
  "contact": {{"name": str|null, "phone": str|null, "email": str|null, "company": str|null, "title": str|null}} | null,
  "calendar": {{"title": str|null, "location": str|null, "start_date": ISO8601|null, "end_date": ISO8601|null, "notes": str|null}} | null,
  "raw_text": str | null,
  "summary": str
}}

Use "contact" for business cards, "calendar" for events/flyers with a date, "note" for
receipts/documents worth saving as text, "none" if nothing useful can be extracted.
Only include the "contact" or "calendar" object relevant to suggested_action; set the other to null.
"""


def analyze(
    image_bytes: bytes,
    category: Category,
    confidence: float,
    media_type: str = "image/jpeg",
    ocr_text: str | None = None,
) -> AnalyzeResponse:
    """ocr_text, if provided, is Vision's OCR output for the photo. When present we send
    Claude that text instead of the raw image — text tokens are far cheaper than image
    tokens, and for text-dense categories (receipts, documents) the text alone is enough
    to extract fields from."""
    if not settings.claude_enabled:
        mock = _MOCK_RESULTS[category]
        return AnalyzeResponse(
            mock=True,
            category=category,
            confidence=confidence,
            suggested_action=mock["suggested_action"],
            contact=ContactPayload(**mock["contact"]) if "contact" in mock else None,
            calendar=CalendarPayload(**mock["calendar"]) if "calendar" in mock else None,
            summary=mock["summary"],
        )

    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    if ocr_text:
        prompt = _PROMPT_HEADER.format(
            category=category,
            source_instruction="Below is the OCR text Vision extracted from the photo. Read it and extract structured data.",
        )
        content = [{"type": "text", "text": f'{prompt}\nOCR text:\n"""\n{ocr_text}\n"""'}]
    else:
        prompt = _PROMPT_HEADER.format(category=category, source_instruction="Look at the image and extract structured data.")
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}},
            {"type": "text", "text": prompt},
        ]

    message = client.messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
    )

    text = "".join(block.text for block in message.content if block.type == "text")
    data = json.loads(text)

    return AnalyzeResponse(
        mock=False,
        category=category,
        confidence=confidence,
        suggested_action=data.get("suggested_action", "none"),
        contact=ContactPayload(**data["contact"]) if data.get("contact") else None,
        calendar=CalendarPayload(**data["calendar"]) if data.get("calendar") else None,
        raw_text=data.get("raw_text"),
        summary=data.get("summary"),
    )
