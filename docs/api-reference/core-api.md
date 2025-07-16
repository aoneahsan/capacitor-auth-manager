# Core API Reference

This document provides a comprehensive reference for all methods, properties, and interfaces available in Capacitor Auth Manager.

## Table of Contents

- [Initialization](#initialization)
- [Authentication Methods](#authentication-methods)
- [State Management](#state-management)
- [Token Management](#token-management)
- [Provider Management](#provider-management)
- [Utility Methods](#utility-methods)
- [Interfaces](#interfaces)

## Initialization

### `initialize(config: AuthConfig): Promise<void>`

Initializes the authentication manager with provider configurations.

```typescript
await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
      offlineAccess: true,
      scopes: ['profile', 'email']
    },
    apple: {
      clientId: 'YOUR_APPLE_CLIENT_ID',
      redirectURI: 'YOUR_REDIRECT_URI'
    }
  },
  persistence: 'local', // 'local' | 'session' | 'none'
  debug: true // Enable debug logging
});
```

**Parameters:**
- `config: AuthConfig` - Configuration object for authentication providers

**Returns:**
- `Promise<void>` - Resolves when initialization is complete

## Authentication Methods

### `signIn(options: SignInOptions): Promise<AuthResult>`

Signs in a user with the specified provider.

```typescript
const result = await CapacitorAuthManager.signIn({
  provider: 'google',
  scopes: ['additional.scope'],
  customParameters: {
    prompt: 'select_account'
  }
});
```

**Parameters:**
- `options: SignInOptions` - Sign in configuration
  - `provider: string` - Authentication provider name
  - `scopes?: string[]` - Additional OAuth scopes
  - `customParameters?: Record<string, any>` - Provider-specific parameters

**Returns:**
- `Promise<AuthResult>` - Authentication result with user info and tokens

### `signOut(): Promise<void>`

Signs out the current user from all providers.

```typescript
await CapacitorAuthManager.signOut();
```

**Returns:**
- `Promise<void>` - Resolves when sign out is complete

### `silentSignIn(options: SilentSignInOptions): Promise<AuthResult>`

Attempts to sign in without user interaction.

```typescript
try {
  const result = await CapacitorAuthManager.silentSignIn({
    provider: 'google'
  });
} catch (error) {
  // Silent sign in failed, show sign in UI
}
```

**Parameters:**
- `options: SilentSignInOptions` - Silent sign in configuration
  - `provider: string` - Authentication provider name

**Returns:**
- `Promise<AuthResult>` - Authentication result if successful

### `linkProvider(options: LinkProviderOptions): Promise<AuthResult>`

Links an additional authentication provider to the current user.

```typescript
const result = await CapacitorAuthManager.linkProvider({
  provider: 'facebook'
});
```

**Parameters:**
- `options: LinkProviderOptions` - Provider linking configuration
  - `provider: string` - Provider to link

**Returns:**
- `Promise<AuthResult>` - Updated authentication result

### `unlinkProvider(options: UnlinkProviderOptions): Promise<void>`

Unlinks an authentication provider from the current user.

```typescript
await CapacitorAuthManager.unlinkProvider({
  provider: 'facebook'
});
```

**Parameters:**
- `options: UnlinkProviderOptions` - Provider unlinking configuration
  - `provider: string` - Provider to unlink

**Returns:**
- `Promise<void>` - Resolves when unlink is complete

## State Management

### `getCurrentUser(): Promise<AuthState>`

Gets the current authentication state and user information.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();

if (authState.isAuthenticated) {
  console.log('User:', authState.user);
  console.log('Access Token:', authState.accessToken);
}
```

**Returns:**
- `Promise<AuthState>` - Current authentication state

### `addAuthStateListener(callback: AuthStateListener): PluginListenerHandle`

Adds a listener for authentication state changes.

```typescript
const listener = CapacitorAuthManager.addAuthStateListener((state) => {
  console.log('Auth state changed:', state);
  
  if (state.isAuthenticated) {
    // User signed in
  } else {
    // User signed out
  }
});

// Remove listener when done
listener.remove();
```

**Parameters:**
- `callback: AuthStateListener` - Function called on auth state changes

**Returns:**
- `PluginListenerHandle` - Handle to remove the listener

### `isAuthenticated(): Promise<boolean>`

Quick check if user is authenticated.

```typescript
const isAuth = await CapacitorAuthManager.isAuthenticated();
```

**Returns:**
- `Promise<boolean>` - True if user is authenticated

## Token Management

### `getAccessToken(): Promise<string | null>`

Gets the current access token.

```typescript
const token = await CapacitorAuthManager.getAccessToken();
```

**Returns:**
- `Promise<string | null>` - Access token or null if not authenticated

### `getIdToken(): Promise<string | null>`

Gets the current ID token.

```typescript
const idToken = await CapacitorAuthManager.getIdToken();
```

**Returns:**
- `Promise<string | null>` - ID token or null if not available

### `refreshToken(): Promise<TokenRefreshResult>`

Refreshes authentication tokens.

```typescript
try {
  const result = await CapacitorAuthManager.refreshToken();
  console.log('New access token:', result.accessToken);
} catch (error) {
  // Token refresh failed, re-authenticate
}
```

**Returns:**
- `Promise<TokenRefreshResult>` - New tokens

### `isTokenExpired(): Promise<boolean>`

Checks if the current access token is expired.

```typescript
const isExpired = await CapacitorAuthManager.isTokenExpired();
```

**Returns:**
- `Promise<boolean>` - True if token is expired

## Provider Management

### `getSupportedProviders(): Promise<string[]>`

Gets list of supported authentication providers.

```typescript
const providers = await CapacitorAuthManager.getSupportedProviders();
// ['google', 'apple', 'facebook', 'microsoft', ...]
```

**Returns:**
- `Promise<string[]>` - Array of provider names

### `isProviderAvailable(provider: string): Promise<boolean>`

Checks if a specific provider is available on the current platform.

```typescript
const isAvailable = await CapacitorAuthManager.isProviderAvailable('apple');
```

**Parameters:**
- `provider: string` - Provider name to check

**Returns:**
- `Promise<boolean>` - True if provider is available

### `getProviderConfig(provider: string): Promise<ProviderConfig | null>`

Gets configuration for a specific provider.

```typescript
const config = await CapacitorAuthManager.getProviderConfig('google');
```

**Parameters:**
- `provider: string` - Provider name

**Returns:**
- `Promise<ProviderConfig | null>` - Provider configuration or null

## Utility Methods

### `isAvailable(): Promise<boolean>`

Checks if the plugin is available on the current platform.

```typescript
const isAvailable = await CapacitorAuthManager.isAvailable();
```

**Returns:**
- `Promise<boolean>` - True if plugin is available

### `clearAuthData(): Promise<void>`

Clears all stored authentication data.

```typescript
await CapacitorAuthManager.clearAuthData();
```

**Returns:**
- `Promise<void>` - Resolves when data is cleared

### `setLogLevel(level: LogLevel): Promise<void>`

Sets the logging level for debugging.

```typescript
await CapacitorAuthManager.setLogLevel('debug'); // 'none' | 'error' | 'warn' | 'info' | 'debug'
```

**Parameters:**
- `level: LogLevel` - Logging level

**Returns:**
- `Promise<void>` - Resolves when level is set

## Interfaces

### `AuthConfig`

Main configuration interface for the plugin.

```typescript
interface AuthConfig {
  providers: {
    [key: string]: ProviderConfig;
  };
  persistence?: 'local' | 'session' | 'none';
  debug?: boolean;
  tokenRefreshThreshold?: number; // Seconds before expiry to refresh
}
```

### `AuthState`

Authentication state interface.

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  provider: string | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  linkedProviders: string[];
}
```

### `User`

User information interface.

```typescript
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  providerId: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  providerData: ProviderData[];
}
```

### `AuthResult`

Authentication result interface.

```typescript
interface AuthResult {
  user: User;
  credential: AuthCredential;
  additionalUserInfo?: {
    isNewUser: boolean;
    profile?: Record<string, any>;
  };
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
}
```

### `AuthError`

Authentication error interface.

```typescript
interface AuthError {
  code: string;
  message: string;
  details?: any;
  provider?: string;
  originalError?: any;
}
```

### `SignInOptions`

Options for sign in method.

```typescript
interface SignInOptions {
  provider: string;
  scopes?: string[];
  customParameters?: Record<string, any>;
  prompt?: 'none' | 'consent' | 'select_account';
}
```

### `ProviderConfig`

Provider configuration interface.

```typescript
interface ProviderConfig {
  // Common fields
  enabled?: boolean;
  scopes?: string[];
  
  // Provider-specific fields
  clientId?: string;
  webClientId?: string;
  appId?: string;
  redirectUri?: string;
  authDomain?: string;
  // ... other provider-specific options
}
```

## Error Codes

Common error codes returned by the plugin:

- `auth/user-cancelled` - User cancelled the authentication flow
- `auth/network-error` - Network connection error
- `auth/invalid-credential` - Invalid authentication credential
- `auth/account-exists-with-different-credential` - Account exists with different provider
- `auth/provider-not-configured` - Provider not properly configured
- `auth/token-expired` - Authentication token has expired
- `auth/invalid-provider` - Invalid provider specified
- `auth/operation-not-supported` - Operation not supported on platform

## Platform-Specific Notes

### iOS
- Apple Sign In is only available on iOS 13+
- Some providers require additional configuration in Info.plist

### Android
- Google Sign In requires SHA-1 fingerprint configuration
- Some providers require additional manifest configuration

### Web
- Provider SDKs must be loaded in the HTML
- Popup blockers may interfere with OAuth flows

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community