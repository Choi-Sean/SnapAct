#!/usr/bin/env python3
"""Python 기준 임베딩을 뽑아 CrossValidation/reference.json 에 기록한다.

Swift 쪽 전처리가 어긋났는지 잡는 것이 목적이다. class_embeddings.json 은
이 파이프라인(PIL 로 열고 256x256 으로 스쿼시)으로 만들어졌으므로, Swift 가
다르게 전처리하면 임베딩이 조용히 다른 공간에 놓인다. 에러는 나지 않고
정확도만 떨어지므로 사후 추적이 거의 불가능하다.

    python crossvalidate.py           # 기준값 생성
    python crossvalidate.py --show    # 기존 기준값 요약만
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "CrossValidation/images"
REFERENCE = ROOT / "CrossValidation/reference.json"
ENCODER = ROOT / "Sources/SnapActKit/Resources/mobileclip_s0_image.mlpackage"


def embed(model, path: Path) -> np.ndarray:
    # 이 세 줄이 계약이다. Swift 는 같은 결과를 내야 한다:
    #   RGB 로 변환 · 256x256 으로 스쿼시(종횡비 보존 없음) · 정규화는 모델 내부
    image = Image.open(path).convert("RGB").resize((256, 256))
    result = model.predict({"image": image})
    return np.array(result["final_emb_1"], dtype=np.float32).reshape(-1)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--show", action="store_true")
    args = ap.parse_args()

    if args.show:
        data = json.loads(REFERENCE.read_text())
        print(f"모델 {data['encoderSha256'][:12]}  이미지 {len(data['images'])}개")
        for name, entry in sorted(data["images"].items()):
            print(f"  {name:<18} norm={entry['norm']:.4f}  sha={entry['sha256'][:12]}")
        return 0

    import coremltools as ct

    model = ct.models.MLModel(str(ENCODER))
    images = sorted(IMAGES.glob("*.png"))
    if not images:
        raise SystemExit(f"이미지가 없습니다: {IMAGES}")

    out = {}
    for path in images:
        vector = embed(model, path)
        norm = float(np.linalg.norm(vector))
        out[path.name] = {
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "norm": norm,
            # 정규화해서 저장한다. Swift 와 비교할 값은 코사인이고,
            # 인코더 출력 스케일 자체는 비교 대상이 아니다.
            "embedding": (vector / norm).tolist(),
        }
        print(f"  {path.name:<18} norm={norm:.4f}")

    # 모델이 바뀌면 기준값도 무효다.
    encoder_weights = ENCODER / "Data/com.apple.CoreML/weights/weight.bin"
    REFERENCE.write_text(json.dumps({
        "encoder": ENCODER.name,
        "encoderSha256": hashlib.sha256(encoder_weights.read_bytes()).hexdigest(),
        "dim": int(len(out[images[0].name]["embedding"])),
        "preprocessing": "PIL convert('RGB').resize((256,256)) — 스쿼시, 종횡비 보존 없음",
        "images": out,
    }, indent=2) + "\n")
    print(f"\n기준값 기록: {REFERENCE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
