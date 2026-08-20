# CLAUDE.md — SnapAct

## What we're building

A mobile app that receives photos from the OS share sheet, figures out what the photo is, and
**completes the task the user was going to do by hand.**

Share a business card → a contact exists. Share a poster → a calendar event exists. Share a blood
pressure monitor's LCD → a HealthKit reading is logged.

The product is not photo recognition. Showing OCR output and stopping is a failure, not a feature.

**Status: Phase 0. No code exists.** Planning is well developed; several architectural assumptions
are still unverified — see `docs/SPIKES.md`. Codename `SnapAct` is provisional.

## Stack

| Layer | Choice |
|---|---|
| iOS | Swift / SwiftUI, Share Extension. Primary platform for M1 |
| Android | Kotlin, `ACTION_SEND`, ML Kit. Deferred to M4 |
| Backend (BFF) | Python / FastAPI — Claude API proxy, prompt + schema versioning |
| Inference | On-device first (Core ML, Foundation Models); Claude API only when required |
| Core logic | Duplicate natively per platform first. **Do not extract KMP yet** |

Language scope: **multilingual from the start** (KR/JP/CN/EN + EU). This drives much of the
architecture — see `.claude/rules/pipeline.md`.

---

## Non-negotiables

Violating any of these is a bug even if tests pass.

1. **Tier 0 photos never leave the device.** IDs, passports, payment cards, medical records,
   prescriptions, financial documents. Enforced by the type system, not by policy.
2. **Fail-closed.** Tier confidence below threshold means blocked. "Unsure" never means
   "probably fine."
3. **Every extracted field carries a source span.** A value with no grounding in the OCR text is
   rejected or marked unverified. An empty field beats a wrong field. Hallucinated values are more
   dangerous than misclassification because users don't notice them.
4. **Write actions require user confirmation.** Never silently create a contact, event, or
   reminder. Read-only actions may auto-run.
5. **No empty states.** Every photo yields at least save/copy/search. Never tell the user we
   couldn't identify their photo — that transfers our classifier's failure to them.
6. **Skip the expensive path when a cheap one works.** Barcode hits and blocked photos must not
   run OCR at all.
7. **Never log image bytes or extracted field values.** Not in app logs, not in server request
   bodies, not in crash reports.

Details: `.claude/rules/privacy.md` (tiers, type enforcement),
`.claude/rules/pipeline.md` (ladder, ordering, action composition).

---

## Current work

### Now: spike phase

Five architectural decisions rest on estimates, not measurements. Each spike is throwaway code
whose deliverable is a number. **Do not start M1 implementation until S1 and S3 report.** Full
definitions in `docs/SPIKES.md`.

| # | Question |
|---|---|
| S1 | OCR latency: resolution × recognition level × language count, on real hardware |
| S2 | OCR language support and `SystemLanguageModel.availability` per device/locale |
| S3 | `VNGenerateImageFeaturePrint` + lightweight head — accuracy on blocking classes |
| S4 | `DDMatch` signal coverage |
| S5 | Foundation Models in a Share Extension: works? memory? guardrail false positives? |

Spikes live in `spikes/`, are not production code, and each ends with findings in `docs/spikes/`.

### Next: M1

One vertical slice, iOS only: **share sheet → business card → contact.**

Must include, not defer: blocking gate with type enforcement · EXIF stripping at a single choke
point · source spans with a crop of the source region shown beside each field · universal +
signal-based actions (so `unknown` works day one) · own note store with undo · permission-denied
fallbacks (vCard export).

M1 is not done until the P0 checklist in `docs/MITIGATIONS.md` passes.

### Later

M2 Handler Registry generalization + more classes · M3 on-device optimization, eval CI ·
M4 Android · M5 multi-photo batch

---

## Conventions

- New photo type = implement `Handler` + register in manifest. **Never add
  `if category == .businessCard` to the pipeline.**
- All LLM calls use structured output (`@Generable` on-device, tool use for Claude API).
  **Never regex-parse a model's free-text response.**
- Prompts, schemas, and model identifiers live in `prompts/`, versioned. Not hardcoded.
- Platform APIs (Contacts, EventKit, HealthKit, network, storage) go behind adapters. Handlers
  never call them directly.
- Identifiers and comments in English. User-facing strings in localization files.
- Every new Handler ships with ≥10 golden samples in `evals/`, with language/region spread.
- Review question for any new feature: **"does this photo need to leave the device?"**

## Repo layout

```
apps/ios/  apps/android/  packages/core/  packages/handlers/
server/  prompts/  evals/  spikes/  docs/
```

## Docs

| File | Contents |
|---|---|
| `docs/SPIKES.md` | Spike definitions and findings index |
| `docs/MITIGATIONS.md` | 21 risks, P0/P1/P2, M1 pre-launch checklist |
| `docs/CLASSES.md` | Per-class detection method, discriminators, tiers, confusion pairs |
| `docs/ACTION_SURFACES.md` | 34 classes by iOS action surface; "does this class earn its keep" |
| `docs/APPLE_APIS.md` | Full framework catalog, dead ends, architectural implications |

Some of these were revised mid-planning and **may contradict each other or this file.** Say so
instead of coding around it.

## Don't decide these alone — raise them

- Whether to allow a per-class "trust mode" that skips confirmation
- Whether to learn from repeatedly corrected fields (personalization vs. predictability)
- Multi-photo shares: process individually or as one document?
- Which action to surface first when several are plausible
- Any change that widens what leaves the device