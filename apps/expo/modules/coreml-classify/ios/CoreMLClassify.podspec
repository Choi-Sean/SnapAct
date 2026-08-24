Pod::Spec.new do |s|
  s.name           = 'CoreMLClassify'
  s.version        = '1.0.0'
  s.summary        = 'On-device Core ML L1 vision classifier (Tier-0 blocking gate)'
  s.description    = 'Runs the S3 L1 classifier on-device and returns class probabilities to JS.'
  s.author         = 'SnapAct'
  s.homepage       = 'https://github.com/albc99/SnapAct'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift alongside this podspec; bundle the raw model as a resource (compiled at runtime).
  s.source_files = '*.swift'
  s.resources    = ['L1Classifier.mlmodel']

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
