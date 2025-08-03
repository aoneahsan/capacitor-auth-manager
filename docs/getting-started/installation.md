# Installation

This guide will walk you through installing and setting up Capacitor Auth Manager in your project.

## Prerequisites

Before installing Capacitor Auth Manager, ensure you have:

- Node.js 16.x or higher
- Capacitor 5.x or higher installed in your project
- iOS 13.0+ for iOS deployment
- Android 6.0 (API 23)+ for Android deployment

## Installation

### Using npm

```bash
npm install capacitor-auth-manager
npx cap sync
```

### Using yarn

```bash
yarn add capacitor-auth-manager
npx cap sync
```

## Platform Setup

After installation, you need to configure each platform:

### iOS Setup

1. **Update your `Info.plist`** file to include URL schemes for OAuth providers:

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
    <!-- Facebook -->
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>fb{your-app-id}</string>
        </array>
    </dict>
    <!-- Add other providers as needed -->
</array>
```

2. **Configure LSApplicationQueriesSchemes** for social providers:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>fbapi</string>
    <string>fb-messenger-share-api</string>
    <string>fbauth2</string>
    <string>linkedin</string>
    <string>linkedinauth</string>
</array>
```

3. **Enable Keychain Sharing** (for secure token storage):
   - Open your project in Xcode
   - Select your app target
   - Go to "Signing & Capabilities"
   - Add "Keychain Sharing" capability

### Android Setup

1. **Update `android/app/build.gradle`**:

```gradle
dependencies {
    implementation 'capacitor-auth-manager:latest'

    // Add provider-specific dependencies
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    implementation 'com.facebook.android:facebook-login:latest.release'
    // Add others as needed
}
```

2. **Configure `AndroidManifest.xml`**:

```xml
<!-- Add inside <application> tag -->

<!-- Facebook -->
<meta-data
    android:name="com.facebook.sdk.ApplicationId"
    android:value="@string/facebook_app_id" />

<!-- Add OAuth redirect activities -->
<activity
    android:name="com.aoneahsan.capacitor_auth_manager.oauth.OAuthRedirectActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <!-- Add your OAuth redirect schemes -->
        <data android:scheme="YOUR_APP_SCHEME" />
    </intent-filter>
</activity>
```

3. **Add to `strings.xml`**:

```xml
<resources>
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="google_web_client_id">YOUR_GOOGLE_WEB_CLIENT_ID</string>
    <!-- Add other provider IDs -->
</resources>
```

### Web Setup

For web platform, include the provider SDKs in your HTML:

```html
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

<!-- Add other provider SDKs as needed -->
```

## Configuration

Create a configuration file for your authentication providers:

```typescript
// auth.config.ts
import { CapacitorAuthManager } from 'capacitor-auth-manager';

export const authConfig = {
  providers: {
    google: {
      webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    },
    apple: {
      clientId: 'YOUR_APPLE_CLIENT_ID',
      redirectURI: 'YOUR_REDIRECT_URI',
      scopes: ['name', 'email'],
    },
    facebook: {
      appId: 'YOUR_FACEBOOK_APP_ID',
      permissions: ['public_profile', 'email'],
    },
    microsoft: {
      clientId: 'YOUR_MICROSOFT_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
      scopes: ['openid', 'profile', 'email'],
    },
    github: {
      clientId: 'YOUR_GITHUB_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
      scopes: ['read:user', 'user:email'],
    },
    firebase: {
      apiKey: 'YOUR_FIREBASE_API_KEY',
      authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
    },
  },
};

// Initialize the plugin
CapacitorAuthManager.initialize(authConfig);
```

## Verification

To verify your installation:

```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

// Check if the plugin is available
const isAvailable = await CapacitorAuthManager.isAvailable();
console.log('Auth Manager available:', isAvailable);

// Get supported providers
const providers = await CapacitorAuthManager.getSupportedProviders();
console.log('Supported providers:', providers);
```

## Next Steps

- Check out the [Quick Start Guide](./quick-start.md) for basic usage
- Learn about [Platform-specific Setup](./platform-setup.md) for detailed configuration
- Explore [Provider Configuration](./configuration.md) for each authentication method

## Troubleshooting

### Common Issues

1. **"Plugin not implemented" error**
   - Run `npx cap sync` after installation
   - Rebuild your native apps

2. **OAuth redirect not working**
   - Verify URL schemes are correctly configured
   - Check redirect URIs match your provider configuration

3. **Provider SDK not found**
   - Ensure all required SDKs are included
   - Check platform-specific dependencies

For more help, see our [Troubleshooting Guide](../migration/troubleshooting.md) or [open an issue](https://github.com/aoneahsan/capacitor-auth-manager/issues).

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community
