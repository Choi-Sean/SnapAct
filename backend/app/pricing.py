"""
=============================================================================
 SNAPSIST ANALYSIS LAYERS — L0-L5 architecture map
=============================================================================
A layer is "a processing step a photo passes through on the way to
becoming an action." Higher numbers are smarter and more expensive. Rule:
if a cheap layer can finish the job, it does — the pipeline never pays for
a more expensive layer than it needs.

  L0 — signals available without looking at pixels: barcode/QR content,
    EXIF, device state (was the phone just driving, etc). Not built yet
    except EXIF (apps/expo/src/layer0/metadata.ts,
    apps/ios/ShareExtension/PhotoMetadata.swift) — barcode/device-state are
    still to do. A clean L0 read (e.g. a QR code) can skip straight to L5
    for interpretation without ever touching L1-L4.

  L1 — "what kind of photo is this," from the image alone, no OCR yet.
    Language-independent (layout/shape), so this is the highest-leverage
    place to have "our own" model in a multilingual product. Also the
    Tier 0 blocking gate: ID/passport/payment-card/prescription/financial-
    doc must never leave the device, decided here, fail-closed.
    Lives in apps/expo/src/layer0/visionGate.ts + the Core ML model in
    apps/expo/modules/coreml-classify/ (iOS only; ported from a
    collaborator's spike, spikes/s3-l1-vision-classifier/ — NOT yet
    trained on enough real photos to trust the blocking guarantee, see
    that folder's README before relying on it).

  L2 — OCR. Not ours — Apple/Google's own recognizer
    (apps/expo/src/layer0/textRecognition.ts on-device via ML Kit,
    backend/app/vision.py server-side via Google Cloud Vision). Whatever
    it reads is what we get; this is the slowest, priciest layer before L5,
    which is why L1 running first (to narrow language/region) matters.

  L3 — turn OCR'd text fragments into named fields, with two things
    happening in one step: (a) shape-obvious values (phone numbers, email
    addresses — regex is enough) and (b) context-dependent role assignment
    (which fragment is the name vs. the title — needs position/size/
    surrounding text, not just regex). Only medication has real L3 rules
    right now (medication_extract.py, mirrored in
    apps/expo/src/layer0/medicationExtract.ts and
    apps/ios/ShareExtension/MedicationExtractor.swift) — document/other
    need no fields, and business_card/receipt/event_flyer have no L3 rules
    yet, so they fall through to L5c. Source-span grounding (which OCR
    fragment a field's value came from) isn't implemented yet — OCR output
    is currently flattened to a plain string, discarding the bounding-box
    info ML Kit/Vision actually return.

  L5 — real language understanding, for what L3's rules can't resolve.
    Three rungs, cheapest first:
      L5a on-device (Apple/Android's built-in model, free, never leaves
          the device) — not built, needs iOS 26 Foundation Models /
          Android ML Kit GenAI (Gemini Nano), both hardware-gated and
          both native Swift/Kotlin work this environment can't compile.
      L5b Apple Private Cloud Compute (free for small App Store Small
          Business Program developers as of WWDC 2026, smarter than L5a)
          — same native-Swift blocker as L5a.
      L5c cloud LLM, Anthropic Claude (claude_analysis.py) — the only L5
          rung actually reachable right now, since it's a plain server-
          side API call. Reached for business_card/receipt/event_flyer
          (LAYER2_TOKEN_COST tokens spent per call, see main.py) because
          L3 has no rules for those yet — not because they inherently
          need an LLM. As L3 rules get built out, L5c should get reached
          less often, not more.
    L5's prompt requires every field be grounded in what the photo/OCR
    text actually shows (see claude_analysis.py's _PROMPT_HEADER) — an
    LLM asked to extract structured data can otherwise invent plausible-
    looking values that were never in the source.

  L4 (native-action dispatch — save the result to Contacts/Calendar/
    Reminders/etc.) is intentionally not a numbered analysis layer here;
    it's the deterministic last step every path (L0/L1/L3/L5) ends at
    once a category + fields are known — see apps/expo/src/nativeActions.ts
    and apps/ios/ShareExtension/MedicationReminderSaver.swift.
=============================================================================
"""

from .models import Category

# Categories that resolve at L3 (deterministic rules) without ever needing
# L5 — either genuinely sensitive (medication/prescriptions — matching the
# "never leaves the device" privacy principle) or low-extraction-value
# (document, unrecognized) enough that a plain classification + raw text is
# already useful. Free no matter which layer actually resolves them.
LAYER0_CATEGORIES: frozenset[Category] = frozenset({"medication", "document", "other"})

# What an L5c (Claude) call costs — business_card/receipt/event_flyer only,
# and only when Claude is actually configured and gets used (see main.py).
LAYER2_TOKEN_COST = 10

STARTER_TOKENS = 50

# Sample pricing — placeholders to be tuned once real usage data exists.
TOKEN_PACKAGES = [
    {"id": "small", "tokens": 100, "price_usd": 2.99},
    {"id": "medium", "tokens": 500, "price_usd": 9.99},
    {"id": "large", "tokens": 1500, "price_usd": 19.99},
]
