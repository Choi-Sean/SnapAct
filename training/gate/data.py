"""Dataset loading and multi-hot label construction.

Two rules are enforced in code rather than by convention, because both are
the kind of mistake that produces a great-looking number and a leaking app:

  1. Validation never sees synthetic images. `GateDataset(allow_synthetic=
     False)` refuses a root that contains the marker generate.py writes.
  2. A label may not claim both a blocking class and `safe` — see
     gate.classes.labels_to_vector.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import Dataset

from .classes import BLOCKING_CLASSES, SAFE_CLASS, labels_to_vector, should_block

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".bmp"}

# synth/generate.py drops this file at the root of anything it writes.
SYNTHETIC_MARKER = ".synthetic"

MANIFEST_NAME = "manifest.csv"


@dataclass(frozen=True)
class Sample:
    path: Path
    target: tuple[float, ...]
    source: str          # provenance tag, e.g. "business_card" — drives tracked FP pairs
    synthetic: bool

    @property
    def is_blocking(self) -> bool:
        return should_block(self.target)


def _iter_images(directory: Path):
    for p in sorted(directory.rglob("*")):
        if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES:
            yield p


def _scan_directories(root: Path, synthetic: bool) -> list[Sample]:
    """Directory layout -> samples. See data/README.md.

        <root>/<blocking_class>/**         -> that one blocking class
        <root>/safe/<source_tag>/**        -> safe, tagged by source
        <root>/safe/**                     -> safe, tagged "safe"
    """
    samples: list[Sample] = []

    for cls in BLOCKING_CLASSES:
        cls_dir = root / cls
        if not cls_dir.is_dir():
            continue
        target = labels_to_vector([cls])
        for img in _iter_images(cls_dir):
            samples.append(Sample(img, target, cls, synthetic))

    safe_dir = root / SAFE_CLASS
    if safe_dir.is_dir():
        target = labels_to_vector([])
        for img in _iter_images(safe_dir):
            # The directory directly under safe/ is the provenance tag; images
            # sitting loose in safe/ fall back to "safe".
            rel = img.relative_to(safe_dir)
            source = rel.parts[0] if len(rel.parts) > 1 else SAFE_CLASS
            samples.append(Sample(img, target, source, synthetic))

    return samples


def _read_manifest(root: Path, synthetic: bool) -> list[Sample]:
    """Multi-label rows that a directory layout cannot express.

    Columns: path,labels,source
      path   - relative to the manifest's directory
      labels - "|"-separated blocking class names; EMPTY means safe
      source - optional provenance tag (defaults to labels, or "safe")

    A manifest row wins over the directory scan for the same file, so a
    hospital bill filed under medical_record/ can be upgraded to
    "medical_record|financial_doc" without moving it.
    """
    manifest = root / MANIFEST_NAME
    if not manifest.is_file():
        return []

    samples: list[Sample] = []
    with manifest.open(newline="", encoding="utf-8") as fh:
        for lineno, row in enumerate(csv.DictReader(fh), start=2):
            raw = (row.get("path") or "").strip()
            if not raw:
                continue
            img = (root / raw).resolve()
            if not img.is_file():
                raise FileNotFoundError(f"{manifest}:{lineno} — 파일 없음: {raw}")

            names = [n.strip() for n in (row.get("labels") or "").split("|") if n.strip()]
            try:
                target = labels_to_vector(names)
            except ValueError as exc:
                raise ValueError(f"{manifest}:{lineno} — {exc}") from exc

            source = (row.get("source") or "").strip() or ("+".join(names) if names else SAFE_CLASS)
            samples.append(Sample(img, target, source, synthetic))
    return samples


def collect_samples(root: str | Path, *, allow_synthetic: bool) -> list[Sample]:
    root = Path(root).resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"데이터 디렉터리 없음: {root}")

    synthetic = _looks_synthetic(root)
    if synthetic and not allow_synthetic:
        raise ValueError(
            f"검증셋에 합성 데이터가 들어왔습니다: {root}\n"
            "합성은 학습 전용입니다. 검증은 실촬영만 사용합니다 "
            "(spec: 검증셋에 합성 데이터를 섞지 않는다)."
        )

    samples = _scan_directories(root, synthetic)

    # Manifest rows replace directory-derived entries for the same file.
    overrides = {s.path: s for s in _read_manifest(root, synthetic)}
    merged = [overrides.pop(s.path, s) for s in samples]
    merged.extend(overrides.values())

    if not merged:
        raise ValueError(f"이미지를 찾지 못했습니다: {root} (레이아웃은 data/README.md 참고)")
    return merged


def _looks_synthetic(root: Path) -> bool:
    if (root / SYNTHETIC_MARKER).exists():
        return True
    if any(root.rglob(SYNTHETIC_MARKER)):
        return True
    # Belt and braces: the conventional path also counts.
    return "synth" in {part.lower() for part in root.parts}


class GateDataset(Dataset):
    def __init__(self, root, transform, *, allow_synthetic: bool):
        self.samples = collect_samples(root, allow_synthetic=allow_synthetic)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        s = self.samples[idx]
        with Image.open(s.path) as img:
            image = self.transform(img.convert("RGB"))
        return image, torch.tensor(s.target, dtype=torch.float32), idx

    # Convenience for reporting; avoids re-deriving these in eval.
    def sources(self) -> list[str]:
        return [s.source for s in self.samples]

    def paths(self) -> list[Path]:
        return [s.path for s in self.samples]
