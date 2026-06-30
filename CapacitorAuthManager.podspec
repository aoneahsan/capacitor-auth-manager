require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CapacitorAuthManager'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '14.0'
  s.swift_version = '5.9'
  s.dependency 'Capacitor'

  # Google Sign-In — the only enabled provider as of 2.4.x (Firebase-agnostic). Pure-Swift SDK,
  # no Objective-C bridging header required.
  s.dependency 'GoogleSignIn', '~> 7.1'

  # NOTE: Google-first build. The Facebook (FBSDKLoginKit) and Microsoft (MSAL) pod dependencies were
  # removed so this plugin no longer pulls heavy auth SDKs into every consumer app. Those providers'
  # Swift lives in ios/disabled-native-providers/ (not compiled, not shipped). Re-add a dependency here
  # when its provider is re-enabled.

  s.static_framework = true
end