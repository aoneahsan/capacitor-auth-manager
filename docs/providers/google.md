# Google Authentication

This guide covers implementing Google Sign-In using Capacitor Auth Manager.

## Prerequisites

Before implementing Google authentication, you need:

1. A Google Cloud Console project
2. OAuth 2.0 credentials (Web Client ID)
3. SHA-1 fingerprint for Android
4. Bundle ID configured for iOS

## Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web application** - for all platforms
   - **iOS** - for iOS native support
   - **Android** - for Android native support

### 2. Platform Configuration

#### iOS Setup

1. **Add URL Scheme** to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Replace with your REVERSED_CLIENT_ID -->
            <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

2. **Configure OAuth Client**:
   - Add your iOS bundle ID in Google Cloud Console
   - Download `GoogleService-Info.plist`
   - Add it to your Xcode project

#### Android Setup

1. **Get SHA-1 Fingerprint**:

```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

2. **Configure in Google Cloud Console**:
   - Add your package name
   - Add SHA-1 fingerprint
   - Download `google-services.json`
   - Place in `android/app/`

3. **Update `android/app/build.gradle`**:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

#### Web Setup

Add Google Sign-In SDK to your HTML:

```html
<script
  src="https://accounts.google.com/gsi/client"
  async
  defer
></script>
```

### 3. Plugin Configuration

Initialize the plugin with Google configuration:

```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: true,
      scopes: ['profile', 'email'],
      hostedDomain: 'example.com', // Optional: Restrict to domain
      forceCodeForRefreshToken: true, // iOS only
    },
  },
});
```

## Implementation

### Basic Sign In

```typescript
async function signInWithGoogle() {
  try {
    const result = await CapacitorAuthManager.signIn({
      provider: 'google',
    });

    console.log('User:', result.user);
    console.log('Access Token:', result.accessToken);
    console.log('ID Token:', result.idToken);

    // User is now signed in
    return result;
  } catch (error) {
    console.error('Google sign in error:', error);

    if (error.code === 'auth/user-cancelled') {
      // User cancelled the sign in flow
    } else if (error.code === 'auth/network-error') {
      // Network error
    }

    throw error;
  }
}
```

### Silent Sign In

Attempt to sign in without showing UI:

```typescript
async function trySilentSignIn() {
  try {
    const result = await CapacitorAuthManager.silentSignIn({
      provider: 'google',
    });

    console.log('Silent sign in successful');
    return result;
  } catch (error) {
    console.log('Silent sign in failed, user interaction required');
    return null;
  }
}
```

### Request Additional Scopes

```typescript
async function requestCalendarAccess() {
  try {
    const result = await CapacitorAuthManager.signIn({
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });

    // Now you can access Google Calendar API
    return result.accessToken;
  } catch (error) {
    console.error('Failed to get calendar access:', error);
  }
}
```

### Get User Profile

```typescript
async function getUserProfile() {
  const authState = await CapacitorAuthManager.getCurrentUser();

  if (authState.isAuthenticated && authState.provider === 'google') {
    const user = authState.user;

    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      picture: user.photoURL,
      verified: user.emailVerified,
    };
  }

  return null;
}
```

### Server-Side Verification

For server-side token verification:

```typescript
// Client-side: Get ID token
const authState = await CapacitorAuthManager.getCurrentUser();
const idToken = authState.idToken;

// Send idToken to your server
const response = await fetch('https://your-api.com/auth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ idToken }),
});
```

Server-side verification (Node.js):

```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

async function verify(idToken) {
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const userid = payload['sub'];

  return payload;
}
```

## Advanced Configuration

### Domain Restriction

Restrict sign in to specific G Suite domain:

```typescript
await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_WEB_CLIENT_ID',
      hostedDomain: 'company.com', // Only @company.com emails
    },
  },
});
```

### Offline Access

Request offline access for server-side API calls:

```typescript
await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_WEB_CLIENT_ID',
      offlineAccess: true,
      forceCodeForRefreshToken: true, // iOS only
    },
  },
});

// After sign in, you'll receive a serverAuthCode
const result = await CapacitorAuthManager.signIn({ provider: 'google' });
const serverAuthCode = result.credential.serverAuthCode;

// Exchange this code on your server for refresh token
```

### Custom Parameters

```typescript
const result = await CapacitorAuthManager.signIn({
  provider: 'google',
  customParameters: {
    prompt: 'select_account', // Force account selection
    login_hint: 'user@example.com', // Pre-fill email
    access_type: 'offline',
    include_granted_scopes: true,
  },
});
```

## Handling Tokens

### Access Google APIs

```typescript
async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.json();
}

// Usage
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.isAuthenticated && authState.accessToken) {
  const userInfo = await getGoogleUserInfo(authState.accessToken);
}
```

### Token Refresh

```typescript
async function ensureValidToken() {
  const isExpired = await CapacitorAuthManager.isTokenExpired();

  if (isExpired) {
    try {
      const result = await CapacitorAuthManager.refreshToken();
      console.log('Token refreshed:', result.accessToken);
      return result.accessToken;
    } catch (error) {
      // Refresh failed, need to re-authenticate
      await CapacitorAuthManager.signIn({ provider: 'google' });
    }
  }

  const authState = await CapacitorAuthManager.getCurrentUser();
  return authState.accessToken;
}
```

## Common Issues

### 1. "Developer Error" on Android

**Cause**: SHA-1 fingerprint mismatch

**Solution**:

- Ensure correct SHA-1 is added in Google Cloud Console
- Check both debug and release keystores
- Verify package name matches exactly

### 2. "Invalid Client ID" on iOS

**Cause**: Wrong client ID or URL scheme

**Solution**:

- Use the iOS client ID from Google Cloud Console
- Ensure URL scheme uses REVERSED client ID
- Check bundle ID matches configuration

### 3. Sign In Cancelled Immediately

**Cause**: Configuration mismatch

**Solution**:

- Verify `webClientId` is from Web OAuth client
- Check all platform-specific configurations
- Ensure Google Sign-In API is enabled

### 4. No ID Token Returned

**Cause**: Missing configuration

**Solution**:

```typescript
// Ensure you're requesting ID token
await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_WEB_CLIENT_ID',
      requestIdToken: true, // Explicitly request ID token
    },
  },
});
```

## Best Practices

1. **Always Use Web Client ID**: Even on native platforms, use the Web OAuth client ID
2. **Handle Cancellations Gracefully**: Users may cancel the sign in flow
3. **Implement Silent Sign In**: Try silent sign in on app launch
4. **Secure Token Storage**: Tokens are automatically secured by the plugin
5. **Validate Tokens Server-Side**: Always verify ID tokens on your server
6. **Request Minimal Scopes**: Only request scopes you actually need
7. **Handle Token Expiry**: Implement proper token refresh logic

## Testing

### Test Accounts

1. Create test users in Google Cloud Console
2. Add testers for internal testing on Play Store
3. Use TestFlight for iOS testing

### Debug Tips

Enable debug logging:

```typescript
await CapacitorAuthManager.setLogLevel('debug');
```

Check provider availability:

```typescript
const available = await CapacitorAuthManager.isProviderAvailable('google');
console.log('Google provider available:', available);
```

## Migration Guide

### From Google Sign-In Cordova Plugin

```typescript
// Old Cordova way
window.plugins.googleplus.login(
  {
    webClientId: CLIENT_ID,
    offline: true,
  },
  onSuccess,
  onError
);

// New Capacitor Auth Manager way
const result = await CapacitorAuthManager.signIn({
  provider: 'google',
});
```

### From Firebase Auth

```typescript
// Old Firebase way
const provider = new firebase.auth.GoogleAuthProvider();
const result = await firebase.auth().signInWithPopup(provider);

// New Capacitor Auth Manager way
const result = await CapacitorAuthManager.signIn({
  provider: 'google',
});
```

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community
