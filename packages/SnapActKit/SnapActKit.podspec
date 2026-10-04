#
# The same sources as Package.swift, built as a pod.
#
# Why both: Expo's prebuild uses CocoaPods, and CocoaPods cannot depend on a
# local SwiftPM package. The first attempt vendored these sources into the
# Expo module's pod with a `../../../../../packages/...` glob — CocoaPods
# silently ignores file patterns that escape the pod root, so the pod built
# with the bridge file and NOTHING else. A podspec that lives here, where the
# pod root IS the package, is what makes the globs resolve.
#
# apps/expo/modules/snapact-kit/expo-module.config.json points Expo's
# autolinking at this file, and the bridge pod depends on this one, so
# `import SnapActKit` is a real module boundary rather than a flattened copy.
#
# Package.swift remains the source of truth for macOS: tests, the debug
# screen and the evaluators run through it.
Pod::Spec.new do |s|
  s.name           = 'SnapActKit'
  s.version        = '1.0.0'
  s.summary        = 'Photo -> category -> ranked actions, on-device'
  s.description    = <<~DESC
    CLIP zero-shot routing, Vision OCR, candidate generation from the action
    catalog, and Bayesian-counter ranking. No network, by construction.
  DESC
  s.author         = 'SnapAct'
  s.homepage       = 'https://github.com/Choi-Sean/SnapAct'
  s.license        = { :type => 'Proprietary' }
  # 16.4, matching ExpoModulesCore. A pod may not demand MORE than the app
  # target (the generated Podfile pins 16.4) or `pod install` refuses the
  # whole project. FoundationModels (26) and MLComputePlan (17.4) are gated
  # inside the sources; routing, OCR and ranking build against 16.4, which
  # was verified by typechecking every file at that target.
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.source_files = 'Sources/SnapActKit/**/*.swift'
  # DebugUI is the macOS reviewer: AppKit, plus @Observable would drag the
  # floor to iOS 17. The app's review surface is the RN screen instead.
  s.exclude_files = 'Sources/SnapActKit/DebugUI/*.swift'

  # Flat into the app bundle, which is where ResourceBundle looks first after
  # Bundle.module. .mlpackage is a DIRECTORY and has to arrive intact for
  # MLModel.compileModel(at:) — listing it as one resource keeps it whole.
  s.resources = [
    'Sources/SnapActKit/Resources/*.json',
    'Sources/SnapActKit/Resources/mobileclip_s0_image.mlpackage',
  ]

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
