#!/usr/bin/env python3
"""Build a throwaway fixture dataset + an untrained checkpoint.

Point: let the eval pipeline be RUN and its report shape inspected before any
real photo exists. It validates plumbing — directory scan, multi-label
manifest, the synthetic guard, metric wiring, CSV output — and says nothing
whatsoever about accuracy.

    python tools/make_fixture.py
    python eval_gate.py --checkpoint runs/fixture.pt --data data/fixture/val --out runs/eval_fixture

Images are crude colour/stripe patterns rather than noise, so the same
fixture can double as an overfit sanity check in session 2 (a model that
cannot memorise 5 solid colours has a bug unrelated to data).
"""

from __future__ import annotations

import argparse
import csv
import random
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from gate.classes import BLOCKING_CLASSES  # noqa: E402
from gate.data import SYNTHETIC_MARKER  # noqa: E402
from gate.model import build_model, save_checkpoint  # noqa: E402

# Distinguishable-by-construction so the fixture is also usable as an
# overfit check. (r, g, b, aspect) — aspect exercises the letterbox path.
PALETTE = {
    "id_document":    ((210, 180, 140), 1.58),
    "payment_card":   ((70, 110, 200), 1.58),   # same aspect as a business card, on purpose
    "medical_record": ((240, 240, 230), 0.71),
    "financial_doc":  ((200, 225, 200), 0.71),
    "business_card":  ((250, 250, 250), 1.75),  # safe, and the leak-risk source
    "receipt":        ((252, 252, 248), 0.35),
    "scene":          ((120, 160, 120), 1.33),
}


def draw(kind: str, seed: int, size: int = 320) -> Image.Image:
    rng = random.Random(seed)
    colour, aspect = PALETTE[kind]
    w = size
    h = max(32, int(size / aspect))
    img = Image.new("RGB", (w, h), colour)
    d = ImageDraw.Draw(img)
    for i in range(rng.randint(3, 7)):
        y = rng.randint(0, max(1, h - 8))
        d.rectangle([int(w * 0.08), y, int(w * rng.uniform(0.4, 0.92)), y + rng.randint(3, 8)],
                    fill=tuple(max(0, c - rng.randint(40, 110)) for c in colour))
    return img


def write_split(root: Path, n_per_class: int, seed_base: int) -> list[tuple[str, str, str]]:
    """Returns manifest rows (path, labels, source) for the multi-label cases."""
    rows: list[tuple[str, str, str]] = []

    for cls in BLOCKING_CLASSES:
        d = root / cls
        d.mkdir(parents=True, exist_ok=True)
        for i in range(n_per_class):
            draw(cls, seed_base + hash(cls) % 1000 + i).save(d / f"{cls}_{i:03d}.png")

    for tag in ("business_card", "receipt", "scene"):
        d = root / "safe" / tag
        d.mkdir(parents=True, exist_ok=True)
        for i in range(n_per_class):
            draw(tag, seed_base + hash(tag) % 1000 + i).save(d / f"{tag}_{i:03d}.png")

    # Multi-label: a hospital bill is genuinely medical_record AND financial_doc.
    # Filed under medical_record/, upgraded by the manifest — exactly the case
    # a directory layout cannot express.
    for i in range(max(2, n_per_class // 4)):
        name = f"hospital_bill_{i:03d}.png"
        draw("medical_record", seed_base + 7700 + i).save(root / "medical_record" / name)
        rows.append((f"medical_record/{name}", "medical_record|financial_doc", "hospital_bill"))

    if rows:
        with (root / "manifest.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["path", "labels", "source"])
            w.writerows(rows)
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description="스모크 테스트용 픽스처 생성")
    ap.add_argument("--root", type=Path, default=Path("data/fixture"))
    ap.add_argument("--n", type=int, default=12, help="클래스당 장수")
    ap.add_argument("--checkpoint", type=Path, default=Path("runs/fixture.pt"))
    args = ap.parse_args()

    if args.root.exists():
        shutil.rmtree(args.root)

    val_rows = write_split(args.root / "val", args.n, seed_base=1000)
    write_split(args.root / "train", args.n, seed_base=2000)

    # A synthetic-looking tree, to prove the validation guard actually fires.
    synth = args.root / "synth_should_be_rejected"
    (synth / "payment_card").mkdir(parents=True, exist_ok=True)
    draw("payment_card", 999).save(synth / "payment_card" / "x.png")
    (synth / SYNTHETIC_MARKER).touch()

    args.checkpoint.parent.mkdir(parents=True, exist_ok=True)
    save_checkpoint(
        args.checkpoint,
        build_model(pretrained=False),
        meta={"smoke": True, "note": "untrained random weights — plumbing only"},
    )

    n_val = sum(1 for _ in (args.root / "val").rglob("*.png"))
    print(f"픽스처 생성 완료")
    print(f"  검증셋      {args.root}/val  ({n_val}장)")
    print(f"  학습셋      {args.root}/train")
    print(f"  다중 라벨   manifest.csv {len(val_rows)}행 (medical_record|financial_doc)")
    print(f"  합성 가드   {synth}  <- 검증에 넣으면 거부되어야 함")
    print(f"  체크포인트  {args.checkpoint}  (무작위 가중치)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
