#!/usr/bin/env python3
"""데이터/모델 계약을 코드로 강제하는 가드들이 실제로 발동하는지 확인.

테스트 프레임워크를 끌어오지 않고 직접 실행 가능하게 둡니다 — 이 파일 하나가
"스펙이 아직 지켜지고 있는가"에 대한 대답입니다.

    python tools/check_guards.py     (또는 make guards)
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from gate.classes import CLASSES, decide, labels_to_vector, should_block  # noqa: E402
from gate.data import SYNTHETIC_MARKER, collect_samples  # noqa: E402
from gate.model import build_model, load_checkpoint, resolve_device  # noqa: E402

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    mark = "  OK  " if condition else " FAIL "
    print(f"[{mark}] {name}" + (f"  — {detail}" if detail and not condition else ""))
    if not condition:
        failures.append(name)


def expect_raises(name: str, fn, exc=Exception) -> None:
    try:
        fn()
    except exc:
        check(name, True)
        return
    check(name, False, "예외가 발생하지 않음")


print("\n--- 라벨 불변식 (다중 라벨) ---")
check("safe 는 차단 클래스 부재로부터 유도됨", labels_to_vector([])[-1] == 1.0)
check("다중 라벨 허용 (medical_record + financial_doc)",
      labels_to_vector(["medical_record", "financial_doc"]) == (0.0, 0.0, 1.0, 1.0, 0.0))
check("차단 클래스가 있으면 safe=0",
      labels_to_vector(["medical_record", "financial_doc"])[-1] == 0.0)
expect_raises("safe 를 명시적으로 주면 거부", lambda: labels_to_vector(["medical_record", "safe"]), ValueError)
expect_raises("알 수 없는 클래스명 거부", lambda: labels_to_vector(["passport"]), ValueError)
check("should_block: 차단 라벨 있으면 True", should_block(labels_to_vector(["id_document"])))
check("should_block: safe 는 False", not should_block(labels_to_vector([])))

print("\n--- fail-closed 정책 ---")
check("차단 클래스가 임계값 넘으면 BLOCK", decide([0.31, 0.0, 0.0, 0.0, 0.99]) == "blocked")
check("최상위가 아니어도 의심되면 BLOCK (비대칭 임계값)",
      decide([0.35, 0.0, 0.0, 0.0, 0.95]) == "blocked")
check("safe 신뢰도 미달이면 BLOCK ('unknown' 없음)",
      decide([0.0, 0.0, 0.0, 0.0, 0.89]) == "blocked")
check("전부 통과해야 ALLOW", decide([0.0, 0.0, 0.0, 0.0, 0.95]) == "allowed")
expect_raises("출력 차원이 다르면 거부", lambda: decide([0.0, 0.0, 0.0]), ValueError)

print("\n--- 검증셋 합성 차단 ---")
with tempfile.TemporaryDirectory() as td:
    root = Path(td) / "val"
    (root / "payment_card").mkdir(parents=True)
    from PIL import Image
    Image.new("RGB", (64, 64)).save(root / "payment_card" / "a.png")
    check("실촬영 디렉터리는 통과", len(collect_samples(root, allow_synthetic=False)) == 1)
    (root / SYNTHETIC_MARKER).touch()
    expect_raises("합성 마커가 있으면 검증 로딩 거부",
                  lambda: collect_samples(root, allow_synthetic=False), ValueError)
    check("학습 로딩은 합성 허용", len(collect_samples(root, allow_synthetic=True)) == 1)

print("\n--- 체크포인트 클래스 순서 계약 ---")
with tempfile.TemporaryDirectory() as td:
    p = Path(td) / "reordered.pt"
    torch.save({"state_dict": build_model(pretrained=False).state_dict(),
                "classes": list(reversed(CLASSES)), "meta": {}}, p)
    expect_raises("클래스 순서가 다른 체크포인트 거부",
                  lambda: load_checkpoint(p, resolve_device("cpu")), ValueError)

print("\n--- 권장 동작점 선정 로직 ---")
# 정답을 아는 확률 행렬을 직접 만들어 검증합니다. 픽스처는 무작위 가중치라
# 2D 그리드가 전 셀 균일하게 나와서 이 로직을 전혀 시험하지 못합니다.
import numpy as np  # noqa: E402
from gate.metrics import (  # noqa: E402
    policy_metrics,
    recommend_operating_point,
    threshold_grid,
    threshold_sweep,
)

# 순서: id_document, payment_card, medical_record, financial_doc, safe
# safe 확률을 전부 0.99 로 둬서 safe 축을 무력화 -> 차단 축만 남습니다.
T = np.array([
    [0, 1, 0, 0, 0],   # payment_card (차단 대상)
    [0, 1, 0, 0, 0],   # payment_card (차단 대상)
    [0, 0, 0, 0, 1],   # business_card (safe)
    [0, 0, 0, 0, 1],   # business_card (safe)
], dtype=float)
P = np.array([
    [0.0, 0.40, 0.0, 0.0, 0.99],
    [0.0, 0.60, 0.0, 0.0, 0.99],
    [0.0, 0.10, 0.0, 0.0, 0.99],   # 0.10 에서만 과차단을 유발
    [0.0, 0.05, 0.0, 0.0, 0.99],
])
SRC = ["payment_card", "payment_card", "business_card", "business_card"]

grid = threshold_grid(T, P, SRC)
rec, _ = recommend_operating_point(grid)
# 유출 0 조건: 차단 임계값 <= 0.40 (0.40 짜리를 잡아야 함)
# 과차단 0 조건: 차단 임계값 > 0.10
# -> 0.15 ~ 0.40 이 정답 구간, 동률이면 더 의심하는 쪽(낮은 차단/높은 safe)
check("유출 0 구간에서 과차단 최소 지점을 고름", rec is not None and rec["leaks"] == 0)
check("동률 시 더 의심하는 쪽 선택 (차단 0.15 / safe 0.95)",
      rec is not None and rec["block_threshold"] == 0.15 and rec["safe_threshold"] == 0.95,
      f"실제 {rec and (rec['block_threshold'], rec['safe_threshold'])}")
check("권장 지점의 과차단 0건", rec is not None and rec["false_blocks"] == 0)

# 차단 임계값이 0.45 로 올라가면 0.40 짜리가 빠져나갑니다.
leaky = policy_metrics(T, P, 0.45, 0.90)
check("차단 임계값을 올리면 유출이 실제로 발생", leaky.leaks == 1, f"leaks={leaky.leaks}")

# 유출 0 조합이 아예 없는 경우
P_bad = P.copy()
P_bad[0, 1] = 0.02   # 어떤 차단 임계값으로도 잡히지 않음
rec_bad, note_bad = recommend_operating_point(threshold_grid(T, P_bad, SRC))
check("유출 0 조합이 없으면 None + 정직한 안내", rec_bad is None and "데이터 문제" in note_bad)

# 1D 스윕과 2D 그리드가 같은 좌표에서 일치해야 합니다.
one_d = {r["block_threshold"]: r for r in threshold_sweep(T, P, SRC, safe_threshold=0.90)}
two_d = {r["block_threshold"]: r for r in threshold_grid(T, P, SRC) if r["safe_threshold"] == 0.90}
check("1D 스윕과 2D 그리드가 동일 좌표에서 일치",
      all(one_d[b]["policy_leaks"] == two_d[b]["leaks"] for b in one_d if b in two_d))


print()
if failures:
    print(f"실패 {len(failures)}건: {', '.join(failures)}")
    raise SystemExit(1)
print("모든 가드 통과")
