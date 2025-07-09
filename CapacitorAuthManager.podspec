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
  s.ios.deployment_target  = '13.0'
  s.swift_version = '5.9'
  s.dependency 'Capacitor'
  
  # Auth Provider Dependencies
  s.dependency 'GoogleSignIn', '~> 7.0'
  s.dependency 'FBSDKLoginKit', '~> 17.0'
  
  # Apple Sign In is built into iOS
  
  # Microsoft Authentication Library
  s.dependency 'MSAL', '~> 1.5'
  
  # Firebase Auth (optional, can be added when needed)
  # s.dependency 'Firebase/Auth'
  
  s.static_framework = true
  
  # Required for Google Sign In
  s.pod_target_xcconfig = {
    'SWIFT_OBJC_BRIDGING_HEADER' => '$(PODS_TARGET_SRCROOT)/ios/Plugin/Plugin-Bridging-Header.h'
  }
end