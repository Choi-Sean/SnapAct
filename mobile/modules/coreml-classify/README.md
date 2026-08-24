# coreml-classify — on-device L1 vision classifier (Expo local module)

Runs the S3 spike's Core ML model (`L1Classifier.mlmodel`) **on-device** and returns
class probabilities to JS. The fail-closed BLOCK/ROUTE policy lives in
`src/layer0/visionGate.ts`; this module only scores.

**iOS only** (Core ML is Apple-only). Not available in Expo Go or via OTA — it needs a
real dev/EAS build.

## ⚠️ Not built/verified yet

These files were written without a compiler on hand (this machine has Command Line Tools,
not full Xcode). **Expect a possible fix cycle on the first build.** The TypeScript side
typechecks; the Swift/podspec side has not been compiled.

## Build & run

```bash
cd mobile
npx expo prebuild -p ios          # generates ios/, autolinks this local module + the model
# then either:
npx expo run:ios                  # local build to a simulator/device (needs full Xcode)
# or a device dev build via EAS:
eas build --profile development --platform ios
```

Open the resulting dev client on your phone (same LAN / via EAS install), then use the app's
normal Analyze flow.

## How to test it

Pick or shoot a photo and tap Analyze. `resolveAnalysis` runs the vision gate first:

- **Payment card / passport →** an alert *"Blocked on device … NOT uploaded"* and the request
  stops. Nothing goes to the server. This is the Tier 0 guarantee firing.
- **Business card / receipt / everyday photo →** the gate routes (logged to the JS console in
  `__DEV__`) and the existing OCR + backend flow continues as before.

Watch the Metro/console log for `[visionGate] route → …` lines to see the raw scores.

## Known limits (from the current model)

- Trained on a small real set: `business_card`, `passport`, `payment_card`, `receipt`, plus
  Places365 scenes as `other`. **`id_card` has no training data yet** — an ID may not be
  blocked. Add `id_card` photos and retrain (see `spikes/s3-l1-vision-classifier`).
- The blocking margin is thin (a credit card scored payment_card 0.155 vs the 0.15 threshold).
  Consider lowering `SUSPICION_THRESHOLD` in `visionGate.ts` for more safety headroom.
- Model auto-loads from the app bundle and compiles at runtime (cached). ~65 KB.

## Updating the model

Retrain in `spikes/s3-l1-vision-classifier` (`swift train.swift …`), then copy the new
artifact over `ios/L1Classifier.mlmodel` and rebuild.
