"""
=============================================================================
 SNAPSIST ANALYSIS LAYERS — architecture map
=============================================================================
This is the map of "where does each layer live in the source". Read this
before touching /analyze or the mobile capture flow.

  LAYER 0 — on-device, free, no tokens, no server round-trip for the
            analysis itself.
    Not implemented yet. Will live in mobile/src/layer0/ (new) using each
    OS's own native vision APIs — Apple Vision framework on iOS, Google
    ML Kit on Android — for label + OCR text extraction, run entirely on
    the phone. A photo that Layer 0 can fully handle (see LAYER0_CATEGORIES
    below) never needs to leave the device or cost anything.
    Device-capability detection (does this OS version / hardware support
    the on-device APIs at all) will also live there.

  LAYER 1 — server-side, backend/app/main.py's /analyze endpoint.
    Where every request lands today. Runs Google Cloud Vision (classify)
    then Anthropic Claude (structured field extraction). This is the ONLY
    layer that exists right now — until Layer 0 ships, every photo goes
    through here regardless of category.
    Token gating lives here: backend/app/main.py, the `requires_tokens`
    block right after `using_real_pipeline` is computed (search for
    "LAYER 1" in that file). LAYER0_CATEGORIES below is what decides
    "free even when it lands in Layer 1" vs. "costs LAYER1_TOKEN_COST".
    Once Layer 0 exists, Layer 1 becomes the fallback for: devices that
    can't run Layer 0, categories Layer 0 can't extract structured fields
    for on its own, and Korean/etc. OCR gaps in the OS's on-device model
    (see mobile-side device-capability plan).

  LAYER 2 — reserved, not yet defined.
    Placeholder for whatever comes after Layer 1 (batch/priority
    processing, a bigger model, etc.). Nothing routes here yet.
=============================================================================
"""

from .models import Category

# Categories that are free no matter which layer actually processes them —
# either genuinely sensitive (medication/prescriptions, matching the "Tier 0
# photos never leave the device" privacy principle) or low-extraction-value
# (document, unrecognized) enough that gating them isn't worth it.
# Once Layer 0 ships, these are exactly the categories it's expected to
# fully resolve on its own; everything else needs Layer 1's Claude call.
LAYER0_CATEGORIES: frozenset[Category] = frozenset({"medication", "document", "other"})

# What a Layer 1 (Claude) call costs for a non-free category.
LAYER1_TOKEN_COST = 10

STARTER_TOKENS = 50

# Sample pricing — placeholders to be tuned once real usage data exists.
TOKEN_PACKAGES = [
    {"id": "small", "tokens": 100, "price_usd": 2.99},
    {"id": "medium", "tokens": 500, "price_usd": 9.99},
    {"id": "large", "tokens": 1500, "price_usd": 19.99},
]


def is_layer0_category(category: Category) -> bool:
    return category in LAYER0_CATEGORIES
