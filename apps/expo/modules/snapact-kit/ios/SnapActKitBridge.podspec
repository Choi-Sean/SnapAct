Pod::Spec.new do |s|
  s.name           = 'SnapActKitBridge'
  s.version        = '1.0.0'
  s.summary        = 'Expo module exposing SnapActKit to JS'
  s.description    = <<~DESC
    Thin bridge: converts a photo URI into the ranked-action breakdown and
    records which button was tapped. All the work lives in the SnapActKit pod.
  DESC
  s.author         = 'SnapAct'
  s.homepage       = 'https://github.com/Choi-Sean/SnapAct'
  s.license        = { :type => 'Proprietary' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # packages/SnapActKit/SnapActKit.podspec. Resolved because
  # ../expo-module.config.json lists it in podspecPath, so Expo's autolinking
  # adds it to the Podfile with its real path — a podspec cannot express a
  # local path dependency on its own.
  s.dependency 'SnapActKit'

  # Just the bridge. The package's sources are NOT vendored here: CocoaPods
  # ignores file patterns that escape the pod root, which made the earlier
  # `../../../../../packages/...` glob compile to nothing at all.
  s.source_files = '*.swift'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
