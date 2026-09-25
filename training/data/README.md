# 데이터 디렉터리

**이 디렉터리의 이미지는 커밋되지 않습니다** (`training/.gitignore`가 `data/` 전체 제외).
실제 신분증·카드·의료·금융 이미지는 어떤 경우에도 리포에 들어가지 않습니다.

## 레이아웃

```
data/
├── synth/                      # 생성물. synth/generate.py가 씀. 학습 전용
│   ├── id_document/
│   ├── payment_card/
│   ├── medical_record/
│   └── financial_doc/
└── real/                       # 실촬영
    ├── train/
    │   ├── id_document/
    │   ├── payment_card/
    │   ├── medical_record/
    │   ├── financial_doc/
    │   └── safe/
    │       ├── business_card/  # safe 하위는 출처별로 나눕니다 — 아래 참고
    │       ├── receipt/
    │       └── scene/
    └── val/                    # 검증 전용. 합성 금지
        └── (train과 동일 구조)
```

### `safe/` 를 하위 디렉터리로 쪼개는 이유

라벨은 전부 `safe`로 동일하지만, `business_card → payment_card` 오탐률처럼
**출처별로 따로 뽑아야 하는 지표**가 있습니다 (`gate/classes.py`의
`TRACKED_FALSE_POSITIVE_PAIRS`). 하위 디렉터리 이름이 그 출처 태그입니다.

### `safe`는 합성하지 않습니다

합성 `safe` 이미지는 "우리 렌더러 vs 실제 카메라"를 구분하는 법을 가르치는 셈이라
safe 클래스의 목적과 정반대입니다. safe 네거티브는 실사진만 씁니다.

## 이미 확보된 것 — `spikes/s3-l1-vision-classifier/data_real/`

로컬에 이미 실사진 662장이 있습니다 (gitignore돼 있어 리포에는 없음). 새 스펙으로 재매핑:

| 기존 폴더 | train + val | 새 위치 |
|---|---|---|
| `passport` | 35 + 9 | `real/*/id_document/` |
| `payment_card` | 40 + 11 | `real/*/payment_card/` |
| `business_card` | 44 + 11 | `real/*/safe/business_card/` |
| `receipt` | 209 + 53 | `real/*/safe/receipt/` |
| `other` (Places365) | 200 + 50 | `real/*/safe/scene/` |

## 직접 모아야 하는 것

→ 세션 1의 4단계에서 정리합니다. (아직 작성 전)
