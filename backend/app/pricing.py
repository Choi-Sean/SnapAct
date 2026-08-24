"""
=============================================================================
 SNAPSIST ANALYSIS LAYERS — architecture map
=============================================================================
This is the map of "where does each layer live in the source". Read this
before touching /analyze or the mobile capture flow.

  LAYER 0 — on-device, free, no tokens, no server round-trip for the
            analysis itself.
    Lives in apps/expo/src/layer0/. Google ML Kit's on-device text recognizer
    runs the OCR on BOTH platforms (apps/expo/src/layer0/textRecognition.ts,
    via @react-native-ml-kit/text-recognition) — iOS deliberately uses
    ML Kit's iOS SDK here rather than Apple's own Vision framework (a
    session decision: same on-device/free/no-network guarantee, far less
    native Swift to hand-write and verify blind). classify.ts ports the
    exact keyword scoring below so a photo lands in the same category
    whether Layer 0 or Layer 1 resolves it. Once classified:
      - medication / document / other (LAYER0_CATEGORIES) resolve fully
        on-device — medicationExtract.ts does regex/keyword field
        extraction (name/dosage/frequency/duration/meal-timing/times),
        no LLM, so these categories never leave the phone.
      - business_card / receipt / event_flyer still need Claude's
        extraction and fall through to Layer 1 below (analyzeOnDevice.ts
        returns null for these — this is normal routing, not a capability
        failure).
    capability.ts detects whether Layer 0 can run at all on this device/
    build (native module linked? did a call fail at runtime, e.g. no
    Google Play services on Android?) — apps/expo/src/AnalyzeScreen.tsx's
    resolveAnalysis() only prompts the Layer 1 fallback alert for a real
    capability gap, never for normal category routing. consent.ts stores
    the "always use Layer 1 without asking" choice — SecureStore only,
    deliberately never sent to the server (see consent.ts's own comment).

  LAYER 1 — server-side, backend/app/main.py's /analyze endpoint.
    Where every request lands today. Runs Google Cloud Vision (classify)
    then Anthropic Claude (structured field extraction). This is the ONLY
    layer that exists right now — until Layer 0 ships, every photo goes
    through here regardless of category.
    Token gating lives here: backend/app/main.py, the `requires_tokens`
    block right after `using_real_pipeline` is computed (search for
    "LAYER 1" in that file). LAYER0_CATEGORIES below is what decides
    "free even when it lands in Layer 1" vs. "costs LAYER1_TOKEN_COST".
    Layer 1 is the fallback for: devices/builds that can't run Layer 0 at
    all (apps/expo/src/layer0/capability.ts), and categories Layer 0 never
    attempts extraction for (business_card/receipt/event_flyer — always
    Claude's job). There's no language-specific OCR gap to route around:
    Google ML Kit's on-device recognizer ships its own model per script
    (Latin/Chinese/Japanese/Korean/Devanagari), not gated by OS version the
    way Apple's own Vision framework is — an earlier draft of this plan
    assumed a Korean/Japanese gap on older iOS that doesn't actually apply
    here.

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
