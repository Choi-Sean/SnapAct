# CrossValidation/

Python 과 Swift 가 같은 사진에서 같은 임베딩을 내는지 확인하기 위한 자료입니다.

| | |
|---|---|
| `images/*.png` | 결정론적으로 생성된 테스트 이미지 5장. 종횡비를 일부러 다양하게 |
| `reference.json` | Python 이 뽑은 임베딩 (정규화 완료) + 이미지별 sha256 |

`swift test` 는 Python 을 실행하지 않습니다. 커밋된 `reference.json` 과 비교만
하고, 이미지 파일의 sha256 이 기준값 생성 시점과 같은지도 확인합니다 — 파일이
바뀌었는데 기준값이 그대로면 비교가 무의미하기 때문입니다.

## 왜 필요한가

`class_embeddings.json` 은 Python 파이프라인으로 만들어졌습니다. Swift 가 사진을
다르게 전처리하면 이미지 임베딩이 **조용히 다른 공간에 놓입니다.** 에러는 나지
않고 코사인 점수만 나빠지므로 사후에 원인을 찾기가 매우 어렵습니다.

전처리 계약:

```
RGB 변환 → 256×256 스쿼시(종횡비 보존 없음) → Swift 쪽 정규화 없음
```

마지막 항목이 특히 중요합니다. `.mlpackage` 입력이 imageType 이라 스케일링이
그래프 안에 있습니다 (`image` 직후 첫 연산이 `× 0.00392156886` = 1/255).

## 기준값 재생성

인코더나 이미지를 바꿨다면:

```bash
.venv/bin/python packages/SnapActKit/tools/crossvalidate.py
.venv/bin/python packages/SnapActKit/tools/crossvalidate.py --show   # 요약만
```

텍스트 인코더는 필요 없습니다 (이미지 인코더만 씁니다).
