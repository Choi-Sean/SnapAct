# 산출물 (파트너 전달용)

여기 들어가는 것만 앱으로 넘어갑니다. `export_coreml.py`가 생성합니다.

| 파일 | 용도 |
|---|---|
| `GateClassifier.mlpackage` | Core ML. 전처리(정규화) 포함 → Swift는 이미지만 넘기면 됨 |
| `gate_weights.json` | 헤드를 Accelerate/BNNS로 직접 돌릴 경우. Core ML 툴체인 버전 문제 회피용 |
| `INTERFACE.md` | 입력 크기/전처리, 출력 5개 값의 순서와 의미, 권장 임계값, fail-closed 규칙 |

체크포인트(`runs/`)는 커밋하지 않습니다. 재생성 가능하고 용량이 큽니다.

**출력 순서는 `gate/classes.py`의 `CLASSES` 순서와 반드시 같습니다.** Swift가 위치로
인덱싱하므로, 순서가 바뀌면 테스트는 전부 통과하면서 앱만 조용히 오동작합니다.
