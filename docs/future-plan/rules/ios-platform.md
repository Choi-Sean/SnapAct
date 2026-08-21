---
paths:
  - "apps/ios/**"
---

# iOS platform constraints

These already cost design rework. Don't rediscover them.

## Dead ends

| Want | Reality | Do instead |
|---|---|---|
| Write to Apple Notes | **No public API.** Apple DTS confirmed: "No." | Own SwiftData store + share-sheet export |
| Add to Wallet | Needs a signed `.pkpass` | Calendar event + keep barcode image |
| Write HealthKit medications | iOS 26 API is read-oriented | `EKReminder` |
| Write to Maps "saved places" | Not available | Own store + `MKMapItem.openMaps` |
| Auto-send mail/SMS | Not available | Prefill draft, user sends |
| Scan whole photo library | App Review risk | **Process only shared items** |
| `.fast` OCR for CJK | Not supported — CJK is `.accurate` only | `.accurate`, with ROI and language hints to claw back time |
| Full-res decode in Share Extension | Hits the memory cap and **dies silently** | `CGImageSourceCreateThumbnailAtIndex` |

Also: `VNImageRequestHandler.perform(_:)` is **synchronous** — never call it on the main queue.

## Free wins that are easy to miss

- **`DataDetection` (`DDMatch`)** already finds dates, addresses, phone numbers, flight numbers.
  Check its coverage before writing regex.
- **`VNGenerateImageFeaturePrintRequest`** gives image embeddings for free. Likely enough to train
  a lightweight classifier head instead of a model from scratch — this is what S3 tests.
- **`RecognizeDocumentsRequest`** (iOS 26) preserves table structure. Relevant to
  `schedule_table`, `receipt`, `nutrition_label`.
- **`EKReminder` supports location triggers** via `EKStructuredLocation`. Underused; it's the main
  surface for "remind me later" since Notes and Wallet are closed.
- **`CoreSpotlight`** indexes our own note store, so Spotlight search still finds it. This closes
  the main gap left by having no Notes integration.
- **`CoreMotion` (`CMMotionActivityManager`)** — a drive-to-stop transition is a stronger parking
  signal than any pixel classifier.

## Never trust docs on language support

Apple's own WWDC video was wrong about Swedish; an Apple engineer confirmed the video was incorrect.
Query at runtime and disable handlers accordingly:

- `VNRecognizeTextRequest.supportedRecognitionLanguages(for:revision:)`
- `SystemLanguageModel.availability`
- `SystemLanguageModel.contextSize` and `tokenCount(for:)` — never hardcode limits

Note that Vision OCR's supported languages and Apple Intelligence's supported languages are
**different sets**. Reachable ladder tiers therefore vary by language:

```
OCR ✅ + on-device LLM ✅  → fully on-device, including Tier 0
OCR ✅ + on-device LLM ❌  → Tier 0 gets rules only; Tier 1 may use L5c
OCR ❌                     → disable the handler, fall back to universal actions
```

## Permission-denied fallbacks (required, not optional)

The app must stay useful when permissions are refused.

| Action | With permission | Without |
|---|---|---|
| Contact | `CNSaveRequest` | **vCard (.vcf) → share sheet** |
| Event | `EKEvent` | **ICS file → share sheet** |
| Reminder | `EKReminder` | Own store + local notification |
| Health | `HKQuantitySample` | Own store + CSV export |

Full catalog: `docs/APPLE_APIS.md`.
