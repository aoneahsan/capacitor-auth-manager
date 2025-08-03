# Platform-Specific Setup

This guide provides detailed setup instructions for each platform supported by Capacitor Auth Manager.

## iOS Setup

### Prerequisites

- Xcode 12.0 or later
- iOS 13.0 or later
- CocoaPods installed

### 1. Configure Info.plist

Add URL schemes for OAuth providers to your `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <!-- Google Sign-In -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>

    <!-- Facebook Login -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>fb{your-facebook-app-id}</string>
        </array>
    </dict>

    <!-- Microsoft Auth -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>msal{your-client-id}</string>
        </array>
    </dict>

    <!-- Custom scheme for other providers -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>your-app-scheme</string>
        </array>
    </dict>
</array>
```

### 2. Add LSApplicationQueriesSchemes

Add the following to support social login apps:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>fbapi</string>
    <string>fb-messenger-share-api</string>
    <string>fbauth2</string>
    <string>fbshareextension</string>
    <string>linkedin</string>
    <string>linkedinauth</string>
    <string>slack</string>
    <string>googlegmail</string>
    <string>googleauth</string>
    <string>microsoft-edge-https</string>
    <string>microsoft-edge-http</string>
</array>
```

### 3. Enable Keychain Sharing

1. Open your project in Xcode
2. Select your app target
3. Go to "Signing & Capabilities"
4. Click "+" to add capability
5. Add "Keychain Sharing"
6. Use your app's bundle identifier as the keychain group

### 4. Configure App Transport Security

Add the following to allow authentication redirects:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>facebook.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSThirdPartyExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
        <key>fbcdn.net</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSThirdPartyExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
        <key>akamaihd.net</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSThirdPartyExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>
```

## Android Setup

### Prerequisites

- Android Studio 4.0 or later
- Android SDK 23 or later
- Gradle 7.0 or later

### 1. Configure Application ID

Ensure your `android/app/build.gradle` has the correct application ID:

```gradle
android {
    defaultConfig {
        applicationId "com.yourcompany.yourapp"
        // ... other configuration
    }
}
```

### 2. Add Provider Dependencies

Add to `android/app/build.gradle`:

```gradle
dependencies {
    // Google Play Services
    implementation 'com.google.android.gms:play-services-auth:20.7.0'

    // Facebook SDK
    implementation 'com.facebook.android:facebook-login:16.3.0'

    // Microsoft Authentication Library
    implementation 'com.microsoft.identity.client:msal:4.8.0'

    // GitHub OAuth (if using custom implementation)
    implementation 'com.github.scribejava:scribejava-apis:8.3.1'

    // Biometric authentication
    implementation 'androidx.biometric:biometric:1.2.0-alpha05'
}
```

### 3. Configure Manifest

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application>
        <!-- Facebook App ID -->
        <meta-data
            android:name="com.facebook.sdk.ApplicationId"
            android:value="@string/facebook_app_id" />

        <!-- Google Play Services -->
        <meta-data
            android:name="com.google.android.gms.version"
            android:value="@integer/google_play_services_version" />

        <!-- OAuth Redirect Activities -->
        <activity
            android:name="com.aoneahsan.capacitor_auth_manager.oauth.OAuthRedirectActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />

                <!-- Add your OAuth redirect schemes -->
                <data android:scheme="your-app-scheme" />
            </intent-filter>
        </activity>

        <!-- Microsoft Auth -->
        <activity
            android:name="com.microsoft.identity.client.BrowserTabActivity">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="msal{your-client-id}"
                    android:host="auth" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### 4. Configure Strings

Add to `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <!-- Facebook -->
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="facebook_client_token">YOUR_FACEBOOK_CLIENT_TOKEN</string>

    <!-- Google -->
    <string name="google_web_client_id">YOUR_GOOGLE_WEB_CLIENT_ID</string>
    <string name="google_android_client_id">YOUR_GOOGLE_ANDROID_CLIENT_ID</string>

    <!-- Microsoft -->
    <string name="microsoft_client_id">YOUR_MICROSOFT_CLIENT_ID</string>

    <!-- GitHub -->
    <string name="github_client_id">YOUR_GITHUB_CLIENT_ID</string>

    <!-- Custom redirect URI -->
    <string name="auth_redirect_uri">your-app-scheme://auth</string>
</resources>
```

### 5. Configure Proguard

Add to `android/app/proguard-rules.pro`:

```pro
# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Facebook SDK
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**

# Microsoft MSAL
-keep class com.microsoft.identity.** { *; }
-dontwarn com.microsoft.identity.**

# Auth Manager Plugin
-keep class com.aoneahsan.capacitor_auth_manager.** { *; }

# Biometric
-keep class androidx.biometric.** { *; }
```

### 6. SHA-1 Fingerprint Setup

For Google and Facebook authentication, you need to add your SHA-1 fingerprint:

```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore /path/to/your/release.keystore -alias your-alias
```

Add the SHA-1 fingerprint to:

- Google Cloud Console (OAuth 2.0 credentials)
- Facebook Developer Console (Android app settings)

## Web Setup

### Prerequisites

- Modern web browser (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)
- HTTPS enabled (required for most OAuth providers)

### 1. Include Provider SDKs

Add to your `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Google Sign-In -->
    <script
      src="https://accounts.google.com/gsi/client"
      async
      defer
    ></script>

    <!-- Facebook SDK -->
    <script
      async
      defer
      crossorigin="anonymous"
      src="https://connect.facebook.net/en_US/sdk.js"
    ></script>

    <!-- Microsoft Identity -->
    <script src="https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js"></script>

    <!-- GitHub OAuth (if using custom implementation) -->
    <script src="https://unpkg.com/github-api@3.4.0/dist/GitHub.bundle.min.js"></script>
  </head>
  <body>
    <!-- Your app content -->
  </body>
</html>
```

### 2. Configure HTTPS

For production, ensure your site is served over HTTPS:

```javascript
// Development only - not for production
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(
    `https:${location.href.substring(location.protocol.length)}`
  );
}
```

### 3. Configure CORS

Ensure your server allows requests from OAuth providers:

```javascript
// Express.js example
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});
```

### 4. Configure Content Security Policy

Add to your HTML head:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval'
        https://accounts.google.com
        https://connect.facebook.net
        https://alcdn.msauth.net
        https://unpkg.com;
    connect-src 'self'
        https://accounts.google.com
        https://graph.facebook.com
        https://login.microsoftonline.com
        https://api.github.com;
    frame-src
        https://accounts.google.com
        https://login.microsoftonline.com
        https://www.facebook.com;
    img-src 'self' data:
        https://graph.facebook.com
        https://avatars.githubusercontent.com;
"
/>
```

## Environment Variables

### Development (.env.local)

```env
REACT_APP_GOOGLE_CLIENT_ID=your-dev-google-client-id
REACT_APP_APPLE_CLIENT_ID=your-dev-apple-client-id
REACT_APP_FACEBOOK_APP_ID=your-dev-facebook-app-id
REACT_APP_MICROSOFT_CLIENT_ID=your-dev-microsoft-client-id
REACT_APP_GITHUB_CLIENT_ID=your-dev-github-client-id
```

### Production (.env.production)

```env
REACT_APP_GOOGLE_CLIENT_ID=your-prod-google-client-id
REACT_APP_APPLE_CLIENT_ID=your-prod-apple-client-id
REACT_APP_FACEBOOK_APP_ID=your-prod-facebook-app-id
REACT_APP_MICROSOFT_CLIENT_ID=your-prod-microsoft-client-id
REACT_APP_GITHUB_CLIENT_ID=your-prod-github-client-id
```

## Testing Configuration

### iOS Simulator

- Sign in may not work with Apple ID in simulator
- Use physical device for full testing
- Biometric authentication requires physical device

### Android Emulator

- Ensure Google Play Services are installed
- Use emulator with Google APIs
- Some providers require physical device

### Web Development

- Use localhost for development
- Most providers support localhost for testing
- Some features require HTTPS even in development

## Troubleshooting

### Common Issues

1. **"Invalid Client ID"**
   - Verify client ID matches provider configuration
   - Check bundle ID/package name matches registration

2. **"Redirect URI Mismatch"**
   - Ensure redirect URIs are properly configured
   - Check URL schemes match exactly

3. **"Network Error"**
   - Verify internet connection
   - Check firewall settings
   - Ensure CORS is properly configured

4. **"Provider Not Available"**
   - Check if provider is supported on current platform
   - Verify SDK is properly loaded

### Debug Commands

```bash
# Check Android package
adb shell pm list packages | grep your.package.name

# Check iOS bundle
ios-deploy --list_bundle_id

# Check web console
# Open browser developer tools and check network tab
```

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community
