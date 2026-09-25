#!/usr/bin/env python3
"""Evaluate a gate checkpoint against the REAL-PHOTO validation set.

Written before train_gate.py on purpose: the training loop's early-stopping
criterion is a metric defined here (positive recall), so this is the upstream
dependency, not a reporting afterthought.

Usage:
    python eval_gate.py --checkpoint runs/best.pt --data data/real/val
    python eval_gate.py --checkpoint runs/fixture.pt --data data/fixture/val --out runs/eval_fixture
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import numpy as np
import torch
import yaml
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parent))

from gate.classes import BLOCK_THRESHOLD, BLOCKING_CLASSES, SAFE_THRESHOLD
from gate.data import GateDataset
from gate.metrics import (
    per_class_metrics,
    policy_metrics,
    recommend_operating_point,
    threshold_grid,
    threshold_sweep,
    tracked_pairs,
)
from gate.model import load_checkpoint, resolve_device
from gate.transforms import build_transform

RULE = "=" * 78


def _fmt(x: float, width: int = 7) -> str:
    return f"{'--':>{width}}" if x != x else f"{x:>{width}.3f}"


def _print_header(text: str) -> None:
    print(f"\n{RULE}\n {text}\n{RULE}")


@torch.no_grad()
def predict(model, loader, device) -> tuple[np.ndarray, np.ndarray]:
    targets, probs = [], []
    for images, target, _ in loader:
        logits = model(images.to(device))
        probs.append(torch.sigmoid(logits).cpu().numpy())
        targets.append(target.numpy())
    return np.concatenate(targets), np.concatenate(probs)


def report(targets, probs, sources, paths, block_thr, safe_thr, out_dir: Path | None,
           sweep_cfg: dict | None = None):
    # --- 1. policy: the headline number -------------------------------------
    pol = policy_metrics(targets, probs, block_thr, safe_thr, paths)
    _print_header(f"정책 판정 (차단 {block_thr:.2f} / safe {safe_thr:.2f})")
    print(f"  전체 {pol.n_total}장  |  차단 대상 {pol.n_should_block}장  |  safe {pol.n_safe}장")
    print(f"  차단 재현율        {_fmt(pol.block_recall)}   <- 최우선 지표")
    verdict = "OK" if pol.leaks == 0 else "!! 유출 !!"
    print(f"  유출 (차단실패)    {pol.leaks:>7d}   {verdict}")
    print(f"  과차단             {pol.false_blocks:>7d}   (비율 {_fmt(pol.false_block_rate)}) — 감수 가능")
    for p in pol.leak_paths[:10]:
        print(f"      유출: {p}")
    if len(pol.leak_paths) > 10:
        print(f"      ... 외 {len(pol.leak_paths) - 10}건")

    # --- 2. per-class -------------------------------------------------------
    cms = per_class_metrics(targets, probs, block_thr, safe_thr)
    _print_header("클래스별 (재현율 우선)")
    print(f"  {'class':<16}{'thr':>6}{'recall':>9}{'prec':>9}{'support':>9}"
          f"{'TP':>6}{'FP':>6}{'FN':>6}{'TN':>6}")
    for cm in cms:
        print(f"  {cm.name:<16}{cm.threshold:>6.2f}{_fmt(cm.recall,9)}{_fmt(cm.precision,9)}"
              f"{cm.support:>9}{cm.tp:>6}{cm.fp:>6}{cm.fn:>6}{cm.tn:>6}")

    blocking_recalls = [cm.recall for cm in cms if cm.name in BLOCKING_CLASSES]
    finite = [r for r in blocking_recalls if r == r]
    print(f"\n  min_blocking_recall = {_fmt(min(finite)) if finite else '   --'}"
          "   <- 조기 종료 / 체크포인트 선택 기준")

    # --- 3. tracked leak pairs, never averaged in ---------------------------
    _print_header("추적 오탐 쌍 (privacy.md 'Leak' 등급)")
    for tp in tracked_pairs(probs, sources, block_thr):
        note = "  (해당 출처 이미지 없음)" if tp.n_source == 0 else ""
        print(f"  {tp.source:>14} -> {tp.blocking_class:<16}"
              f"{_fmt(tp.rate)}  ({tp.n_tripped}/{tp.n_source}){note}")

    # --- 4. sweep -----------------------------------------------------------
    rows = threshold_sweep(targets, probs, sources, safe_thr)
    _print_header("임계값 스윕 (차단 임계값 0.10 ~ 0.90)")
    print(f"  {'thr':>5}{'leaks':>7}{'blk_rec':>9}{'f_block':>9}"
          + "".join(f"{c[:11]:>12}" for c in BLOCKING_CLASSES))
    print(f"  {'':>5}{'':>7}{'':>9}{'':>9}" + "".join(f"{'recall':>12}" for _ in BLOCKING_CLASSES))
    for r in rows:
        print(f"  {r['block_threshold']:>5.2f}{r['policy_leaks']:>7d}"
              f"{_fmt(r['policy_block_recall'],9)}{r['policy_false_blocks']:>9d}"
              + "".join(_fmt(r[f'recall__{c}'], 12) for c in BLOCKING_CLASSES))

    # --- 5. 2D sweep: both thresholds, because decide() uses both ----------
    sweep_cfg = sweep_cfg or {}
    b_cfg = sweep_cfg.get("block_threshold", {})
    s_cfg = sweep_cfg.get("safe_threshold", {})
    grid = threshold_grid(
        targets, probs, sources,
        block_start=b_cfg.get("start", 0.10), block_stop=b_cfg.get("stop", 0.90),
        block_step=b_cfg.get("step", 0.05),
        safe_start=s_cfg.get("start", 0.50), safe_stop=s_cfg.get("stop", 0.95),
        safe_step=s_cfg.get("step", 0.05),
    )
    safe_axis = sorted({r["safe_threshold"] for r in grid})
    block_axis = sorted({r["block_threshold"] for r in grid})
    by_key = {(r["block_threshold"], r["safe_threshold"]): r for r in grid}

    _print_header("2D 스윕 — 유출 건수 (행=차단 임계값, 열=safe 임계값)")
    print("   차단\\safe" + "".join(f"{s:>6.2f}" for s in safe_axis))
    for b in block_axis:
        cells = "".join(f"{by_key[(b, s)]['leaks']:>6d}" for s in safe_axis)
        print(f"   {b:>8.2f}{cells}")

    _print_header("2D 스윕 — 과차단 비율 (같은 축)")
    print("   차단\\safe" + "".join(f"{s:>6.2f}" for s in safe_axis))
    for b in block_axis:
        cells = "".join(f"{by_key[(b, s)]['false_block_rate']:>6.2f}" for s in safe_axis)
        print(f"   {b:>8.2f}{cells}")

    rec, note = recommend_operating_point(grid)
    _print_header("권장 동작점")
    if rec is None:
        print(f"  {note}")
    else:
        print(f"  차단 임계값  {rec['block_threshold']:.2f}")
        print(f"  safe 임계값  {rec['safe_threshold']:.2f}")
        print(f"  유출 0 / 차단 재현율 {rec['block_recall']:.3f} / 과차단 {rec['false_blocks']}건")
        print(f"  {note}")
        print("  (선정 규칙: 유출 0 은 가중치가 아니라 하드 필터. 그 안에서 과차단 최소,")
        print("   동률이면 더 의심하는 쪽 — 낮은 차단 임계값 / 높은 safe 임계값)")

    if out_dir is None:
        return pol

    out_dir.mkdir(parents=True, exist_ok=True)
    with (out_dir / "per_class.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["class", "threshold", "recall", "precision", "f1", "support", "tp", "fp", "fn", "tn"])
        for cm in cms:
            w.writerow([cm.name, cm.threshold, cm.recall, cm.precision, cm.f1,
                        cm.support, cm.tp, cm.fp, cm.fn, cm.tn])

    with (out_dir / "tracked_pairs.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["source", "blocking_class", "n_source", "n_tripped", "false_positive_rate"])
        for tp in tracked_pairs(probs, sources, block_thr):
            w.writerow([tp.source, tp.blocking_class, tp.n_source, tp.n_tripped, tp.rate])

    with (out_dir / "sweep.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    with (out_dir / "sweep_2d.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(grid[0].keys()))
        w.writeheader()
        w.writerows(grid)

    with (out_dir / "policy.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["block_threshold", "safe_threshold", "n_total", "n_should_block",
                    "n_safe", "leaks", "block_recall", "false_blocks", "false_block_rate"])
        w.writerow([pol.block_threshold, pol.safe_threshold, pol.n_total, pol.n_should_block,
                    pol.n_safe, pol.leaks, pol.block_recall, pol.false_blocks, pol.false_block_rate])

    print(f"\n  CSV 저장: {out_dir}/  (per_class, tracked_pairs, sweep, sweep_2d, policy)")
    return pol


def main() -> int:
    ap = argparse.ArgumentParser(description="게이트 모델 평가 (검증셋은 실촬영만)")
    ap.add_argument("--checkpoint", required=True, type=Path)
    ap.add_argument("--data", required=True, type=Path, help="검증 디렉터리")
    ap.add_argument("--config", type=Path, default=Path("configs/gate_mobilenetv3_small.yaml"))
    ap.add_argument("--out", type=Path, default=None, help="CSV 출력 디렉터리")
    ap.add_argument("--block-threshold", type=float, default=None)
    ap.add_argument("--safe-threshold", type=float, default=None)
    ap.add_argument("--batch-size", type=int, default=32)
    ap.add_argument("--device", default="auto")
    ap.add_argument("--allow-synthetic", action="store_true",
                    help="검증에 합성 허용. 스모크 테스트 외에는 쓰지 마세요.")
    args = ap.parse_args()

    cfg = yaml.safe_load(args.config.read_text()) if args.config.is_file() else {}
    data_cfg = cfg.get("data", {})
    model_cfg = cfg.get("model", {})
    eval_cfg = cfg.get("eval", {})

    block_thr = args.block_threshold or eval_cfg.get("block_threshold", BLOCK_THRESHOLD)
    safe_thr = args.safe_threshold or eval_cfg.get("safe_threshold", SAFE_THRESHOLD)

    device = resolve_device(args.device)
    model, meta = load_checkpoint(args.checkpoint, device, model_cfg.get("dropout", 0.2))

    if meta.get("smoke"):
        print("\n" + "!" * 78)
        print(" 스모크용 체크포인트입니다 (학습되지 않은 무작위 가중치).")
        print(" 아래 수치는 배관 검증용이며 정확도에 대해 아무것도 말해주지 않습니다.")
        print("!" * 78)

    transform = build_transform(
        model_cfg.get("input_size", 224),
        resize_mode=data_cfg.get("resize_mode", "letterbox"),
        train=False,
    )
    dataset = GateDataset(args.data, transform, allow_synthetic=args.allow_synthetic)
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    print(f"\n검증셋: {args.data}  ({len(dataset)}장, device={device})")
    targets, probs = predict(model, loader, device)
    paths = [str(p) for p in dataset.paths()]

    pol = report(targets, probs, dataset.sources(), paths, block_thr, safe_thr, args.out,
                 sweep_cfg=eval_cfg.get("sweep", {}))
    print()
    return 1 if pol.leaks else 0


if __name__ == "__main__":
    raise SystemExit(main())
