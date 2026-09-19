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
make test      # 1~11단계 검증
make run       # 디버그 화면 (macOS 창)
```

`xcode-select` 가 Command Line Tools 를 가리켜도 Makefile 이 `DEVELOPER_DIR` 을 직접
지정하므로 전역 설정을 바꿀 필요가 없습니다. 다만 **Xcode 26 이상**은 필요합니다
(FoundationModels, Swift 6).

## 디렉터리

| 경로 | 내용 | 단계 |
|---|---|---|
| `Vision/` | CLIP 임베딩 · 사전필터 · 구조 신호 | 6, 7 |
| `Routing/` | `PhotoRouter` + `CLIPRouter` + FM 텍스트 라우터 | 7, 9 |
| `OCR/` | `TextReader` + OCR_SPEC (텍스트까지만) | 8 |
| `Catalog/` | `Resources/actions.json` 파싱 | 3 |
| `Ranking/` | 후보 생성 + 베이지안 + 탐색 | 10 |
| `Logging/` | 상호작용 로그 스키마·저장 | 11 |
| `Gate/` | Tier 0 차단 게이트 (이번엔 스텁) | 4 |
| `DebugUI/` | SwiftUI 리뷰 화면 | 12 |
| `tools/` | xlsx → json 변환 | 2 |

`Sources/SnapActDebugApp/` 는 macOS 실행 타겟이며 **창 하나가 전부**입니다.
리뷰 대상 동작은 전부 `DebugUI/` 안에 있어서, 파트너가 iOS 앱에서 같은 뷰를
그대로 띄울 수 있습니다.

각 디렉터리의 `_*Area.swift` 는 "여기에 무엇이 들어오는가"를 적어둔 자리표시자이며,
해당 단계에서 실제 코드로 대체됩니다.

## 모델 자산

이미지 인코더는 `mobileclip_s0_image.mlpackage` (22MB) 입니다. 실측 규격:

| | |
|---|---|
| 입력 | `image` · imageType · 256×256 · RGB |
| 출력 | `final_emb_1` · multiArray `[1, 512]` · Float32 |

**Swift 에서 픽셀값 정규화를 하지 마세요.** 입력이 imageType 이라 스케일링이
그래프 안에 있습니다 — `image` 직후 첫 연산이 `× 0.00392156886` (= 1/255) 인 것을
확인했습니다. 한 번 더 하면 에러 없이 정확도만 떨어져서 사후 추적이 거의
불가능합니다.

**텍스트 인코더(81MB)는 번들하지 않습니다.** 클래스 임베딩은
`class_embeddings.json` 에 사전 계산돼 있고 (45항목 = 클래스 37 + 네거티브 8,
dim 512, L2 정규화 완료), 런타임 텍스트 인코딩은 없습니다.

## 이 패키지가 하지 않는 것

- **네트워크 없음.** 전송 코드가 한 줄도 없습니다.
- **업로드 불가.** `Gate` 모델이 학습 전이라 `UploadableImage` 를 만들 수 없습니다.
  누군가 업로드 경로를 먼저 만들면 런타임 유출이 아니라 컴파일 에러가 납니다.
- **사진·추출 필드 값 로깅 없음.** 신호의 존재 여부만 기록합니다.

## 카탈로그 생성 규칙

클래스 목록과 액션 목록은 **어디에도 하드코딩하지 않습니다.**
`docs/SnapAct_클래스별액션_검토.xlsx` 를 고치고 `tools/build_catalog.py` 를 다시 돌리는 것이
카탈로그를 바꾸는 유일한 경로입니다.
