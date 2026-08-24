"""
L5c — cloud LLM (Anthropic Claude), the most expensive/capable rung of the
L0-L5 layer ladder (see pricing.py's header for the full map). Only reached
for business_card/receipt/event_flyer, and only because L3's rule-based
extraction doesn't exist yet for those categories (medication/document/
other resolve at L3 without ever getting here — see main.py). L5a
(on-device Apple/Android LLM) and L5b (Apple Private Cloud Compute) are the
free rungs above this one; they're iOS/Android-native Swift/Kotlin work not
yet built (needs a real device + compiler this environment doesn't have),
so this backend path is the only L5 tier actually reachable right now.
"""
import base64
import json

from .config import settings
from .models import AnalyzeResponse, CalendarPayload, Category, ContactPayload, MedicationPayload

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
    "medication": {
        "suggested_action": "reminder",
        "medication": {
            "name": "Amoxicillin 500mg",
            "dosage": "1정",
            "times_per_day": 3,
            "duration_days": 7,
            "relation_to_meal": "after_meal",
            "specific_times": None,
        },
        "needs_time_selection": True,
        "summary": "Amoxicillin 500mg, 1일 3회 식후 복용, 7일치.",
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
  "suggested_action": "contact" | "calendar" | "note" | "reminder" | "none",
  "contact": {{"name": str|null, "phone": str|null, "email": str|null, "company": str|null, "title": str|null}} | null,
  "calendar": {{"title": str|null, "location": str|null, "start_date": ISO8601|null, "end_date": ISO8601|null, "notes": str|null}} | null,
  "medication": {{
    "name": str|null,
    "dosage": str|null,
    "times_per_day": int|null,
    "duration_days": int|null,
    "relation_to_meal": "before_meal" | "after_meal" | "with_meal" | "unspecified" | null,
    "specific_times": [str, ...]|null,
    "notes": str|null
  }} | null,
  "needs_time_selection": bool,
  "raw_text": str | null,
  "summary": str
}}

Use "contact" for business cards, "calendar" for events/flyers with a date, "note" for
receipts/documents worth saving as text, "reminder" for medication/prescription labels with
dosage or a schedule, "none" if nothing useful can be extracted.
Only include the "contact", "calendar", or "medication" object relevant to suggested_action;
set the others to null.

For "reminder"/medication: "specific_times" is a list of 24h "HH:MM" strings ONLY if the label
states an actual clock time (e.g. "매일 오전 9시" -> ["09:00"]). If the label only gives
meal-relative timing (식전/식후/공복) or a bare frequency ("1일 3회") with no clock time, leave
"specific_times" null.

Set "needs_time_selection" to true whenever a "calendar" or "medication" object is returned but
the source photo did not state an exact clock time (e.g. an event flyer with only a date, or
medication with only meal-relative timing) — the app will ask the user to pick a time in that
case. Set it to false when an exact time was found in the source, or when suggested_action is
"contact"/"note"/"none" (no time to confirm).

Ground every field in what the photo actually shows — never invent a value you can't point to
in the image or OCR text. If you're not confident a field is correct, leave it null rather than
guessing.
"""


def analyze(
    image_bytes: bytes,
    category: Category,
    confidence: float,
    media_type: str = "image/jpeg",
    ocr_text: str | None = None,
    force_mock: bool = False,
) -> AnalyzeResponse:
    """ocr_text, if provided, is Vision's OCR output for the photo. When present we send
    Claude that text instead of the raw image — text tokens are far cheaper than image
    tokens, and for text-dense categories (receipts, documents) the text alone is enough
    to extract fields from. force_mock skips the real (paid) API call even when Claude is
    configured — used when the daily spend cap has been hit."""
    if force_mock or not settings.claude_enabled:
        mock = _MOCK_RESULTS[category]
        return AnalyzeResponse(
            mock=True,
            category=category,
            confidence=confidence,
            suggested_action=mock["suggested_action"],
            contact=ContactPayload(**mock["contact"]) if "contact" in mock else None,
            calendar=CalendarPayload(**mock["calendar"]) if "calendar" in mock else None,
            medication=MedicationPayload(**mock["medication"]) if "medication" in mock else None,
            needs_time_selection=mock.get("needs_time_selection", False),
            summary=mock["summary"],
            resolved_layer="L5c",
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
        medication=MedicationPayload(**data["medication"]) if data.get("medication") else None,
        needs_time_selection=bool(data.get("needs_time_selection", False)),
        raw_text=data.get("raw_text"),
        summary=data.get("summary"),
        resolved_layer="L5c",
    )
