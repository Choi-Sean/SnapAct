# SnapActKit — 테스트 진입점
#
# xcode-select 가 Command Line Tools 를 가리키고 있어도 동작하도록
# DEVELOPER_DIR 을 여기서 지정합니다 (전역 설정을 바꾸지 않습니다 — sudo 불필요).
# FoundationModels 와 Swift 6 이 필요해서 CLT 툴체인으로는 빌드되지 않습니다.

DEVELOPER_DIR := /Applications/Xcode.app/Contents/Developer
SWIFT := DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcrun swift

.PHONY: help build test clean doctor

help:
	@echo "make build    패키지 빌드 (호스트 macOS)"
	@echo "make test     테스트 실행"
	@echo "make doctor   툴체인 점검 (Xcode / Swift / SDK)"
	@echo "make clean    빌드 산출물 삭제"

build:
	$(SWIFT) build

test:
	$(SWIFT) test

doctor:
	@echo "호스트      : $$(sw_vers -productName) $$(sw_vers -productVersion)"
	@echo "Xcode      : $$(DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcodebuild -version | head -1)"
	@echo "Swift      : $$(DEVELOPER_DIR=$(DEVELOPER_DIR) /usr/bin/xcrun swift --version 2>/dev/null | grep -o 'Swift version [0-9.]*')"
	@printf "FoundationModels (macOS SDK): "
	@ls -d $(DEVELOPER_DIR)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks/FoundationModels.framework >/dev/null 2>&1 \
		&& echo "있음" || echo "없음 — Xcode 26 이상이 필요합니다"

clean:
	rm -rf .build
