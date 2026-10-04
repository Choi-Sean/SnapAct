# SnapActKit — 테스트 진입점
#
# xcode-select 가 Command Line Tools 를 가리키고 있어도 동작하도록
# DEVELOPER_DIR 을 여기서 지정합니다 (전역 설정을 바꾸지 않습니다 — sudo 불필요).
# FoundationModels 와 Swift 6 이 필요해서 CLT 툴체인으로는 빌드되지 않습니다.

DEVELOPER_DIR := /Applications/Xcode.app/Contents/Developer
SWIFT := DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcrun swift

# 카탈로그 생성기는 리포 루트의 공용 .venv 를 씁니다 (openpyxl).
REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))../..)
PY := $(REPO_ROOT)/.venv/bin/python

.PHONY: help build test run clean doctor catalog catalog-check deadlock-check pod-check

help:
	@echo "make build    패키지 빌드 (호스트 macOS)"
	@echo "make test     테스트 실행"
	@echo "make run      디버그 화면 실행 (macOS 창)"
	@echo "make catalog  엑셀 -> Resources/actions.json 재생성"
	@echo "make deadlock-check  동시 라우팅 교착 검사 (외부 타임아웃)"
	@echo "make pod-check       iOS pod 이 패키지 소스를 실제로 집었는지 확인"
	@echo "make doctor   툴체인 점검 (Xcode / Swift / SDK)"
	@echo "make clean    빌드 산출물 삭제"

# 엑셀이 actions.json 보다 새로우면 여기서 멈춘다. 스프레드시트를 고치고
# 재생성을 잊은 채 빌드하면, 코드가 아니라 데이터가 조용히 옛 것이 된다.
build: catalog-check
	$(SWIFT) build

catalog:
	$(PY) tools/build_catalog.py

catalog-check:
	@$(PY) tools/build_catalog.py --check || { \
		echo ""; echo "  'make catalog' 로 재생성한 뒤 다시 빌드하세요."; exit 1; }

test:
	$(SWIFT) test

# 창이 뜹니다. 종료는 창을 닫거나 Ctrl-C.
run:
	$(SWIFT) run SnapActDebugApp

doctor:
	@echo "호스트      : $$(sw_vers -productName) $$(sw_vers -productVersion)"
	@echo "Xcode      : $$(DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcodebuild -version | head -1)"
	@echo "Swift      : $$(DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcrun swift --version 2>/dev/null | grep -o 'Swift version [0-9.]*')"
	@printf "FoundationModels (macOS SDK): "
	@ls -d $(DEVELOPER_DIR)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks/FoundationModels.framework >/dev/null 2>&1 \
		&& echo "있음" || echo "없음 — Xcode 26 이상이 필요합니다"

# 교착은 실패가 아니라 멈춤이라 인프로세스 테스트로 잡을 수 없습니다 —
# 타임아웃 태스크 자체가 고갈된 풀을 기다리게 됩니다. 외부에서 재야 합니다.
# 수정을 되돌리면 20초 안에 끝나지 않는 것을 확인했습니다.
DEADLOCK_TIMEOUT ?= 60
DEADLOCK_CONCURRENCY ?= 32
deadlock-check:
	@$(SWIFT) build -c release --product DeadlockProbe >/dev/null
	@( $(SWIFT) run -c release DeadlockProbe $(DEADLOCK_CONCURRENCY) & \
	   pid=$$!; \
	   ( sleep $(DEADLOCK_TIMEOUT); kill -9 $$pid 2>/dev/null ) & \
	   watchdog=$$!; \
	   if wait $$pid; then kill $$watchdog 2>/dev/null; \
	   else echo "교착: 동시 $(DEADLOCK_CONCURRENCY)개가 $(DEADLOCK_TIMEOUT)초 안에 끝나지 않았습니다"; \
	        echo "  Vision 호출이 협력 스레드를 막고 있습니다 — VisionWork 참고"; exit 1; fi )

# CocoaPods 는 pod root 를 벗어나는 파일 패턴을 에러 없이 무시합니다. 그래서
# 잘못된 podspec 도 'Installing SnapActKit' 을 찍고 빈 pod 을 만듭니다.
pod-check:
	@$(PY) tools/check_pod_sources.py

clean:
	rm -rf .build
