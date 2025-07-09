# Capacitor Auth Manager

A comprehensive authentication plugin for Capacitor that provides secure, type-safe, and framework-independent authentication implementations across Android, iOS, and Web platforms.

## Features

- 🔐 **13+ Authentication Providers**: Google, Apple, Microsoft, Facebook, GitHub, Slack, LinkedIn, Firebase, Email Magic Link, SMS, Email/Phone/Username + Password, Email Code, and Biometric Auth
- 📱 **Cross-Platform**: Works seamlessly on iOS, Android, and Web
- 🔄 **Subscribable Auth State**: Real-time authentication state updates
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🏗️ **Framework Independent**: Works with any JavaScript framework
- 🔒 **Secure**: Uses only official SDKs and follows security best practices
- ⚡ **Performant**: Optimized for minimal overhead and fast authentication flows
- 🔧 **Highly Configurable**: Each provider can be configured with all available options

## Installation

```bash
npm install capacitor-auth-manager
npx cap sync
```

## Quick Start

```typescript
import { CapacitorAuthManager, AuthProvider } from 'capacitor-auth-manager';

// Initialize the auth manager
await CapacitorAuthManager.initialize({
  providers: [
    {
      provider: AuthProvider.GOOGLE,
      options: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        scopes: ['email', 'profile']
      }
    },
    {
      provider: AuthProvider.APPLE,
      options: {
        clientId: 'YOUR_APPLE_CLIENT_ID',
        redirectUri: 'YOUR_REDIRECT_URI'
      }
    }
  ],
  persistence: 'local', // 'local' | 'session' | 'none'
  autoRefreshToken: true,
  enableLogging: true
});

// Sign in with Google
const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.GOOGLE
});

console.log('Signed in user:', result.user);

// Listen to auth state changes
const listener = await CapacitorAuthManager.addAuthStateListener((user) => {
  console.log('Auth state changed:', user);
});

// Sign out
await CapacitorAuthManager.signOut();
```

## Configuration

### Platform-Specific Setup

#### iOS Setup

1. Add required capabilities in Xcode:
   - Sign in with Apple (if using Apple Auth)
   - Keychain Sharing (for secure credential storage)

2. Update your `Info.plist`:
```xml
<!-- For Google Sign-In -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>

<!-- For Facebook Login -->
<key>FacebookAppID</key>
<string>YOUR_FACEBOOK_APP_ID</string>
<key>FacebookClientToken</key>
<string>YOUR_FACEBOOK_CLIENT_TOKEN</string>
<key>FacebookDisplayName</key>
<string>YOUR_APP_NAME</string>

<!-- For OAuth redirects -->
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
```

#### Android Setup

1. Add to your `android/app/build.gradle`:
```gradle
android {
  defaultConfig {
    manifestPlaceholders = [
      appAuthRedirectScheme: 'com.yourcompany.yourapp'
    ]
  }
}
```

2. Update your `AndroidManifest.xml`:
```xml
<!-- For Google Sign-In -->
<meta-data
  android:name="com.google.android.gms.auth.api.signin.GoogleSignInOptions"
  android:value="@string/default_web_client_id" />

<!-- For Facebook Login -->
<meta-data 
  android:name="com.facebook.sdk.ApplicationId" 
  android:value="@string/facebook_app_id"/>
<meta-data 
  android:name="com.facebook.sdk.ClientToken" 
  android:value="@string/facebook_client_token"/>
```

#### Web Setup

For web platform, make sure your redirect URIs are properly configured in each provider's console:

- **Google**: Add your domain to authorized JavaScript origins
- **Apple**: Configure your Service ID with proper domains and redirect URLs
- **Facebook**: Add your domain to valid OAuth redirect URIs
- **Microsoft**: Configure redirect URIs in Azure AD

## Authentication Providers

### Google Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.GOOGLE,
    options: {
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      scopes: ['email', 'profile'],
      serverClientId: 'YOUR_SERVER_CLIENT_ID', // For Android
      offlineAccess: true, // To get refresh token
      hostedDomain: 'yourdomain.com', // Restrict to domain
      forceCodeForRefreshToken: true
    }
  }]
});

const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.GOOGLE,
  options: {
    loginHint: 'user@example.com', // Pre-fill email
    prompt: 'select_account' // Force account selection
  }
});
```

### Apple Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.APPLE,
    options: {
      clientId: 'YOUR_SERVICE_ID',
      redirectUri: 'https://yourapp.com/auth/callback',
      scopes: [AppleAuthScope.EMAIL, AppleAuthScope.NAME],
      usePopup: true,
      state: 'YOUR_STATE', // Optional state parameter
      nonce: 'YOUR_NONCE' // Optional nonce for security
    }
  }]
});

const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.APPLE
});
```

### Microsoft Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.MICROSOFT,
    options: {
      clientId: 'YOUR_AZURE_CLIENT_ID',
      tenantId: 'YOUR_TENANT_ID', // or 'common' for multi-tenant
      redirectUri: 'https://yourapp.com/auth/callback',
      scopes: ['openid', 'profile', 'email'],
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID'
    }
  }]
});
```

### Firebase Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.FIREBASE,
    options: {
      apiKey: 'YOUR_FIREBASE_API_KEY',
      authDomain: 'your-app.firebaseapp.com',
      projectId: 'your-project-id',
      storageBucket: 'your-app.appspot.com',
      messagingSenderId: 'YOUR_SENDER_ID',
      appId: 'YOUR_APP_ID'
    }
  }]
});
```

### Email/Password Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.EMAIL_PASSWORD,
    options: {
      strengthRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true
      },
      allowPasswordReset: true,
      requireEmailVerification: true
    }
  }]
});

// Sign up
const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.EMAIL_PASSWORD,
  credentials: {
    email: 'user@example.com',
    password: 'SecurePassword123!'
  }
});

// Password reset
await CapacitorAuthManager.sendPasswordResetEmail({
  email: 'user@example.com'
});
```

### SMS Authentication

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.SMS,
    options: {
      provider: 'twilio', // or 'firebase', 'custom'
      twilioConfig: {
        accountSid: 'YOUR_ACCOUNT_SID',
        authToken: 'YOUR_AUTH_TOKEN',
        fromNumber: '+1234567890'
      },
      codeLength: 6,
      codeExpiration: 300000, // 5 minutes
      maxAttempts: 3
    }
  }]
});

// Send SMS code
await CapacitorAuthManager.sendSmsCode({
  phoneNumber: '+1234567890'
});

// Verify SMS code
const result = await CapacitorAuthManager.verifySmsCode({
  phoneNumber: '+1234567890',
  code: '123456'
});
```

### Biometric Authentication

Note: For biometric authentication, this plugin integrates with [capacitor-biometric-authentication](https://www.npmjs.com/package/capacitor-biometric-authentication).

```typescript
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.BIOMETRIC,
    options: {
      fallbackToPasscode: true,
      title: 'Authenticate',
      subtitle: 'Use your biometric to sign in',
      description: 'Place your finger on the sensor',
      negativeButtonText: 'Cancel',
      maxAttempts: 3
    }
  }]
});

const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.BIOMETRIC
});
```

## API Reference

### Core Methods

#### initialize(options)
Initializes the auth manager with provider configurations.

```typescript
interface AuthManagerInitOptions {
  providers: AuthProviderConfig[];
  persistence?: 'local' | 'session' | 'none';
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number; // ms before token expiry
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

#### signIn(options)
Signs in a user with the specified provider.

```typescript
interface SignInOptions {
  provider: AuthProvider;
  credentials?: AuthCredentials;
  options?: SignInProviderOptions;
}
```

#### signOut(options?)
Signs out the current user or a specific provider.

```typescript
interface SignOutOptions {
  provider?: AuthProvider;
  revokeToken?: boolean;
  clearCache?: boolean;
  redirectUrl?: string;
}
```

#### getCurrentUser()
Returns the currently authenticated user.

```typescript
const user = await CapacitorAuthManager.getCurrentUser();
```

#### addAuthStateListener(callback)
Subscribes to authentication state changes.

```typescript
const listener = await CapacitorAuthManager.addAuthStateListener((user) => {
  if (user) {
    console.log('User signed in:', user);
  } else {
    console.log('User signed out');
  }
});

// Remove listener
await listener.remove();
```

#### refreshToken(options?)
Manually refreshes the authentication token.

```typescript
const result = await CapacitorAuthManager.refreshToken({
  provider: AuthProvider.GOOGLE,
  forceRefresh: true
});
```

### Account Management

#### linkAccount(options)
Links an additional authentication provider to the current user.

```typescript
await CapacitorAuthManager.linkAccount({
  provider: AuthProvider.GOOGLE
});
```

#### unlinkAccount(options)
Unlinks an authentication provider from the current user.

```typescript
await CapacitorAuthManager.unlinkAccount({
  provider: AuthProvider.GOOGLE
});
```

#### updateProfile(options)
Updates the user's profile information.

```typescript
await CapacitorAuthManager.updateProfile({
  displayName: 'John Doe',
  photoURL: 'https://example.com/photo.jpg'
});
```

#### deleteAccount(options?)
Deletes the current user's account.

```typescript
await CapacitorAuthManager.deleteAccount({
  requireReauthentication: true
});
```

### Utility Methods

#### isSupported(options)
Checks if a provider is supported on the current platform.

```typescript
const result = await CapacitorAuthManager.isSupported({
  provider: AuthProvider.APPLE
});

if (result.isSupported) {
  // Provider is available
}
```

#### getIdToken(options?)
Gets the current ID token for the authenticated user.

```typescript
const token = await CapacitorAuthManager.getIdToken({
  forceRefresh: true
});
```

## Error Handling

The plugin provides detailed error codes for different scenarios:

```typescript
try {
  await CapacitorAuthManager.signIn({
    provider: AuthProvider.GOOGLE
  });
} catch (error) {
  switch (error.code) {
    case 'auth/user-cancelled':
      // User cancelled the sign-in flow
      break;
    case 'auth/network-error':
      // Network error occurred
      break;
    case 'auth/invalid-credentials':
      // Invalid credentials provided
      break;
    case 'auth/popup-blocked':
      // Popup was blocked by browser
      break;
    default:
      // Other error
      console.error('Auth error:', error);
  }
}
```

## Security Considerations

1. **Client IDs and Secrets**: Never expose client secrets in your client-side code
2. **Token Storage**: Tokens are securely stored using platform-specific secure storage
3. **HTTPS Required**: Always use HTTPS in production for web implementations
4. **Validate Tokens**: Always validate tokens on your backend before trusting them
5. **Biometric Security**: Biometric data never leaves the device

## Migration Guide

If you're migrating from other authentication solutions:

### From Firebase Auth

```typescript
// Before (Firebase Auth)
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
const auth = getAuth();
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);

// After (Capacitor Auth Manager)
import { CapacitorAuthManager, AuthProvider } from 'capacitor-auth-manager';
const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.GOOGLE
});
```

### From Capacitor Google Auth

```typescript
// Before
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
await GoogleAuth.initialize();
const user = await GoogleAuth.signIn();

// After
import { CapacitorAuthManager, AuthProvider } from 'capacitor-auth-manager';
await CapacitorAuthManager.initialize({
  providers: [{
    provider: AuthProvider.GOOGLE,
    options: { clientId: 'YOUR_CLIENT_ID' }
  }]
});
const result = await CapacitorAuthManager.signIn({
  provider: AuthProvider.GOOGLE
});
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT

## Support

- 📧 Email: aoneahsan@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/capacitor-auth-manager/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/aoneahsan/capacitor-auth-manager/discussions)

## Credits

Created by [Ahsan Mahmood](https://aoneahsan.com) at [Zaions](https://zaions.com)
