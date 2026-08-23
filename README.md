# SnapAct — Demo

사진 한 장 → 분석 → 연락처/캘린더 자동 저장. 데모 버전은 API 키 없이도 목업(mock) 데이터로 전체 플로우를 테스트할 수 있게 만들어져 있습니다.

```
backend/         FastAPI 서버 (Google Vision 1차 분류 → Claude 심화 분석 → JSON 반환)
apps/expo/       Expo(React Native) 메인 앱 (사진 선택/촬영 → 업로드 → 결과 표시 → 연락처/캘린더 저장)
apps/ios/        iOS 네이티브 Share Extension (Swift, RN 없음 — 공유 시트 파이프라인 전체)
```

## 1. 백엔드 실행 (로컬)

```bash
cd backend
python -m venv venv
./venv/Scripts/pip install -r requirements.txt   # Windows
source venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
./venv/Scripts/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`http://localhost:8000/health` 로 접속해 `{"status":"ok", ...}` 가 뜨면 정상입니다.

API 키(`ANTHROPIC_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`)가 없으면 자동으로 **데모(mock) 모드**로 동작합니다 — `/analyze?mock_category=business_card|receipt|event_flyer` 로 원하는 시나리오를 강제 지정할 수 있습니다. 앱 화면에서도 같은 선택지를 칩 버튼으로 고를 수 있습니다.

키가 준비되면 `backend/.env.example`을 `backend/.env`로 복사해서 값을 채워 넣으세요. 그러면 실제 Google Vision + Claude 분석으로 전환됩니다.

## 2. Railway 배포

1. Railway 프로젝트를 만들고 이 저장소의 `backend/` 를 루트로 지정해 배포 (Root Directory: `backend`).
2. Railway 대시보드 → Variables에 `ANTHROPIC_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`(또는 서비스 계정 JSON을 파일로 마운트하는 방식) 설정.
3. `backend/railway.toml`에 빌드/시작 커맨드가 이미 정의되어 있어 별도 설정 없이 배포됩니다.
4. 배포 후 발급되는 URL(`https://xxx.up.railway.app`)을 `apps/expo/src/config.ts`의 `API_BASE_URL`에 넣으세요.

## 3. 모바일 앱 실행 (Expo Go)

```bash
cd apps/expo
npm install   # 이미 설치되어 있다면 생략
npx expo start
```

- 휴대폰에 **Expo Go** 앱 설치 후 터미널에 뜨는 QR코드를 스캔.
- 로컬 백엔드로 테스트하려면 `apps/expo/src/config.ts`의 `API_BASE_URL`을 **PC의 LAN IP**로 맞춰주세요 (휴대폰과 PC가 같은 Wi-Fi여야 함). 현재 PC IP 기준으로 `http://10.0.0.244:8000` 이 기본값으로 들어가 있습니다. IP가 바뀌면 `ipconfig`(Windows)로 다시 확인해서 수정하세요.
- Railway에 배포한 뒤에는 해당 URL로 바꾸면 Wi-Fi와 무관하게 동작합니다.

### 앱에서 할 수 있는 것
1. 카메라로 촬영하거나 갤러리에서 사진 선택
2. "분석하기" → 백엔드가 분류 + 구조화된 정보 추출
3. 결과에 따라 "연락처에 저장" / "캘린더에 저장" 버튼이 나타나고, 누르면 **실제 기기의 연락처 앱 / 캘린더 앱에 저장**됩니다 (expo-contacts / expo-calendar, 권한 요청 포함).

## 4. 알려진 제약

- **Share Extension(iOS)**: `apps/ios/ShareExtension/` — Swift 네이티브, RN 없이 파이프라인 전체(OCR/분류/추출)가 독립 실행됩니다. Xcode/EAS Build로만 빌드 가능(Expo Go 불가), 로컬에서 컴파일·디버깅하려면 macOS(또는 원격 Mac)가 필요합니다.
- **Share Intent(Android)**: `apps/expo/`에서 `expo-share-intent`로 처리 — RN 앱으로 진입해 Layer 0(온디바이스)/Layer 1(서버) 순으로 분석합니다.
- 영수증/문서 분류는 현재 "note" 액션으로만 분류되고 실제 Notes 앱 저장 연동은 아직 없습니다 (iOS/Android 모두 Notes 앱에 프로그래밍적으로 쓰는 공식 API가 마땅치 않아서, 텍스트 공유(Share Sheet)로 우회하는 방식을 검토해야 합니다).
- Google Vision 분류 로직은 라벨/텍스트 키워드 기반의 단순 휴리스틱입니다. 실제 키를 넣고 테스트하면서 튜닝이 필요합니다.
