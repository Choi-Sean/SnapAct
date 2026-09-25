#!/usr/bin/env python3
"""실사진으로 제로샷 분류를 평가하고, 임계값 근거를 만든다.

routing_config.json 의 minScore / minMargin 이 null 인 이유는 추측으로 채우지
않기 위해서다. 이 스크립트가 그 근거를 만든다.

    python eval_router.py <데이터 루트>
    python eval_router.py <데이터 루트> --limit 50     # 빠른 확인

데이터 레이아웃 (클래스별 디렉터리):

    <루트>/<split>/<클래스명>/*.jpg

클래스명은 class_embeddings.json 의 클래스명이거나, 아래 셋 중 하나로 해석된다:
  other          — 액션 대상이 아닌 일반 사진. 네거티브로 가야 정답
  payment_card   — Tier 0. 서비스 클래스로 가면 유출 위험
  passport       — Tier 0. 동일
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RESOURCES = ROOT / "Sources/SnapActKit/Resources"
SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".heic"}

# Tier 0 이라 서비스 클래스로 분류되면 안 되는 것들.
TIER0_LABELS = {"payment_card", "passport", "id_card", "prescription", "financial_doc"}
# 액션 대상이 아닌 일반 사진.
REJECT_LABELS = {"other"}


def load_classes():
    data = json.loads((RESOURCES / "class_embeddings.json").read_text())
    names = sorted(data["classes"])
    matrix = np.array([data["classes"][n]["embedding"] for n in names], np.float32)
    negatives = {n for n in names if data["classes"][n]["isNegative"]}
    return names, matrix, negatives


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("data_root", type=Path)
    ap.add_argument("--limit", type=int, default=None, help="클래스당 최대 장수")
    args = ap.parse_args()

    import coremltools as ct
    from PIL import Image

    names, matrix, negatives = load_classes()
    model = ct.models.MLModel(str(RESOURCES / "mobileclip_s0_image.mlpackage"))

    files: list[tuple[str, Path]] = []
    per_label: Counter = Counter()
    for split in sorted(p for p in args.data_root.iterdir() if p.is_dir()):
        for class_dir in sorted(p for p in split.iterdir() if p.is_dir()):
            for path in sorted(class_dir.iterdir()):
                if path.suffix.lower() not in SUFFIXES:
                    continue
                if args.limit and per_label[class_dir.name] >= args.limit:
                    continue
                per_label[class_dir.name] += 1
                files.append((class_dir.name, path))
    if not files:
        raise SystemExit(f"이미지가 없습니다: {args.data_root}")
    print(f"이미지 {len(files)}장, 라벨 {len(per_label)}종\n")

    results: dict[str, list] = defaultdict(list)
    for label, path in files:
        # build_clip_prompts.py 와 같은 전처리여야 한다.
        image = Image.open(path).convert("RGB").resize((256, 256))
        vector = np.array(model.predict({"image": image})["final_emb_1"]).reshape(-1)
        vector /= np.linalg.norm(vector)
        scores = matrix @ vector
        order = np.argsort(-scores)
        results[label].append((names[order[0]], float(scores[order[0]]),
                               float(scores[order[0]] - scores[order[1]]),
                               [names[i] for i in order[:5]]))

    report(results, negatives)
    return 0


def report(results: dict[str, list], negatives: set[str]) -> None:
    print("=== 1위 클래스 분포 ===")
    for label, rows in sorted(results.items()):
        scores = np.array([r[1] for r in rows])
        print(f"\n── {label}  ({len(rows)}장)  점수 중앙 {np.median(scores):.3f}")
        for cls, n in Counter(r[0] for r in rows).most_common(4):
            tag = "NEG" if cls in negatives else "   "
            hit = " ←정답" if cls == label else ""
            print(f"     {tag} {cls:<24} {n:>4}장 ({n / len(rows) * 100:5.1f}%){hit}")

    tier0 = [l for l in results if l in TIER0_LABELS]
    if tier0:
        print("\n=== 유출 위험: Tier 0 사진이 서비스 클래스로 갔는가 ===")
        for label in tier0:
            rows = results[label]
            escaped = [r[0] for r in rows if r[0] not in negatives]
            print(f"  {label:<14} {len(escaped)}/{len(rows)}  {sorted(set(escaped))}")
        print("  (차단 게이트가 잡아야 할 몫입니다. 라우터가 우연히 막아주는 것에 기대면 안 됩니다.)")

    keep_labels = [l for l in results if l not in TIER0_LABELS and l not in REJECT_LABELS]
    reject_labels = [l for l in results if l in REJECT_LABELS]
    if keep_labels and reject_labels:
        keep_s = np.array([r[1] for l in keep_labels for r in results[l]])
        keep_m = np.array([r[2] for l in keep_labels for r in results[l]])
        rej_s = np.array([r[1] for l in reject_labels for r in results[l]])
        rej_m = np.array([r[2] for l in reject_labels for r in results[l]])

        print(f"\n=== minScore 스윕 (액션대상 {len(keep_s)}장 vs 일반사진 {len(rej_s)}장) ===")
        print(f"  {'minScore':>9} {'액션대상 통과':>14} {'일반사진 거부':>14}")
        for t in np.arange(0.16, 0.30, 0.02):
            print(f"  {t:>9.2f} {np.mean(keep_s >= t) * 100:>13.1f}% {np.mean(rej_s < t) * 100:>13.1f}%")

        print("\n=== minMargin 스윕 ===")
        print(f"  {'minMargin':>9} {'액션대상 통과':>14} {'일반사진 거부':>14}")
        for t in [0.005, 0.010, 0.015, 0.020]:
            print(f"  {t:>9.3f} {np.mean(keep_m >= t) * 100:>13.1f}% {np.mean(rej_m < t) * 100:>13.1f}%")
        print("  margin 은 두 분포가 겹쳐 분리력이 약합니다. 높게 잡으면 정답까지 같이 버립니다.")


if __name__ == "__main__":
    raise SystemExit(main())
