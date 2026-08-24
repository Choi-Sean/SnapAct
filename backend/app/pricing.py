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
      - business_card / receipt / event_flyer still fall through to
        Layer 1 below (analyzeOnDevice.ts returns null for these — this
        is normal routing, not a capability failure). "other" with zero
        keyword matches also falls through rather than being confirmed
        locally, since that's just as likely a real card/receipt/flyer
        whose language classify.ts's keyword lists don't cover.
    capability.ts detects whether Layer 0 can run at all on this device/
    build (native module linked? did a call fail at runtime, e.g. no
    Google Play services on Android?) — apps/expo/src/AnalyzeScreen.tsx's
    resolveAnalysis() only prompts the Layer 1 fallback alert for a real
    capability gap, never for normal category routing. consent.ts stores
    the "always use Layer 1 without asking" choice — SecureStore only,
    deliberately never sent to the server (see consent.ts's own comment).

  LAYER 1 — server-side, backend/app/main.py's /analyze endpoint.
    Runs Google Cloud Vision (classify) and, for medication, the same
    deterministic regex extraction as Layer 0 (medication_extract.py —
    keep it in sync with medicationExtract.ts/MedicationExtractor.swift).
    No Claude, no other paid AI call, and — as of this session — no token
    spend either: business_card/receipt/event_flyer get classified and
    handed back with the raw OCR text and an honest "not extracted yet"
    summary, not fabricated fields. There was a Claude-based extraction
    path here before; it was removed because it was never actually wired
    up with a real API key in production and was silently serving
    hardcoded placeholder data (a real bug a user hit) instead of an
    error — see git history for backend/app/claude_analysis.py if you
    need the old prompt/shape for reference.
    Layer 1 is the fallback for: devices/builds that can't run Layer 0 at
    all (apps/expo/src/layer0/capability.ts), and categories Layer 0 never
    attempts extraction for. There's no language-specific OCR gap to route
    around: Google ML Kit's on-device recognizer ships its own model per
    script (Latin/Chinese/Japanese/Korean/Devanagari), not gated by OS
    version the way Apple's own Vision framework is.

  LAYER 2 — reserved for real structured extraction (agentic AI or
    similar) of business_card/receipt/event_flyer, once built. Nothing
    routes here yet — /analyze doesn't call anything for these categories
    beyond classification. LAYER2_TOKEN_COST is a forward reference for
    when this exists; it isn't charged anywhere right now.
=============================================================================
"""

from .models import Category

# Categories Layer 0 (and, in this version, Layer 1) can fully resolve on
# their own without needing Layer 2 — either genuinely sensitive
# (medication/prescriptions, matching the "never leaves the device"
# privacy principle) or low-extraction-value (document, unrecognized)
# enough that a plain classification + raw text is already useful.
LAYER0_CATEGORIES: frozenset[Category] = frozenset({"medication", "document", "other"})

# Forward reference for Layer 2 (not yet built, not yet charged anywhere —
# see this file's header). Kept so the token/Stripe infrastructure already
# built (payments.py, the web dashboard's token packages) has a real number
# to display instead of inventing one later.
LAYER2_TOKEN_COST = 10

STARTER_TOKENS = 50

# Sample pricing — placeholders to be tuned once real usage data exists.
TOKEN_PACKAGES = [
    {"id": "small", "tokens": 100, "price_usd": 2.99},
    {"id": "medium", "tokens": 500, "price_usd": 9.99},
    {"id": "large", "tokens": 1500, "price_usd": 19.99},
]
