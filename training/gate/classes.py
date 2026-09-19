"""
Gate class contract — the single source of truth for class identity and order.

This module exists so that train / eval / export cannot disagree about the
output layout. The ORDER of `CLASSES` IS the interface handed to the app:
the exported model emits one sigmoid per class in exactly this order, and
Swift indexes into it positionally. Reordering this list silently breaks the
app even though every test still passes. Don't.

Spec (fixed, do not change without a spec change):
  - 5 classes, 4 blocking + `safe`
  - independent sigmoid per class, NOT softmax
  - asymmetric thresholds: blocking needs only suspicion, `safe` needs
    high confidence
"""

from typing import Final

# ---------------------------------------------------------------------------
# Output order — part of the app interface. See module docstring.
# ---------------------------------------------------------------------------
CLASSES: Final[tuple[str, ...]] = (
    "id_document",
    "payment_card",
    "medical_record",
    "financial_doc",
    "safe",
)

NUM_CLASSES: Final[int] = len(CLASSES)
CLASS_TO_INDEX: Final[dict[str, int]] = {name: i for i, name in enumerate(CLASSES)}

# The four Tier 0 classes. Matches docs/future-plan/rules/privacy.md's Tier 0
# row: passports fold into `id_document`, prescriptions into `medical_record`.
# (spikes/s3-l1-vision-classifier/CLASSES.md still lists the older 5-way split
# with `passport`/`prescription` separate — that file predates this spec.)
BLOCKING_CLASSES: Final[tuple[str, ...]] = CLASSES[:-1]
SAFE_CLASS: Final[str] = "safe"
SAFE_INDEX: Final[int] = CLASS_TO_INDEX[SAFE_CLASS]

# ---------------------------------------------------------------------------
# Asymmetric thresholds — the fail-closed policy, not a tuning knob.
# ---------------------------------------------------------------------------
# Any blocking class at or above this probability blocks, even if it is not
# the highest-scoring class. Low on purpose: blocking needs only suspicion.
BLOCK_THRESHOLD: Final[float] = 0.30

# `safe` must clear this to be treated as safe. High on purpose: claiming
# safe is the assertion that carries the leak risk.
SAFE_THRESHOLD: Final[float] = 0.90

# Both are defaults until the eval threshold sweep reports; export_coreml.py
# writes whatever the sweep chose into the interface doc handed to the app.


def decide(probs: "list[float] | tuple[float, ...]") -> str:
    """Fail-closed BLOCK/ALLOW policy over one row of sigmoid outputs.

    Mirrors what the app must do in Swift. Kept here so eval measures the
    policy that actually ships, not raw per-class metrics that hide it.

    Returns "blocked" or "allowed". There is deliberately no third outcome:
    per privacy.md, "below threshold -> blocked, not unknown".
    """
    if len(probs) != NUM_CLASSES:
        raise ValueError(f"expected {NUM_CLASSES} probabilities, got {len(probs)}")

    for name in BLOCKING_CLASSES:
        if probs[CLASS_TO_INDEX[name]] >= BLOCK_THRESHOLD:
            return "blocked"

    # Nothing tripped a blocking class, but `safe` still has to earn it.
    if probs[SAFE_INDEX] < SAFE_THRESHOLD:
        return "blocked"

    return "allowed"



# ---------------------------------------------------------------------------
# Labels — MULTI-LABEL. A photo may be positive for more than one blocking
# class (a hospital bill is genuinely both `medical_record` and
# `financial_doc`). Independent sigmoids already support this; the only extra
# rule is the one below.
# ---------------------------------------------------------------------------
MULTI_LABEL: Final[bool] = True


def labels_to_vector(blocking_names: "list[str] | tuple[str, ...]") -> tuple[float, ...]:
    """Build a multi-hot target from the blocking classes that apply.

    `safe` is DERIVED, never passed in: it is exactly "no blocking class
    applies". Passing it explicitly is rejected, because a label that says
    both `medical_record` and `safe` is a data-entry bug that would otherwise
    train the model to call a prescription safe.

    Note that `safe` being derivable in the LABEL does not make the output
    redundant: at inference time we need an independent confidence for `safe`
    to apply SAFE_THRESHOLD to, which a derived value could not provide.
    """
    vec = [0.0] * NUM_CLASSES
    seen: set[str] = set()

    for name in blocking_names:
        if name == SAFE_CLASS:
            raise ValueError(
                "`safe` is derived from the absence of blocking classes; "
                "do not pass it explicitly."
            )
        if name not in CLASS_TO_INDEX:
            raise ValueError(f"unknown class {name!r}; expected one of {BLOCKING_CLASSES}")
        if name in seen:
            raise ValueError(f"duplicate class {name!r}")
        seen.add(name)
        vec[CLASS_TO_INDEX[name]] = 1.0

    vec[SAFE_INDEX] = 0.0 if seen else 1.0
    return tuple(vec)


def should_block(target: "list[float] | tuple[float, ...]") -> bool:
    """Ground truth for the policy-level metric: does this image contain
    anything that must never be uploaded?"""
    return any(target[CLASS_TO_INDEX[n]] >= 0.5 for n in BLOCKING_CLASSES)

# ---------------------------------------------------------------------------
# Leak-risk confusion pairs tracked as named metrics, separately from overall
# accuracy. Source: docs/future-plan/rules/privacy.md ("Overall accuracy hides
# these. Track each pair separately.").
# ---------------------------------------------------------------------------
# (source directory in the safe set, blocking class it must not trip)
TRACKED_FALSE_POSITIVE_PAIRS: Final[tuple[tuple[str, str], ...]] = (
    ("business_card", "payment_card"),
    ("business_card", "id_document"),
)
