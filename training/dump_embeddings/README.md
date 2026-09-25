# 트랙 B — Vision 임베딩 덤프 (자리만 잡아둠)

`VNGenerateImageFeaturePrintRequest`는 Python에서 호출할 수 없습니다. macOS Swift CLI가
임베딩을 덤프해주면 이 디렉터리에서 경량 헤드만 학습합니다.

**아직 진행하지 않습니다.** 트랙 A(PyTorch MobileNetV3 fine-tune)가 먼저이고,
A의 정확도가 B의 성능 상한을 알려줍니다 — 백본까지 학습시켰는데도 수치가 안 나오면
고정 임베딩으로는 더 안 나오고, 그건 모델이 아니라 데이터 부족이라는 뜻입니다.

## 파트너에게 요청할 CLI 스펙

```
입력:  이미지 디렉터리 (클래스별 하위 디렉터리)
처리:  각 이미지에 VNGenerateImageFeaturePrintRequest
출력:  embeddings.npy  (N x D, float32)
       filenames.csv   (행 순서 = embeddings.npy 행 순서, 경로 + 클래스)
```

## 요청할 때 덧붙일 것

새로 짜달라고 할 필요가 없습니다. `spikes/s3-l1-vision-classifier/`의
`train.swift` / `classify_one.swift`에 Vision 호출 코드가 이미 있으므로,
**"임베딩 덤프 부분만 떼어내서 .npy로 저장"** 으로 요청하면 훨씬 빨리 받습니다.

주의: `VNImageRequestHandler.perform(_:)`은 동기 호출입니다 —
메인 큐에서 부르지 않도록 (`docs/future-plan/rules/ios-platform.md`).

## 한 번 받으면

재학습 때마다 재사용합니다. 임베딩은 백본이 고정이라 데이터가 바뀌지 않는 한
다시 뽑을 필요가 없습니다.
