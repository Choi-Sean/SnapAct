---
paths:
  - "packages/core/**"
  - "server/**"
  - "apps/*/**/Upload*"
  - "apps/*/**/Network*"
---

# Privacy tiers and enforcement

## Tier model

| Tier | Examples | Policy |
|---|---|---|
| **0** | IDs, passports, payment cards, prescriptions, medical records, financial docs | Never leaves the device. Upload path blocked at the gate |
| **1** | Business cards, receipts, documents, handwriting | Uploadable after consent. Server holds nothing — discard immediately after inference |
| **2** | Scenery, food, products, landmarks | Normal handling |

## Type-system enforcement

The network layer accepts only `UploadableImage`. Its initializer is reachable only through the
tier gate.

**No upload API taking raw `Data` or `UIImage` may exist.** Code that bypasses the gate must fail
to compile. A runtime check is not sufficient — someone will eventually bypass it.

```swift
// The only way to get one of these is through the gate.
struct UploadableImage {
    private init(validated: Data) { ... }
    static func make(_ gateResult: GateResult.Allowed) -> UploadableImage
}

// This must not exist, in any form, anywhere:
// func upload(_ data: Data) async throws
```

## Blocking gate

- Runs at the **very front** of the pipeline, before OCR.
- **Vision-only.** Must not depend on OCR text: a blurry Korean ID yields no keywords, and if that
  falls through to a general path it becomes an upload. **OCR failure must never become a leak.**
- **Asymmetric thresholds.** Claiming `safe` requires high confidence; blocking needs only
  suspicion. Below threshold → `blocked`, not `unknown`.
- Two-stage: pre-scan, then re-check at the upload gateway using different signals.

## Other required behaviors

- **EXIF stripping at one choke point** in the upload pipeline, with no bypass route. Location is
  kept only when an action needs it, and the ActionCard says so explicitly.
- **Never log image bytes or extracted field values.** No server request-body logging. Exclude
  payloads from crash reports. Scrub phone/email patterns from logs.
- **Third-party data (A-4):** no face identification or person search. Face detection is for tier
  judgment only, never identity. Extracted third-party info is stored only via a user-approved
  action.
- **Derived-data sensitivity:** some Tier 2 photos produce sensitive output. Parking photos are
  concrete pillars, but precise coordinates plus timestamps plus repetition equals a movement
  history. Keep derived location data local regardless of image tier.

## Confusion pairs to watch

Overall accuracy hides these. Track each pair separately.

| Pair | Risk |
|---|---|
| `payment_card` ↔ `business_card` | **Leak.** Nearly identical aspect ratio and layout |
| `id_document` ↔ `business_card` | **Leak.** Same |
| `receipt` ↔ `bill_invoice` | Opposite actions (past record vs. future obligation) |

Full register: `docs/MITIGATIONS.md`. Per-class detail: `docs/CLASSES.md`.
