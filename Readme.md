# Capacitor Auth Manager

Universal authentication manager with 13+ providers. Framework-agnostic, works with React, Vue, Angular, and vanilla JS. Optional Capacitor support for mobile apps.

## 🚀 v2.0 - Complete Rewrite!

Version 2.0 is a complete rewrite focusing on developer experience, smaller bundle sizes, and flexibility:

- **No Provider Wrappers** - Works like Zustand, no context providers needed
- **Framework Agnostic** - One package for React, Vue, Angular, and vanilla JS
- **Optional Capacitor** - Use in regular web apps without Capacitor
- **Dynamic Loading** - Providers load only when used (better tree-shaking)
- **All 13 Providers Implemented** - Every promised provider is now available

## Features

- 🚀 **Zero Configuration** - Works out of the box with sensible defaults
- 🎯 **Framework Agnostic** - Use with React, Vue, Angular, or vanilla JavaScript
- 📦 **Tiny Bundle Size** - Only includes what you use with tree-shaking
- 🔌 **13+ Auth Providers** - Google, Apple, Microsoft, Facebook, GitHub, and more
- 🔄 **Provider-less Design** - No context providers required (like Zustand)
- 📱 **Optional Capacitor** - Works in web apps without Capacitor
- 🎨 **TypeScript First** - Full type safety and IntelliSense
- 🔐 **Secure by Default** - Follows security best practices
- ⚡ **Dynamic Loading** - Providers load only when used

## Quick Start

### Installation

```bash
npm install capacitor-auth-manager
# or
yarn add capacitor-auth-manager
```

### Basic Usage (Vanilla JavaScript)

```javascript
import { auth } from 'capacitor-auth-manager';

// Configure providers
auth.configure({
  providers: {
    google: {
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
    },
    apple: {
      clientId: 'YOUR_APPLE_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
    },
  },
});

// Sign in
const result = await auth.signIn('google');
console.log('Welcome', result.user.displayName);

// Listen to auth state changes
auth.onAuthStateChange((state) => {
  console.log('User:', state.user);
  console.log('Authenticated:', state.isAuthenticated);
});

// Sign out
await auth.signOut();
```

### React Usage

```tsx
import { useAuth } from 'capacitor-auth-manager/react';

function LoginButton() {
  const { user, signIn, signOut, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (user) {
    return (
      <div>
        <p>Welcome, {user.displayName}!</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn('google')}>Sign In with Google</button>;
}
```

No providers or context wrappers needed! Just import and use.

### Vue 3 Usage

```vue
<script setup>
import { useAuth } from 'capacitor-auth-manager/vue';

const { user, signIn, signOut, isLoading } = useAuth();
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="user">
    <p>Welcome, {{ user.displayName }}!</p>
    <button @click="signOut">Sign Out</button>
  </div>
  <button
    v-else
    @click="signIn('google')"
  >
    Sign In with Google
  </button>
</template>
```

### Angular Usage

```typescript
import { Component } from '@angular/core';
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({
  selector: 'app-login',
  template: `
    <div *ngIf="authService.isLoading$ | async">Loading...</div>
    <div *ngIf="authService.user$ | async as user">
      <p>Welcome, {{ user.displayName }}!</p>
      <button (click)="signOut()">Sign Out</button>
    </div>
    <button
      *ngIf="!(authService.user$ | async)"
      (click)="signIn('google')"
    >
      Sign In with Google
    </button>
  `,
})
export class LoginComponent {
  constructor(public authService: AuthService) {}

  signIn(provider: string) {
    this.authService.signIn(provider).subscribe();
  }

  signOut() {
    this.authService.signOut().subscribe();
  }
}
```

## Supported Providers

| Provider          | Web | iOS | Android | Status         |
| ----------------- | --- | --- | ------- | -------------- |
| Google            | ✅  | ✅  | ✅      | ✅ Implemented |
| Apple             | ✅  | ✅  | ❌      | ✅ Implemented |
| Microsoft         | ✅  | ✅  | ✅      | ✅ Implemented |
| Facebook          | ✅  | ✅  | ✅      | ✅ Implemented |
| GitHub            | ✅  | ❌  | ❌      | ✅ Implemented |
| Firebase          | ✅  | ✅  | ✅      | ✅ Implemented |
| Email Magic Link  | ✅  | ✅  | ✅      | ✅ Implemented |
| SMS               | ✅  | ✅  | ✅      | ✅ Implemented |
| Email/Password    | ✅  | ✅  | ✅      | ✅ Implemented |
| Biometric         | ❌  | ✅  | ✅      | ✅ Implemented |
| Slack             | ✅  | ❌  | ❌      | ✅ Implemented |
| LinkedIn          | ✅  | ❌  | ❌      | ✅ Implemented |
| Username/Password | ✅  | ✅  | ✅      | ✅ Implemented |

## Configuration

### Complete Configuration Example

```typescript
import { auth } from 'capacitor-auth-manager';

auth.configure({
  // Provider configurations
  providers: {
    google: {
      clientId: 'YOUR_CLIENT_ID',
      scopes: ['email', 'profile'],
    },
    apple: {
      clientId: 'YOUR_SERVICE_ID',
      redirectUri: 'https://your-app.com/auth/callback',
    },
    microsoft: {
      clientId: 'YOUR_CLIENT_ID',
      authority: 'https://login.microsoftonline.com/common',
    },
    facebook: {
      appId: 'YOUR_APP_ID',
      version: 'v18.0',
    },
    github: {
      clientId: 'YOUR_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
    },
    firebase: {
      apiKey: 'YOUR_API_KEY',
      authDomain: 'YOUR_AUTH_DOMAIN',
      projectId: 'YOUR_PROJECT_ID',
    },
    'magic-link': {
      sendLinkUrl: 'https://your-api.com/send-magic-link',
      verifyUrl: 'https://your-api.com/verify-magic-link',
    },
    sms: {
      sendCodeUrl: 'https://your-api.com/sms/send',
      verifyCodeUrl: 'https://your-api.com/sms/verify',
    },
    'email-password': {
      apiUrl: 'https://your-api.com',
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
      },
    },
    biometric: {
      reason: 'Authenticate to access your account',
      title: 'Authentication Required',
    },
    slack: {
      clientId: 'YOUR_CLIENT_ID',
      redirectUri: 'https://your-app.com/auth/slack/callback',
      teamId: 'OPTIONAL_TEAM_ID', // Restrict to specific workspace
    },
    linkedin: {
      clientId: 'YOUR_CLIENT_ID',
      redirectUri: 'https://your-app.com/auth/linkedin/callback',
    },
    'username-password': {
      apiUrl: 'https://your-api.com',
      usernameRequirements: {
        minLength: 3,
        maxLength: 20,
      },
      allowSignUp: true,
    },
  },

  // Global options
  persistence: 'local', // 'local' | 'session' | 'memory'
  autoRefreshToken: true,
  tokenRefreshBuffer: 300000, // 5 minutes before expiry
  enableLogging: true,
  logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
});
```

### Provider-Specific Setup

Each provider may require additional setup. The package provides helpful error messages when dependencies are missing.

## Framework-Specific APIs

### React Hooks

- `useAuth()` - Complete authentication functionality
- `useAuthState()` - Read-only authentication state
- `useUser()` - Just the current user
- `useToken()` - Access token management
- `useIsAuthenticated()` - Boolean authentication status

### Vue 3 Composables

- `useAuth()` - Complete authentication functionality with reactive refs
- `useAuthState()` - Reactive auth state
- `useUser()` - Reactive user ref
- `useToken()` - Reactive token management

### Angular Service

```typescript
import { AuthModule } from 'capacitor-auth-manager/angular';

// In your app module
imports: [
  AuthModule.forRoot({
    providers: {
      /* ... */
    },
  }),
];
```

## Advanced Usage

### Email Magic Link

```typescript
// Send magic link
await auth.signIn('magic-link', { email: 'user@example.com' });

// The user will receive an email with a link
// When they click it, your app handles the callback
```

### SMS Authentication

```typescript
// Send SMS code
const result = await auth.signIn('sms', { phoneNumber: '+1234567890' });

// Verify SMS code
await auth.signIn('sms', {
  phoneNumber: '+1234567890',
  code: '123456',
});
```

### Email/Password

```typescript
// Sign up
await auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  displayName: 'John Doe',
});

// Sign in
await auth.signIn('email-password', {
  email: 'user@example.com',
  password: 'secure-password',
});

// Update password
const provider = await auth.getProvider('email-password');
await provider.updatePassword('oldPassword', 'newPassword');

// Send password reset
await provider.sendPasswordResetEmail('user@example.com');
```

### Biometric Authentication

```typescript
// Check availability
const biometric = await auth.getProvider('biometric');
const { available, biometryType } = await biometric.isAvailable();

if (available) {
  // Store credentials after initial sign in
  const result = await auth.signIn('google');
  await biometric.storeUserCredentials(result.user, result.credential);

  // Later: authenticate with biometrics
  await auth.signIn('biometric');
}
```

### Username/Password Authentication

```typescript
// Sign up with username
await auth.signUp({
  username: 'johndoe',
  password: 'secure-password',
  email: 'john@example.com', // optional
  displayName: 'John Doe', // optional
});

// Sign in
await auth.signIn('username-password', {
  username: 'johndoe',
  password: 'secure-password',
});

// Check username availability
const provider = await auth.getProvider('username-password');
const isAvailable = await provider.checkUsernameAvailability('johndoe');
```

### Slack Authentication

```typescript
// Sign in with Slack
await auth.signIn('slack');

// Restrict to specific workspace
auth.configure({
  providers: {
    slack: {
      clientId: 'YOUR_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
      teamId: 'SPECIFIC_TEAM_ID', // Optional
    },
  },
});
```

### LinkedIn Authentication

```typescript
// Sign in with LinkedIn
await auth.signIn('linkedin');

// Configure with scopes
auth.configure({
  providers: {
    linkedin: {
      clientId: 'YOUR_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI',
      scopes: ['openid', 'profile', 'email'],
    },
  },
});
```

### Multiple Sign-In Options

```typescript
// Simple provider name
await auth.signIn('google');

// With scopes
await auth.signIn('google', {
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// With login hint
await auth.signIn('google', {
  loginHint: 'user@example.com',
});
```

### Token Management

```typescript
// Listen to token state
auth.onAuthStateChange((state) => {
  if (state.credential?.expiresAt) {
    console.log('Token expires at:', new Date(state.credential.expiresAt));
  }
});

// Manual token refresh
await auth.refreshToken();

// Get current token
const state = auth.getAuthState();
const token = state.credential?.accessToken;
```

## Examples

Check out the [examples](./examples) directory for complete applications:

- [Vanilla JavaScript](./examples/vanilla-js) - Pure JS implementation
- [React Example](./examples/react) - React 18+ with TypeScript
- [Vue 3 Example](./examples/vue) - Vue 3 Composition API
- [Angular Example](./examples/angular) - Angular 16+ with standalone components

## Migration from v1.x

### Before (v1.x)

```typescript
// Required Capacitor
import { CapacitorAuthManager } from 'capacitor-auth-manager';

await CapacitorAuthManager.initialize({
  providers: [
    /* ... */
  ],
});

await CapacitorAuthManager.signIn({ provider: AuthProvider.GOOGLE });
```

### After (v2.0)

```typescript
// Works without Capacitor
import { auth } from 'capacitor-auth-manager';

auth.configure({
  providers: { google: { clientId: '...' } },
});

await auth.signIn('google');
```

## Why v2.0?

1. **No Context Providers** - Works like Zustand, cleaner component trees
2. **Framework Agnostic** - One package, multiple frameworks
3. **Better Tree-shaking** - Only pay for what you use
4. **Optional Capacitor** - Use in any web app
5. **All Providers Ready** - No more "coming soon"

## TypeScript Support

Full TypeScript support with detailed types:

```typescript
import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  AuthState,
  AuthProvider,
  AuthCredential,
} from 'capacitor-auth-manager';
```

## Platform Notes

### Web

- All providers work without additional setup
- Some providers (SMS, Magic Link, Email/Password) require backend services

### iOS

- Requires Capacitor for native functionality
- Biometric auth requires Face ID/Touch ID capability
- Some providers need URL schemes configuration

### Android

- Requires Capacitor for native functionality
- Biometric auth requires fingerprint hardware
- Configure `AndroidManifest.xml` for OAuth redirects

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © [Ahsan Mahmood](https://github.com/aoneahsan)

## Support

- 📧 Email: aoneahsan@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/capacitor-auth-manager/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/aoneahsan/capacitor-auth-manager/discussions)
