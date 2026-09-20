# 테스팅 가이드

파트너와 함께 돌려보기 위한 문서입니다. **지금 무엇이 되고 무엇이 아직 안 되는지**를
먼저 적고, 그다음 실행 방법을 적습니다.

---

## 0. 한 번만: 환경

```bash
cd <리포 루트>
make setup          # Python 3.12 venv + 의존성 (torch·coremltools·openpyxl)
make verify         # 인터프리터 · 패키지 · Swift 툴체인 한 번에 점검
```

기대 출력:

```
python      : Python 3.12.6
packages    : torch 2.14.0 | coremltools 9.0 | openpyxl 3.1.5
torch mps   : 사용 가능
호스트      : macOS 26.6.2
Xcode      : Xcode 26.6
Swift      : Swift version 6.3.3
FoundationModels (macOS SDK): 있음
```

**Xcode 26 이상이 필요합니다.** `xcode-select` 가 Command Line Tools 를 가리켜도
Makefile 이 `DEVELOPER_DIR` 을 직접 지정하므로 전역 설정은 건드리지 않습니다.

---

## 1. 지금 데모할 수 있는 것

```bash
cd packages/SnapActKit
make test           # 51개 테스트, 6개 스위트, 약 3.3초
```

네 스위트가 각각 무엇을 증명하는지:

| 스위트 | 증명하는 것 |
|---|---|
| **ActionCatalog** | 엑셀에서 생성된 37 클래스 · 20 동사 · 12 신호가 온전히 로드되고, 검토에서 내린 결정들이 여전히 지켜진다 |
| **차단 게이트** | 이번 세션에서는 **업로드 가능한 이미지를 만들 수 없다** |
| **컴파일 가드** | 업로드 경로는 런타임이 아니라 **컴파일 단계**에서 막힌다 |
| **클래스 임베딩** | 45개 벡터가 단위길이이고, 코사인 계산이 Python 과 일치한다 |
| **인코더 교차 검증** | 같은 사진의 임베딩이 Python 과 **코사인 0.999 이상**으로 일치한다 |
| **라우팅** | 임계값이 정해지기 전에는 **클래스를 주장하지 않는다**. 사전필터 라벨이 Vision 이 실제로 아는 것들이다 |

### 눈으로 보는 데모

```bash
make run            # macOS 창이 뜹니다
```

지금은 **빈 껍데기**입니다. 각 패널이 어느 단계에서 채워지는지 목록만 보여줍니다.
사진을 넣어 분류하는 화면은 12단계입니다.

---

## 2. 아직 안 되는 것 (솔직하게)

| | 상태 |
|---|---|
| 사진 → 클래스 분류 | ⚠️ 파이프라인은 끝까지 돕니다. **임계값이 아직 null 이라 항상 `unknown`** — 아래 참고 |
| OCR | ❌ 8단계 |
| 액션 버튼 순위 | ❌ 10단계 |
| 개인화 카운터 | ❌ 10단계 |
| 로그 기록 | ❌ 11단계 |
| 디버그 화면 내용 | ❌ 12단계 |
| **차단 게이트 모델** | ❌ `training/` 에서 학습 중. 지금은 "모르겠다"고 보고하는 스텁 |
| 필드 추출 · 실제 액션 실행 | ❌ 이번 세션 범위 밖 |

**게이트가 스텁인 것이 왜 정상인가** — 스텁은 `.allowed` 를 돌려주지만
`modelAvailable = false` 입니다. 둘은 다른 질문에 답합니다:

- `decision` : 이 사진으로 **로컬 작업**을 해도 되는가 → 예 (라우팅·랭킹이 돌아야 함)
- `modelAvailable` : 이 사진이 **무엇인지 아는가** → 아니오

유출을 막는 건 두 번째뿐이고, `UploadableImage.make()` 는 `decision` 을 읽기
**전에** `modelAvailable` 을 봅니다. 그래서 스텁의 `.allowed` 가 통과 허가로
오독될 수 없습니다.

---

## 3. 파트너와 함께 확인해볼 것

각 항목은 "깨뜨려 보고 테스트가 잡는지" 보는 방식입니다. 전부 되돌리기 쉽습니다.

### 3-1. 업로드 경로가 정말 막혀 있나

`Sources/SnapActKit/` 에 아무 파일이나 만들고:

```swift
import Foundation
public extension SnapActKit {
    static func upload(_ bytes: Data) async throws {}
}
```

```bash
make test           # "업로드 경로는 컴파일 자체가 되지 않는다" 가 실패합니다
```

파일을 지우면 다시 통과합니다. 테스트가 잡는 것은 이 함수의 **존재 자체**입니다.

### 3-2. 카탈로그가 엑셀과 어긋나면

```bash
# 엑셀을 열어 아무 셀이나 고치고 저장한 뒤
make build          # catalog-check 가 빌드를 멈춥니다
make catalog        # 재생성
make build          # 통과
```

신선도는 파일 수정시각이 아니라 **엑셀 내용의 sha256** 으로 봅니다. 파일을
열었다 닫기만 해도 수정시각은 바뀌기 때문입니다.

### 3-3. 검토 결정이 지켜지고 있나

`Resources/actions.json` 을 직접 고쳐 보세요 (되돌리기 쉽게 복사해두고):

| 고칠 것 | 실패해야 하는 테스트 |
|---|---|
| `verbs` 에 `add_caption` 추가 | 캡션 동사는 존재하지 않는다 |
| `medication.secondary` 에 `search` 추가 | Tier 0 클래스에 외부 전송 동사가 없다 |
| `device_display.tier` 를 2 로 | health 그룹은 묶이되 병합되지 않는다 |
| `chat_screenshot.retainsRawText` 를 true 로 | 대화 원문을 보관하지 않는다 |

전부 실제로 잡히는 것을 확인했습니다.

### 3-4. 전처리가 Python 과 어긋나면 (가장 중요한 검사)

`class_embeddings.json` 은 Python 파이프라인으로 만들어졌습니다. Swift 가 사진을
다르게 전처리하면 임베딩이 **조용히 다른 공간에 놓입니다** — 에러는 없고 정확도만
떨어져서 사후 추적이 거의 불가능합니다.

`Sources/SnapActKit/Vision/PixelBuffer.swift` 에서 스쿼시를 종횡비 보존으로 바꿔
보세요:

```swift
// context.draw(image, in: CGRect(x: 0, y: 0, width: side, height: side))
let scale = min(CGFloat(side)/CGFloat(image.width), CGFloat(side)/CGFloat(image.height))
let w = CGFloat(image.width)*scale, h = CGFloat(image.height)*scale
context.draw(image, in: CGRect(x: (CGFloat(side)-w)/2, y: (CGFloat(side)-h)/2, width: w, height: h))
```

```bash
make test
```

코사인이 0.999 → **0.79~0.91** 로 떨어지고 테스트가 실패합니다. 종횡비가 가장
극단적인 `receipt_tall.png` 가 가장 크게 무너집니다. 되돌리면 다시 통과합니다.

기준값을 다시 만들려면 (인코더나 이미지를 바꿨을 때):

```bash
.venv/bin/python packages/SnapActKit/tools/crossvalidate.py
```

### 3-5. 임베딩 수치가 Python 과 같나

```bash
cd <리포 루트>
.venv/bin/python - <<'PY'
import json, numpy as np
d=json.load(open("packages/SnapActKit/Sources/SnapActKit/Resources/class_embeddings.json"))
names=sorted(d["classes"]); M=np.array([d["classes"][n]["embedding"] for n in names], dtype=np.float32)
S=M@M.T
for a,b in [("business_card","neg_card_other"),("receipt","bill_invoice")]:
    print(f"{a} ↔ {b}: {S[names.index(a),names.index(b)]:.6f}")
PY
```

```
business_card ↔ neg_card_other: 0.891982
receipt ↔ bill_invoice: 0.859910
```

Swift 쪽 같은 값은 `make test` 의 "Python 과 코사인 값이 일치한다" 가 확인합니다
(허용 오차 1e-5).

---

## 3-6. 왜 지금은 전부 `unknown` 인가

라우터는 사진을 받아 45개 클래스 점수를 다 계산하지만 **클래스를 주장하지
않습니다.** `routing_config.json` 의 임계값이 `null` 이기 때문입니다.

```
receipt_tall.png -> unknown (top chat_screenshot 0.2105, margin 0.0093)
```

이건 미완성이 아니라 의도된 상태입니다. 여기서 top 클래스를 그냥 돌려주면
**임계값 0 을 발명한 것**과 같습니다. `unknownReason` 이 `thresholdsNotConfigured`
로 따로 들어오므로, "아직 안 정했다" 와 "이 사진은 알아볼 수 없다" 가 섞이지
않습니다.

순위는 `alternates` 에 45개 전부 실려 옵니다 — **답이 unknown 일 때야말로**
디버그 화면에 필요한 값이기 때문입니다.

임계값을 채워 넣으면 테스트가 알려줍니다:

```bash
# routing_config.json 의 thresholds 를 채우고
make test    # "설정이 로드되고, 미설정 항목을 스스로 보고한다" 가 실패합니다
```

추측으로 채우는 것을 막기 위한 장치이니, 실사진으로 측정한 뒤 채우면서 그
테스트도 같이 고치시면 됩니다.

## 4. 실측 수치

### 인코더 교차 검증 (Python ↔ Swift)

| 이미지 | 종횡비 | 코사인 |
|---|---|---|
| `wide.png` | 4:1 | 0.999707 |
| `square.png` | 1:1 | 0.999647 |
| `receipt_tall.png` | 0.3:1 | 0.999617 |
| `card_landscape.png` | 1.6:1 | 0.999559 |
| `screenshot.png` | 0.56:1 | **0.999290** |

전부 기준선 0.999 위입니다. 전처리 계약은 **RGB 변환 · 256×256 스쿼시(종횡비
보존 없음) · Swift 쪽 정규화 없음** 입니다. 마지막 항목이 중요한데, `.mlpackage`
입력이 imageType 이라 스케일링(`× 1/255`)이 그래프 안에 있습니다. Swift 에서
한 번 더 하면 에러 없이 정확도만 떨어집니다.

### ⚠️ 코사인 스케일 — 임계값 정할 때 반드시 볼 것

| 비교 | 코사인 범위 |
|---|---|
| 클래스 ↔ 클래스 (텍스트↔텍스트) | 0.84 ~ 0.90 |
| **이미지 ↔ 클래스 (이미지↔텍스트)** | **0.02 ~ 0.22** |

**스케일이 완전히 다릅니다.** 5절의 클래스 간 유사도(0.89 등)를 보고 임계값을
0.8 쯤으로 잡으면 모든 사진이 `unknown` 이 됩니다. CLIP 의 image-text 코사인은
원래 이 범위입니다.

합성 테스트 이미지 5장 실측: 1위 점수 0.203~0.220, margin 0.009~0.016.
다만 **이 이미지들은 합성 패턴이라 내용에 의미가 없습니다** — 스케일만 참고하시고
임계값은 실사진으로 정하셔야 합니다.

### 모델 메모리 — 해결됨 (컴퓨트 유닛 선택)

릴리즈 빌드, 구성별로 프로세스를 새로 띄워 실측:

| 구성 | 메모리 증가 | 로드 | 추론(중앙) | Python 기준값과 코사인 |
|---|---|---|---|---|
| `.cpuOnly` | 22.2 MB | 196 ms | 9.9 ms | 0.9954 |
| **`.cpuAndNeuralEngine`** | **22.7 MB** | 718 ms | **2.4 ms** | **0.9996** |
| `.cpuAndGPU` | 62.4 MB | 205 ms | 4.8 ms | 0.9954 |
| `.all` (Core ML 기본) | 48.0 MB | 736 ms | 1.8 ms | 0.9996 |

**`.all` 은 GPU 경로까지 잡아두느라 25MB 를 더 쓰면서 정작 Neural Engine 에서
돕니다.** `.all` 과 `.cpuAndNeuralEngine` 의 임베딩은 **비트 단위로 같습니다**
(코사인 1.000000). 속도/메모리 트레이드오프가 아니라 그냥 25MB 손해입니다.

그래서 기본값을 `.cpuAndNeuralEngine` 로 바꿨습니다. **48MB → 22.7MB, 수치 변화
없음.** 테스트가 이 선택을 고정하고 있어서 되돌리면 실패합니다.

Float16 가중치가 21.7MB 인데 총 22.7MB 이므로 **뺄 오버헤드가 사실상 남아
있지 않습니다.** 더 줄이려면 양자화로 정확도를 내주는 수밖에 없고, 한 자릿수
MB 를 위해 할 일은 아닙니다.

**남은 위험 하나**: Neural Engine 을 못 쓰면 Core ML 이 CPU 로 조용히
폴백하는데, 그때 임베딩이 달라집니다 (ANE 대비 코사인 0.995). 교차 검증
이미지 5장에서는 **1위도 상위5도 바뀌지 않았지만**, margin 이 0.01 수준이라
"허용 가능"이지 "증명됨"은 아닙니다. 실사진으로 재확인이 필요합니다.

### 직접 재보기 — 실기기 측정용

```bash
cd packages/SnapActKit
swift run -c release MemProbe ane CrossValidation/images/square.png
swift run -c release MemProbe all CrossValidation/images/square.png   # 비교
```

**릴리즈 빌드가 중요합니다** — 디버그 바이너리는 자체 오버헤드가 커서 비교를
흐립니다. 위 수치는 macOS 호스트 기준이고, **익스텐션 반입 결정은 실기기에서
같은 도구를 돌린 값으로 하셔야 합니다.**

컴퓨트 유닛 간 임베딩 비교:

```bash
DUMP_VECTOR=1 swift run -c release MemProbe ane <이미지> 
DUMP_VECTOR=1 swift run -c release MemProbe cpu <이미지>
```

## 4-2. 실사진 분류 성능 (662장 실측)

`spikes/s3-l1-vision-classifier/data_real` 로 측정했습니다. 재실행:

```bash
.venv/bin/python packages/SnapActKit/tools/eval_router.py \
    spikes/s3-l1-vision-classifier/data_real
```

| 라벨 | 장수 | 1위 정답 | 비고 |
|---|---|---|---|
| `business_card` | 55 | **74.5%** | 상위5 안에는 **100%** |
| `receipt` | 262 | 48.9% | `bill_invoice` 포함하면 **85.9%** |
| `other` (일반사진) | 250 | — | **74.8%** 가 네거티브로 감 (거부가 정답) |
| `payment_card` | 51 | — | **94.1%** 네거티브. `business_card` 오분류 **0장** |
| `passport` | 44 | — | 75.0% 네거티브. `business_card` 오분류 1장 |

`receipt` 의 48.9% 는 낮아 보이지만 37% 가 `bill_invoice` 로 갔고, 이 쌍은
**이미지로는 원리적으로 구분이 안 되는** 조합입니다 (9단계 OCR 중재 대상).
"영수증류 문서"로 보면 85.9% 입니다.

`payment_card → business_card` 가 **0/51** 인 것이 가장 중요합니다. 스펙 A-7 이
최우선 혼동쌍으로 지목한 조합인데 실사진에서는 깨끗합니다.

**다만 Tier 0 사진의 25%(여권)·6%(카드)가 서비스 클래스로 갑니다.** 라우터가
우연히 막아주는 것에 기대면 안 되고, 차단 게이트가 할 일입니다.

## 4-3. 임계값 근거 (실측)

```
minScore   액션대상 통과   일반사진 거부
   0.20        100.0%         95.2%
   0.22         98.7%         99.2%   ← 분리가 가장 깨끗
   0.24         92.7%         99.6%
   0.26         77.0%        100.0%
```

margin 은 분포가 겹쳐 분리력이 거의 없습니다 (0.010 에서 통과 71% / 거부 42%).
높게 잡으면 정답까지 같이 버립니다.

**아직 `routing_config.json` 에 넣지 않았습니다.** 채우는 것은 직접 하시는 걸로
되어 있고, 위 데이터는 합성이 아닌 실사진이지만 `business_card`·`receipt`·일반사진
세 종류뿐이라 37개 클래스 전체를 대표하지는 않습니다.

## 5. 클래스 간 유사도

`class_embeddings.json` 의 클래스 간 코사인 실측 — **가까울수록 헷갈립니다**:

| 쌍 | 코사인 |
|---|---|
| `neg_screenshot_other` ↔ `profile_screenshot` | 0.904 |
| `business_card` ↔ `neg_card_other` | 0.892 |
| `gift_card_voucher` ↔ `neg_card_other` | 0.888 |
| `chat_screenshot` ↔ `profile_screenshot` | 0.887 |
| `receipt` ↔ `bill_invoice` | 0.860 |

`business_card ↔ neg_card_other` (명함 vs 회원·교통카드) 가 최우선 과제이고,
`receipt ↔ bill_invoice` 는 **이미지로는 원리적으로 구분이 안 됩니다** — 날짜가
과거면 영수증, 미래이고 계좌번호가 있으면 고지서라서 OCR 중재가 필요합니다
(9단계).

이 수치는 7단계에서 임계값을 정할 때 근거가 됩니다. 지금 임계값을 추측해서
넣어두지 않은 이유이기도 합니다.

---

## 6. 문제가 생기면

| 증상 | 원인 |
|---|---|
| `swift: command not found` 계열 | Xcode 26 미설치. `make doctor` 로 확인 |
| `actions.json 이 없습니다` | `make catalog` 실행 |
| `루트 .venv 가 없습니다` | 리포 루트에서 `make setup` |
| 컴파일 가드만 실패 | `.build` 가 오래됐을 수 있습니다. `make clean && make test` |
