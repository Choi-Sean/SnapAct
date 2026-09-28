"""Metrics. Recall first, everywhere.

Three layers of number, in increasing order of what actually matters:

  1. Per-class binary metrics (recall/precision/confusion per sigmoid output)
  2. Tracked leak pairs, reported on their own lines and never averaged in
  3. POLICY metrics — run gate.classes.decide() over the whole set and count
     how many Tier 0 photos would have been uploaded. This is the number the
     spec cares about; per-class recall can look fine while the combined
     block/safe thresholds still leak.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from .classes import (
    BLOCKING_CLASSES,
    CLASS_TO_INDEX,
    CLASSES,
    SAFE_INDEX,
    TRACKED_FALSE_POSITIVE_PAIRS,
)


def _safe_div(num: float, den: float) -> float:
    return float(num) / float(den) if den else float("nan")


@dataclass
class ClassMetrics:
    name: str
    threshold: float
    tp: int
    fp: int
    fn: int
    tn: int

    @property
    def support(self) -> int:
        return self.tp + self.fn

    @property
    def recall(self) -> float:
        return _safe_div(self.tp, self.tp + self.fn)

    @property
    def precision(self) -> float:
        return _safe_div(self.tp, self.tp + self.fp)

    @property
    def f1(self) -> float:
        p, r = self.precision, self.recall
        return _safe_div(2 * p * r, p + r) if p == p and r == r and (p + r) else float("nan")


@dataclass
class PolicyMetrics:
    """gate.classes.decide() applied to every row."""

    block_threshold: float
    safe_threshold: float
    n_total: int
    n_should_block: int
    n_safe: int
    leaks: int = 0            # should block, was allowed  <- the failure that matters
    false_blocks: int = 0     # should allow, was blocked   <- one extra re-share
    leak_paths: list[str] = field(default_factory=list)

    @property
    def block_recall(self) -> float:
        return _safe_div(self.n_should_block - self.leaks, self.n_should_block)

    @property
    def false_block_rate(self) -> float:
        return _safe_div(self.false_blocks, self.n_safe)


@dataclass
class TrackedPair:
    source: str
    blocking_class: str
    n_source: int
    n_tripped: int

    @property
    def rate(self) -> float:
        return _safe_div(self.n_tripped, self.n_source)


def per_class_metrics(
    targets: np.ndarray, probs: np.ndarray, block_threshold: float, safe_threshold: float
) -> list[ClassMetrics]:
    out: list[ClassMetrics] = []
    for name in CLASSES:
        i = CLASS_TO_INDEX[name]
        thr = safe_threshold if i == SAFE_INDEX else block_threshold
        pred = probs[:, i] >= thr
        truth = targets[:, i] >= 0.5
        out.append(
            ClassMetrics(
                name=name,
                threshold=thr,
                tp=int(np.sum(pred & truth)),
                fp=int(np.sum(pred & ~truth)),
                fn=int(np.sum(~pred & truth)),
                tn=int(np.sum(~pred & ~truth)),
            )
        )
    return out


def policy_metrics(
    targets: np.ndarray,
    probs: np.ndarray,
    block_threshold: float,
    safe_threshold: float,
    paths: list[str] | None = None,
) -> PolicyMetrics:
    blocking_idx = [CLASS_TO_INDEX[n] for n in BLOCKING_CLASSES]

    truth_block = targets[:, blocking_idx].max(axis=1) >= 0.5
    # Mirrors gate.classes.decide(), vectorised.
    tripped = (probs[:, blocking_idx] >= block_threshold).any(axis=1)
    unconvincing_safe = probs[:, SAFE_INDEX] < safe_threshold
    pred_block = tripped | unconvincing_safe

    leak_mask = truth_block & ~pred_block
    m = PolicyMetrics(
        block_threshold=block_threshold,
        safe_threshold=safe_threshold,
        n_total=int(targets.shape[0]),
        n_should_block=int(truth_block.sum()),
        n_safe=int((~truth_block).sum()),
        leaks=int(leak_mask.sum()),
        false_blocks=int((~truth_block & pred_block).sum()),
    )
    if paths is not None:
        m.leak_paths = [paths[i] for i in np.flatnonzero(leak_mask)]
    return m


def tracked_pairs(
    probs: np.ndarray, sources: list[str], block_threshold: float
) -> list[TrackedPair]:
    src = np.asarray(sources)
    out: list[TrackedPair] = []
    for source, blocking_class in TRACKED_FALSE_POSITIVE_PAIRS:
        mask = src == source
        col = probs[mask, CLASS_TO_INDEX[blocking_class]]
        out.append(
            TrackedPair(
                source=source,
                blocking_class=blocking_class,
                n_source=int(mask.sum()),
                n_tripped=int((col >= block_threshold).sum()),
            )
        )
    return out


def threshold_sweep(
    targets: np.ndarray,
    probs: np.ndarray,
    sources: list[str],
    safe_threshold: float,
    start: float = 0.10,
    stop: float = 0.90,
    step: float = 0.05,
) -> list[dict]:
    """Block threshold vs. recall/precision, plus the policy-level leak count."""
    rows: list[dict] = []
    n = int(round((stop - start) / step)) + 1
    for thr in (round(start + i * step, 4) for i in range(n)):
        pol = policy_metrics(targets, probs, thr, safe_threshold)
        row = {
            "block_threshold": thr,
            "safe_threshold": safe_threshold,
            "policy_leaks": pol.leaks,
            "policy_block_recall": pol.block_recall,
            "policy_false_blocks": pol.false_blocks,
            "policy_false_block_rate": pol.false_block_rate,
        }
        for cm in per_class_metrics(targets, probs, thr, safe_threshold):
            if cm.name in BLOCKING_CLASSES:
                row[f"recall__{cm.name}"] = cm.recall
                row[f"precision__{cm.name}"] = cm.precision
        for tp in tracked_pairs(probs, sources, thr):
            row[f"fp__{tp.source}__to__{tp.blocking_class}"] = tp.rate
        rows.append(row)
    return rows


def threshold_grid(
    targets: np.ndarray,
    probs: np.ndarray,
    sources: list[str],
    block_start: float = 0.10,
    block_stop: float = 0.90,
    block_step: float = 0.05,
    safe_start: float = 0.50,
    safe_stop: float = 0.95,
    safe_step: float = 0.05,
) -> list[dict]:
    """2D sweep over BOTH thresholds.

    The 1D block sweep is misleading on its own: decide() blocks when a
    blocking class trips *or* when `safe` fails to clear its own threshold, so
    the safe threshold can dominate the leak count entirely and hide whatever
    the block threshold is doing. Choosing a recommended operating point needs
    both axes.
    """
    rows: list[dict] = []
    n_block = int(round((block_stop - block_start) / block_step)) + 1
    n_safe = int(round((safe_stop - safe_start) / safe_step)) + 1

    for i in range(n_block):
        b = round(block_start + i * block_step, 4)
        for j in range(n_safe):
            s = round(safe_start + j * safe_step, 4)
            pol = policy_metrics(targets, probs, b, s)
            row = {
                "block_threshold": b,
                "safe_threshold": s,
                "leaks": pol.leaks,
                "block_recall": pol.block_recall,
                "false_blocks": pol.false_blocks,
                "false_block_rate": pol.false_block_rate,
            }
            for tp in tracked_pairs(probs, sources, b):
                row[f"fp__{tp.source}__to__{tp.blocking_class}"] = tp.rate
            rows.append(row)
    return rows


def recommend_operating_point(rows: list[dict]) -> tuple[dict | None, str]:
    """Pick a recommended (block, safe) pair from a 2D sweep.

    Fail-closed bias, in this order:
      1. Only cells with ZERO leaks are eligible. Not "few leaks" — a leaked
         passport is unrecoverable, so this is a hard filter, not a weight.
      2. Among those, fewest false blocks (each one is a re-share, nothing more).
      3. Tie-break toward the LOWER block threshold and the HIGHER safe
         threshold, i.e. toward more suspicion, since the eval set is finite
         and the next unseen photo is the one we are actually protecting.

    Returns (row, note). row is None when nothing is leak-free.
    """
    clean = [r for r in rows if r["leaks"] == 0]
    if not clean:
        best = max(rows, key=lambda r: (r["block_recall"], -r["false_block_rate"]))
        return None, (
            f"유출 0인 조합이 없습니다. 최선은 차단 {best['block_threshold']:.2f} / "
            f"safe {best['safe_threshold']:.2f} 에서 유출 {best['leaks']}건 "
            f"(차단 재현율 {best['block_recall']:.3f}). 임계값이 아니라 데이터 문제입니다."
        )

    best = min(
        clean,
        key=lambda r: (r["false_blocks"], r["block_threshold"], -r["safe_threshold"]),
    )
    return best, (
        f"유출 0 조합 {len(clean)}개 중 과차단 최소 지점. "
        f"과차단 {best['false_blocks']}건 (비율 {best['false_block_rate']:.3f})."
    )
