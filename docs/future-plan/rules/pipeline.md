# Pipeline, cost ladder, action composition

No `paths:` — this loads every session. It's the shared vocabulary for everything else.

## Escalation ladder

Always resolve at the lowest tier that works.

| Tier | What | Latency | Ours? |
|---|---|---|---|
| L0 | Barcode, EXIF, CoreMotion, `DataDetection` | ~10ms | ❌ OS |
| L1 | Vision classifier (routing + blocking gate) | 30–50ms | ✅ **our model starts here** |
| L2 | OCR (`VNRecognizeText`, `RecognizeDocumentsRequest`) | 300ms–2s | ❌ Apple |
| L3 | Rule-based extraction (regex, field-label dictionary) | ~5ms | ❌ |
| L4 | Field-labeling model (`NLTagger` or custom) | 20–50ms | ✅ M2+ |
| L5a | On-device LLM (Foundation Models, ~3B) | free, offline | ❌ Apple |
| L5b | Private Cloud Compute (32K ctx) | free for small apps | ❌ Apple |
| L5c | Claude API | costs money + network | ❌ |

**L5a is Tier-0-safe.** On-device inference never leaves the device, so Tier 0 classes can use an
LLM. This was not true before iOS 26 and older planning docs assume otherwise — if you see a doc
claiming Tier 0 can't use an LLM, that's stale.

L5c is for Tier 1/2 only, and only when L5a/L5b are unavailable or insufficient.

## Ordering

Order matters more than model count. **VIS classification runs before OCR** because multilingual
`.accurate` OCR costs seconds, and because blocking must not depend on OCR succeeding.

```
1. Barcode / EXIF                   → hit? done, no OCR
2. Blocking gate (VIS only)         → blocked? done, no OCR, no upload
3. Router (VIS + available signals) → category + confidence
4. Render ActionCard skeleton       → perceived latency ends here
5. OCR (.accurate, hinted by category: languages, ROI, minimumTextHeight)
6. Extraction (L3 → L4 → L5)        → fill card fields progressively
```

Steps 2–3 must not depend on step 5.

Routing order is language-dependent — text-first works for Latin-only, vision-first is required for
CJK. Put it behind a `RoutingStrategy` protocol so it's swappable, not hardcoded. S1's latency
numbers decide the default.

Budget: share → action proposal in **under 3s at p90**. Any design that breaks this needs a stated
reason.

## Action composition

Handlers are **not** the source of actions. They upgrade actions that already exist.

```
universal actions (always)          ─┐
signal-based actions (if signal)    ─┼→ merge → dedupe → rank → ActionCard
Handler enrichment (if classified)  ─┘
```

```swift
func propose(_ analysis: Analysis, _ signals: SignalSet, _ ctx: Context) -> [Action] {
    var actions = universalActions(analysis)
    actions += signalActions(signals, ctx)

    if let h = handlers[analysis.category],
       analysis.confidence > proposalThreshold[analysis.category] {
        actions = h.enrich(actions, analysis)   // upgrade, never replace
    }
    return rank(dedupe(actions))
}
```

Consequence: **partial failure degrades gracefully.** If business-card extraction gets only the
email, the user still sees a contact card with one field filled plus a save action.

`unknown` is the **primary path, not a fallback** — expect 60%+ of real traffic. Signal→action
mapping covers far more ground than class→action mapping. Signals: date, phone, email, URL,
address, money, recent-automotive, short-alphanumeric, dense-text, foreign-language, handwriting.

Check `DataDetection` (`DDMatch`) coverage before writing any signal extractor by hand — S4.

## Thresholds

A function of false-positive cost, not a global constant.

```swift
let proposalThreshold: [Category: Double] = [
    .paymentCard:   .nan,   // fail-closed; no threshold concept applies
    .businessCard:  0.75,
    .receipt:       0.65,
    .parkingHint:   0.25,   // a wrong guess costs one ignored button
]
```

## Confirmation levels

Confirmation fatigue is solved by **undo**, not by removing confirmations.

| Risk | Examples | Handling |
|---|---|---|
| Read-only | Text extract, search, link preview | Auto-run |
| Reversible local write | Contact, event, reminder | One-tap confirm + undo after |
| External send / payment | Message send, third-party write | Full content shown, explicit confirm |
| Tier 0 | — | No automation |
