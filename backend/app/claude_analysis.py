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
import logging

from .config import settings
from .models import AnalyzeResponse, CalendarPayload, Category, ContactPayload, MedicationPayload, ReceiptPayload
from .pricing import LAYER2_TOKEN_COST

logger = logging.getLogger(__name__)

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
        "receipt": {
            "store": "Acme Cafe",
            "date": "2026-08-10",
            "items": [
                {"name": "Latte", "price": "5,500"},
                {"name": "Sandwich", "price": "13,000"},
            ],
            "subtotal": "16,818",
            "tax": "1,682",
            "total": "18,500",
        },
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
first-pass vision model. That first pass can be wrong (e.g. a store receipt
sometimes gets mislabeled "business_card") — decide suggested_action and
which payload to fill from what the photo/text actually shows, not from
this label. {source_instruction}

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:
{{
  "suggested_action": "contact" | "calendar" | "note" | "reminder" | "none",
  "contact": {{"name": str|null, "phone": str|null, "email": str|null, "company": str|null, "title": str|null}} | null,
  "calendar": {{"title": str|null, "location": str|null, "start_date": ISO8601|null, "end_date": ISO8601|null, "notes": str|null}} | null,
  "receipt": {{
    "store": str|null,
    "date": str|null,
    "items": [{{"name": str, "price": str}}, ...] | null,
    "subtotal": str|null,
    "tax": str|null,
    "total": str|null,
    "due_date": ISO8601|null
  }} | null,
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
Only include the "contact", "calendar", "receipt", or "medication" object relevant to
suggested_action; set the others to null.

For "note"/receipts specifically: fill in "receipt" with whatever of store name, purchase
date, line items (name + price each), subtotal, tax, and total you can actually read on the
receipt. Leave individual fields (or the whole "items" list) null/empty rather than guessing
if the photo doesn't show them clearly — a receipt with a torn or blurry item list should
still have "store"/"date"/"total" filled in even if "items" comes back null. "receipt" stays
null for non-receipt "note" cases (e.g. a general document).

"date" and "due_date" are different things — don't confuse them. "date" is when the
transaction/purchase happened. "due_date" is a payment deadline stated separately from that
(look for a literal "Due Date" / "지불 기한" / "결제 기한" label, or invoice terms like "payment
due within N days" combined with the invoice date) — this only appears on invoices/bills, not
ordinary paid-in-full store receipts, so leave it null unless the photo actually states one.

Skip line items that are clearly
not products (barcodes, product codes, membership/point numbers, card approval numbers) —
only include actual purchased items with a name and price.

Leave "raw_text" null whenever OCR text was already given to you above as input — it would
just be a copy of what you were already given, wasting output space you need for "receipt"'s
item list instead. Only fill "raw_text" in when you were shown an image directly and it's
genuinely useful to report back what you read.

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
) -> tuple[AnalyzeResponse, bool]:
    """ocr_text, if provided, is Vision's OCR output for the photo. When present we send
    Claude that text instead of the raw image — text tokens are far cheaper than image
    tokens, and for text-dense categories (receipts, documents) the text alone is enough
    to extract fields from. force_mock skips the real (paid) API call even when Claude is
    configured — used when the daily spend cap has been hit.

    Returns (response, succeeded). succeeded is False whenever Claude was actually
    called (tokens already spent, per main.py's try_spend_tokens before this runs)
    but didn't produce a usable result -- main.py refunds the spend in that case."""
    if force_mock or not settings.claude_enabled:
        mock = _MOCK_RESULTS[category]
        return AnalyzeResponse(
            mock=True,
            category=category,
            confidence=confidence,
            suggested_action=mock["suggested_action"],
            contact=ContactPayload(**mock["contact"]) if "contact" in mock else None,
            calendar=CalendarPayload(**mock["calendar"]) if "calendar" in mock else None,
            receipt=ReceiptPayload(**mock["receipt"]) if "receipt" in mock else None,
            medication=MedicationPayload(**mock["medication"]) if "medication" in mock else None,
            needs_time_selection=mock.get("needs_time_selection", False),
            summary=mock["summary"],
            resolved_layer="L5c",
        ), True

    # Claude can fail in ways that have nothing to do with our schema: a
    # network/rate-limit error from the API call itself, or (seen in
    # production with a real payment-card photo sent as "business_card" —
    # Claude declined to transcribe it and replied with plain-text prose
    # instead of the requested JSON) a 200 response that isn't valid JSON.
    # Both used to be unhandled and surfaced as a bare 500 to the app; now
    # they degrade to the same "couldn't extract anything" result a
    # low-confidence classification would already produce.
    def _fallback(reason: str) -> tuple[AnalyzeResponse, bool]:
        logger.warning("Claude L5c call failed for category=%s: %s", category, reason)
        return AnalyzeResponse(
            mock=False,
            category=category,
            confidence=confidence,
            suggested_action="none",
            summary="Couldn't extract structured data from this photo — no tokens were charged. Try again, or a clearer photo.",
            resolved_layer="L5c",
            analysis_failed=True,
        ), False

    # Everything from here down is wrapped in one broad try/except as a final
    # safety net (below the specific except clauses, which exist so the log
    # message says *what* went wrong). This is what actually crashed in
    # production: anthropic==0.34.2 (pinned in requirements.txt) constructs
    # its internal httpx client with a `proxies` kwarg that newer httpx
    # versions (unpinned, so pip resolved latest) removed -- Anthropic(...)
    # itself raised TypeError before ever reaching a try block, since client
    # construction used to happen outside this function's error handling
    # entirely. Fixed properly by pinning a current anthropic version (see
    # requirements.txt), but client construction is now inside the safety
    # net too so a similar dependency mismatch degrades gracefully instead
    # of crashing raw next time.
    try:
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
            # 1024 was enough before receipts got a structured "items" list —
            # a receipt with several line items (each name + price) plus the
            # rest of the schema can genuinely run past that and get cut off
            # mid-JSON, which then fails to parse and looks identical to a
            # real extraction failure. Raised well past what even a long
            # itemized receipt needs.
            max_tokens=4096,
            messages=[{"role": "user", "content": content}],
        )

        text = "".join(block.text for block in message.content if block.type == "text").strip()
        # Defensive: the prompt says "no markdown fences", but strip them if
        # Claude adds them anyway rather than failing on it.
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            data = json.loads(text)
        except (json.JSONDecodeError, ValueError) as e:
            return _fallback(f"non-JSON response ({e}): {text[:200]!r}")

        return AnalyzeResponse(
            mock=False,
            category=category,
            confidence=confidence,
            suggested_action=data.get("suggested_action", "none"),
            contact=ContactPayload(**data["contact"]) if data.get("contact") else None,
            calendar=CalendarPayload(**data["calendar"]) if data.get("calendar") else None,
            receipt=ReceiptPayload(**data["receipt"]) if data.get("receipt") else None,
            medication=MedicationPayload(**data["medication"]) if data.get("medication") else None,
            needs_time_selection=bool(data.get("needs_time_selection", False)),
            raw_text=data.get("raw_text"),
            summary=data.get("summary"),
            resolved_layer="L5c",
            tokens_spent=LAYER2_TOKEN_COST,
        ), True
    except anthropic.APIError as e:
        return _fallback(f"API error: {e}")
    except Exception as e:  # noqa: BLE001 - intentional final safety net, see comment above
        logger.exception("Unexpected error in Claude L5c call for category=%s", category)
        return _fallback(f"unexpected error ({type(e).__name__}): {e}")
