#!/usr/bin/env python3
"""Checks that the iOS pod actually picked up the package's sources.

This failure mode is silent, which is the only reason the check exists.
CocoaPods ignores file patterns that escape the pod root — without an error,
without a warning — so a podspec with the wrong relative path installs
cleanly and produces a pod containing nothing. `pod install` prints
"Installing SnapActKit" either way. Confirmed by breaking it on purpose: with
`s.source_files = '../Sources/**/*.swift'` the install succeeds and every
one of the 30 files is gone.

Nobody is going to count files in a pbxproj by hand after every pod install,
so this counts them.
"""
import sys
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent
REPO = PACKAGE.parent.parent
PBXPROJ = REPO / "apps/expo/ios/Pods/Pods.xcodeproj/project.pbxproj"
SOURCES = PACKAGE / "Sources/SnapActKit"
# AppKit, and @Observable would raise the floor to iOS 17. Excluded by the
# podspec on purpose, so its absence is correct rather than a miss.
EXCLUDED_DIR = "DebugUI"


def main() -> int:
    if not PBXPROJ.exists():
        print("건너뜀: apps/expo/ios 가 없습니다 (prebuild 전).")
        print(f"  확인하려면: cd {REPO / 'apps/expo'} && npx expo prebuild -p ios --no-install"
              " && cd ios && pod install")
        return 0

    pbxproj = PBXPROJ.read_text()
    expected, excluded = [], []
    for path in sorted(SOURCES.rglob("*.swift")):
        (excluded if EXCLUDED_DIR in path.parts else expected).append(path.name)

    # A present file appears several times (build file, file reference, group
    # child, build phase entry); absent is exactly zero. Only the distinction
    # matters, so the count itself is not asserted.
    missing = [name for name in expected if f"{name}" not in pbxproj]
    leaked = [name for name in excluded if name in pbxproj]

    if missing:
        print(f"pod 에 패키지 소스 {len(missing)}/{len(expected)} 개가 없습니다.")
        for name in missing[:10]:
            print(f"  - {name}")
        if len(missing) > 10:
            print(f"  ... 그리고 {len(missing) - 10}개 더")
        print()
        print("  SnapActKit.podspec 의 s.source_files 가 pod root 를 벗어났을 가능성이 큽니다.")
        print("  pod root 는 podspec 이 있는 디렉터리이고, 그 밖의 패턴은 조용히 무시됩니다.")
        return 1

    if leaked:
        print(f"{EXCLUDED_DIR} 가 pod 에 들어갔습니다: {', '.join(leaked)}")
        print("  AppKit 을 import 하므로 iOS 빌드가 깨집니다. s.exclude_files 를 보세요.")
        return 1

    # The bridge is a separate pod; without it the module never registers.
    if "SnapActKitModule.swift" not in pbxproj:
        print("브리지(SnapActKitModule.swift)가 pod 에 없습니다 — JS 에서 모듈을 못 찾습니다.")
        return 1

    print(f"pod: 패키지 소스 {len(expected)}개 + 브리지 1개, "
          f"{EXCLUDED_DIR} {len(excluded)}개 제외 — 정상")
    return 0


if __name__ == "__main__":
    sys.exit(main())
