# L1 classifier — class taxonomy

The L1 vision classifier does two jobs in one forward pass (~30–50ms on-device):

1. **Blocking gate** — is this a Tier 0 (sensitive) photo that must never leave the device?
2. **Router** — if safe, which category, so we can hint OCR and pick a Handler?

The class list below is what the model predicts. The *policy* that turns predictions into
BLOCK / ROUTE decisions lives in `L1Gate.swift` and is **fail-closed** (see CLAUDE.md
non-negotiable #2): uncertainty near a blocking class means BLOCK, never "probably fine."

## Blocking classes (Tier 0 — must be caught, fail-closed)

| Class            | Why blocked                        | Nearest confusion |
|------------------|------------------------------------|-------------------|
| `id_card`        | National ID / driver's license     | `business_card`   |
| `passport`       | Passport photo/data page           | `document`        |
| `payment_card`   | Credit/debit card                  | `business_card`   |
| `prescription`   | Rx / medical record                | `document`, `medication` |
| `financial_doc`  | Bank statement, tax form           | `document`        |

The number S3 must report is **recall on these classes** — a passport slipping through as
`document` is the failure that matters. Precision here is secondary (a wrongly-blocked business
card just means the user re-shares; a leaked passport is unrecoverable).

## Routing classes (safe to process; match today's app categories)

| Class          | Routes to                        |
|----------------|----------------------------------|
| `business_card`| Contact                          |
| `receipt`      | Note / expense                   |
| `event_flyer`  | Calendar event                   |
| `document`     | Note / text extract              |
| `medication`   | Medication reminder              |

`other` is not a trained class — it is the router's low-confidence fallback (see the gate).
Per pipeline.md, `unknown`/`other` is the **primary path**, so a low-confidence route is a
normal outcome, not an error.

## Confusion pairs to watch (from docs/CLASSES.md)

- `business_card` ↔ `id_card` — both are cards with a face/logo + text lines.
- `payment_card` ↔ `business_card` — card-shaped, horizontal.
- `prescription` ↔ `document` / `medication` — text-dense forms.

The placeholder generator deliberately makes these pairs *visually similar* so the smoke-test
accuracy is not falsely optimistic. Real photos will be harder still.
