# S3 — L1 vision classifier (on-device, lightweight)

The L1 classifier is the **only model that is "ours"** — everything else in the ladder is an
OS/Apple framework (see `.claude/rules/pipeline.md`). It does two jobs in one ~30–50ms pass:

1. **Blocking gate** — catch Tier 0 (ID, passport, payment card, prescription, financial doc)
   so those photos never leave the device. Fail-closed. *Non-negotiable.*
2. **Router** — for safe photos, pick a category to hint OCR and select a Handler.

This spike answers S3: **can a lightweight head on Apple's Vision feature extractor separate the
blocking classes accurately enough?** The deliverable is a number — specifically *blocking recall*.

## Approach (and why)

Create ML's image classifier = **transfer learning on Vision's `scenePrint` feature extractor
+ a small logistic head**. This is exactly the S3 hypothesis. Consequences:

- Trains on ~20 images/class in seconds, not thousands over months.
- Exported model is **~145 KB** — it's just the head; the feature extractor is OS-provided.
- Runs on-device with no network. Measured **~2.5 ms** inference on this Mac (iPhone Neural
  Engine will differ, but the head is negligible; scene-print dominates and is ANE-optimized).

Chosen over a portable TFLite/MobileNet because (a) it *is* the documented S3 method, (b) it needs
far less data, and (c) the Python ML toolchain isn't installed here while Swift/Create ML is. The
`.mlmodel` output plugs into a native Share Extension **or** the Expo app via a Core ML native
module — that integration choice is independent of this model.

## Files

| File | Purpose |
|---|---|
| `CLASSES.md` | Class taxonomy: blocking vs routing, tiers, confusion pairs |
| `generate_placeholders.swift` | Makes synthetic stand-in images so the pipeline runs today |
| `train.swift` | Trains, evaluates (confusion matrix + **blocking recall**), exports `L1Classifier.mlmodel` |
| `L1Gate.swift` | Fail-closed BLOCK/ROUTE policy layer + a safety check over the test set |

## Run it

```bash
cd spikes/s3-l1-vision-classifier
swift generate_placeholders.swift data/train 24    # synthetic training images
swift generate_placeholders.swift data/test  8     # synthetic test images
swift train.swift                                  # -> L1Classifier.mlmodel + numbers
swift L1Gate.swift                                 # -> fail-closed gate + "0 leaks" check
```

## ⚠️ The 100% is a smoke test, not a result

The placeholders are geometric shapes — trivially separable, so train/gate both hit 100%. That
proves **the harness works end-to-end**, nothing about real accuracy. The real S3 number comes
only when you replace `data/` with **real photos**:

```
data/train/<class>/*.jpg      # ~20+ real photos per class, language/region spread
data/test/<class>/*.jpg       # held-out, never seen in training
```

Class folder names must match `CLASSES.md`. Then re-run `train.swift` — the number to report is
**BLOCKING RECALL** (and the LEAKS list must be empty). A passport landing in `document` is the
only failure that matters; a wrongly-blocked business card is just a re-share.

## The gate is where the guarantee lives

The model only produces probabilities. `L1Gate.swift` makes the Tier 0 promise real, fail-closed:

- top class is a blocking class → **BLOCK**
- *any* blocking class scores > `suspicionThreshold` (0.15), even if not top → **BLOCK**
- top routing confidence below its per-class threshold → route as **`unknown`** (the primary
  path per pipeline.md), never a low-confidence guess

So "unsure whether this is an ID" resolves to BLOCK, not "probably a business card."

## Next steps (post-meeting)

1. **Real photos** — this is the blocker for a real number. Prioritize the confusion pairs.
2. **Calibration** — with real data, tune `suspicionThreshold` for the recall/false-block trade
   (bias hard toward recall on Tier 0).
3. **Integration** — decide native Share Extension vs Expo Core ML module (the separate debate);
   the `.mlmodel` is ready for either.
4. **On-device latency** — re-measure on a real iPhone to confirm the 30–50ms L1 budget holds.
