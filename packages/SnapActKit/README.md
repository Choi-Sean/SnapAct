# SnapActKit

사진 한 장 → 카테고리 판정 → **액션 후보 목록을 순위대로**.

제품의 문제 정의는 "사진을 잘 분류하는 것"이 아니라 "액션 리스트를 잘 예측하는 것"입니다.
카테고리는 목적이 아니라 액션 예측을 돕는 피처입니다. 그래서 `Ranking` 은 `Routing` 의
성공에 의존하지 않습니다 — `unknown` 은 실패가 아니라 주 경로입니다.

앱 타겟이 아니라 로컬 SPM 패키지인 이유: 앱과 Share Extension 양쪽에서 import 해야 하는데,
익스텐션은 앱 타겟을 import 할 수 없습니다. UIKit 에 의존하지 않으므로 Xcode 프로젝트 없이
호스트 Mac 에서 `swift test` 로 전부 검증됩니다.

## 돌려보기

```bash
cd packages/SnapActKit
make doctor    # 툴체인 점검
make test
```

`xcode-select` 가 Command Line Tools 를 가리켜도 Makefile 이 `DEVELOPER_DIR` 을 직접
지정하므로 전역 설정을 바꿀 필요가 없습니다. 다만 **Xcode 26 이상**은 필요합니다
(FoundationModels, Swift 6).

## 디렉터리

| 경로 | 내용 | 단계 |
|---|---|---|
| `Vision/` | 이미지 임베딩 추출 | 5 |
| `Routing/` | 카테고리 판정 + 프로토콜 | 6 |
| `Catalog/` | `Resources/actions.json` 파싱 | 3 |
| `Ranking/` | 후보 생성 + 베이지안 랭킹 | 7 |
| `Logging/` | 상호작용 로그 스키마·저장 | 8 |
| `Gate/` | Tier 0 차단 게이트 (이번엔 스텁) | 4 |
| `tools/` | xlsx → json 변환 | 2 |

각 디렉터리의 `_*Area.swift` 는 "여기에 무엇이 들어오는가"를 적어둔 자리표시자이며,
해당 단계에서 실제 코드로 대체됩니다.

## 이 패키지가 하지 않는 것

- **네트워크 없음.** 전송 코드가 한 줄도 없습니다.
- **업로드 불가.** `Gate` 모델이 학습 전이라 `UploadableImage` 를 만들 수 없습니다.
  누군가 업로드 경로를 먼저 만들면 런타임 유출이 아니라 컴파일 에러가 납니다.
- **사진·추출 필드 값 로깅 없음.** 신호의 존재 여부만 기록합니다.

## 카탈로그 생성 규칙

클래스 목록과 액션 목록은 **어디에도 하드코딩하지 않습니다.**
`docs/SnapAct_클래스별액션_검토.xlsx` 를 고치고 `tools/build_catalog.py` 를 다시 돌리는 것이
카탈로그를 바꾸는 유일한 경로입니다.
