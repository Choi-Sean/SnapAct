# training/ — 게이트 모델 학습

> **이 디렉터리는 앱 타겟에 포함되지 않습니다.** Python 전용 학습 코드이며
> Xcode 프로젝트가 참조하지 않습니다. 앱으로 넘어가는 것은 `export/` 의 산출물뿐입니다.
> `apps/ios/` 는 이 디렉터리에서 건드리지 않습니다.

## 만드는 것

차단 게이트 **하나**. 설계상 모델이 3개지만 지금 학습 가능한 건 이것뿐입니다.

| 모델 | 상태 |
|---|---|
| **게이트 (차단 4클래스)** | **★ 현재 작업** |
| 라우터 | Foundation Models 프롬프트로 처리 — 학습 안 함 |
| 액션 랭킹 | 사용자 로그가 재료 — M1 출시 후 |
| 필드 라벨링 | 사용자 수정 이력이 재료 — M2 이후 |

## 스펙 (변경 금지)

클래스 목록·순서·임계값의 단일 출처는 [`gate/classes.py`](gate/classes.py)입니다.
설정 YAML이 아니라 거기에 있습니다.

- **클래스 5개**: `id_document` / `payment_card` / `medical_record` / `financial_doc` / `safe`
- **클래스별 독립 시그모이드. softmax 아님.**
  비대칭 임계값(차단 0.30, safe 판정 0.90)을 적용하려면 클래스 간 확률 경쟁이 없어야 합니다.
  softmax면 신용카드와 명함이 확률을 나눠 가져 둘 다 낮게 나오고, fail-closed를 적용할
  지점 자체가 사라집니다.
- **손실**: `BCEWithLogitsLoss`
- **최우선 지표: positive 재현율.** 정밀도는 희생 가능합니다. 명함을 카드로 잘못 막으면
  사용자가 한 번 더 공유하면 되지만, 반대 방향은 데이터 유출입니다.
- **별도 추적**: `business_card → payment_card`, `business_card → id_document` 오탐률.
  (`privacy.md`가 두 쌍 모두 "Leak" 등급으로 지정) 평균에 절대 섞지 않습니다.
- **검증셋은 실촬영만.** 합성은 학습에만 씁니다.

## 백본 — 두 트랙

| | 내용 | 상태 |
|---|---|---|
| **트랙 A** | PyTorch MobileNetV3-Small fine-tune. Python만으로 완결 | **현재** |
| 트랙 B | Apple `VNGenerateImageFeaturePrint` 임베딩 + 경량 헤드 | 대기 — [`dump_embeddings/`](dump_embeddings/README.md) |

A를 먼저 하는 이유 두 가지:
1. A가 B의 성능 상한을 알려줍니다. 백본까지 학습시켰는데도 정확도가 안 나오면
   고정 임베딩으로는 더 안 나오고, 그건 모델이 아니라 데이터 부족이라는 뜻입니다.
2. 기존 스파이크(`spikes/s3-l1-vision-classifier/train.swift`)가 쓰는 Create ML
   `MLImageClassifier`는 **softmax multi-class 고정**이라 이번 스펙의 독립 시그모이드를
   만들 수 없습니다. 트랙 B로도 결국 헤드를 직접 학습해야 합니다.

## 디렉터리

```
training/
├── gate/               클래스 계약(classes.py), 데이터, 모델, 지표 — train/eval/export 공용
├── synth/              합성 데이터 생성 (템플릿 인터페이스 + 증강)
├── dump_embeddings/    트랙 B용 Swift CLI 자리 (README만)
├── configs/            하이퍼파라미터 YAML
├── data/               이미지. gitignore 처리
├── export/             파트너 전달 산출물 (.mlpackage / 가중치 JSON / INTERFACE.md)
├── train_gate.py
├── eval_gate.py
└── export_coreml.py
```

`gate/` 패키지를 따로 둔 이유: 클래스 **순서**가 앱과의 인터페이스 계약인데,
train/eval/export 세 곳에 목록을 복사해두면 언젠가 하나만 바뀝니다. 그러면 테스트는
전부 통과하면서 Swift 쪽 인덱싱만 조용히 어긋납니다.

## 진행 상태

- [x] 1. 디렉터리 구조 + 설정 + 클래스 계약
- [x] 2. `eval_gate.py` + 지표 + 데이터 로더 (다중 라벨) + 2D 임계값 스윕
- [ ] 3. 합성 데이터 파이프라인
- [ ] 4. 직접 수집해야 할 데이터 목록 (네거티브 구성이 성패를 가릅니다)
- [ ] 5. 학습 (데이터 확보 후)
- [ ] 6. 내보내기 + 인터페이스 문서

## 설치

```bash
make setup          # 리포 루트에서. 루트 .venv 에 전체 설치
```

인터프리터는 **리포 루트의 공용 `.venv`** 하나입니다 (`training/.venv` 가 아닙니다).
루트에 두면 에디터·IDE 가 자동으로 잡고, 카탈로그 생성 도구와 학습 코드가 같은
환경을 공유합니다. 의존성 정의는 여전히 `training/requirements.txt` 이고, 루트
`requirements.txt` 가 그것을 `-r` 로 합칩니다.

Python 3.12 를 씁니다 — 시스템 python 3.14 에는 coremltools 휠이 없습니다.

## 직접 돌려보기 (데이터 없이)

```bash
cd training
make smoke          # 픽스처 생성 -> 평가 리포트 전체 출력
make guards         # 스펙을 코드로 강제하는 가드 22개 검증
```

`make smoke` 는 가짜 이미지와 **학습되지 않은 무작위 가중치**로 평가를 끝까지 돌립니다.
리포트 형태·지표 배선·CSV 출력을 눈으로 확인하는 용도이고, 정확도에 대해서는
아무것도 말해주지 않습니다 (실행하면 상단에 경고 배너가 뜹니다).

`make guards` 가 확인하는 것 (22건):

| 가드 | 내용 |
|---|---|
| 라벨 불변식 | `safe` 는 차단 클래스 부재로부터 유도. 둘 다 1인 라벨은 거부 |
| 다중 라벨 | `medical_record\|financial_doc` 동시 양성 허용 |
| fail-closed | 의심만으로 BLOCK, safe 신뢰도 미달도 BLOCK, `unknown` 없음 |
| 검증셋 합성 차단 | 합성 마커가 있는 디렉터리는 검증 로딩에서 예외 |
| 클래스 순서 계약 | 순서가 다른 체크포인트는 로드 거부 |
| 권장 동작점 | 정답을 아는 확률 행렬로 검증 — 유출 0 하드 필터, 동률 시 더 의심하는 쪽 |

실제 데이터가 생기면:

```bash
make eval CKPT=runs/best.pt DATA=data/real/val
```

## 다중 라벨

한 사진이 차단 클래스 여러 개에 동시에 해당할 수 있습니다 (병원 진료비 영수증 =
`medical_record` + `financial_doc`). 독립 시그모이드라 구조 변경 없이 지원됩니다.

- **디렉터리**로는 단일 라벨만 표현됩니다.
- **다중 라벨은 `manifest.csv`** 로 지정합니다 (`path,labels,source`, labels 는 `|` 구분).
  같은 파일에 대해 manifest 행이 디렉터리 스캔을 덮어쓰므로, 파일을 옮기지 않고
  `medical_record/` 에 둔 채 `medical_record|financial_doc` 로 승격할 수 있습니다.
- `safe` 는 **라벨에 직접 쓰지 않습니다.** "차단 클래스가 하나도 없음"에서 유도됩니다.
  라벨에 `safe` 를 명시하면 거부합니다 — 처방전을 safe 로 학습시키는 사고를 막기 위함입니다.

## 기존 자산과의 관계

`spikes/s3-l1-vision-classifier/` 에 실사진 662장으로 학습된 게이트가 이미 있습니다.
다만 차단 클래스가 `passport`/`payment_card` 둘뿐이라 **신분증·처방전·금융문서는 현재
차단되지 않습니다**. 이번 재학습이 그 구멍을 메웁니다. 기존 실사진은 재매핑해서
그대로 재사용합니다 — [`data/README.md`](data/README.md) 참고.
