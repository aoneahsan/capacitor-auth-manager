# Capacitor Auth Manager

Universal authentication manager with 13+ providers. Framework-agnostic, works with React, Vue, Angular, and vanilla JS. Optional Capacitor support for mobile apps.

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
      clientId: 'YOUR_GOOGLE_CLIENT_ID'
    },
    apple: {
      clientId: 'YOUR_APPLE_CLIENT_ID',
      redirectUri: 'YOUR_REDIRECT_URI'
    }
  }
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

  return (
    <button onClick={() => signIn('google')}>
      Sign In with Google
    </button>
  );
}
```

No providers or context wrappers needed! Just import and use.

## Supported Providers

| Provider | Web | iOS | Android | Status |
|----------|-----|-----|---------|--------|
| Google | ✅ | ✅ | ✅ | Ready |
| Apple | ✅ | ✅ | ❌ | Ready |
| Microsoft | ✅ | ✅ | ✅ | Coming Soon |
| Facebook | ✅ | ✅ | ✅ | Coming Soon |
| GitHub | ✅ | ❌ | ❌ | Coming Soon |
| Slack | ✅ | ❌ | ❌ | Coming Soon |
| LinkedIn | ✅ | ❌ | ❌ | Coming Soon |
| Firebase | ✅ | ✅ | ✅ | Coming Soon |
| Email Magic Link | ✅ | ✅ | ✅ | Coming Soon |
| SMS | ✅ | ✅ | ✅ | Coming Soon |
| Email/Password | ✅ | ✅ | ✅ | Coming Soon |
| Phone/Password | ✅ | ✅ | ✅ | Coming Soon |
| Biometric | ❌ | ✅ | ✅ | Coming Soon |

## Configuration

### Basic Configuration

```typescript
import { auth } from 'capacitor-auth-manager';

auth.configure({
  // Provider configurations
  providers: {
    google: {
      clientId: 'YOUR_CLIENT_ID',
      scopes: ['email', 'profile'],
      hostedDomain: 'company.com' // Optional
    },
    apple: {
      clientId: 'YOUR_SERVICE_ID',
      redirectUri: 'https://your-app.com/auth/callback',
      scopes: ['email', 'name']
    }
  },
  
  // Global options
  persistence: 'local', // 'local' | 'session' | 'memory'
  autoRefreshToken: true,
  tokenRefreshBuffer: 300000, // 5 minutes before expiry
  enableLogging: true,
  logLevel: 'debug' // 'debug' | 'info' | 'warn' | 'error'
});
```

### Provider-Specific Setup

Each provider may require additional setup. The package provides helpful error messages:

```
Error: Google Sign-In SDK not found.
To use Google authentication, install the SDK:

npm install @google/gsi

Then configure in your app:
auth.configure({
  providers: {
    google: { clientId: 'YOUR_CLIENT_ID' }
  }
});
```

## React Hooks

### `useAuth()`
Complete authentication functionality with methods and state.

```tsx
const { user, isLoading, isAuthenticated, signIn, signOut, error } = useAuth();
```

### `useAuthState()`
Read-only authentication state.

```tsx
const { user, isLoading, isAuthenticated, provider } = useAuthState();
```

### `useUser()`
Just the current user.

```tsx
const user = useUser();
```

### `useIsAuthenticated()`
Boolean authentication status.

```tsx
const isAuthenticated = useIsAuthenticated();
```

### `useAuthProvider()`
Provider-specific functionality.

```tsx
const { signIn, isSupported, isConfigured } = useAuthProvider('google');
```

## Advanced Usage

### Multiple Sign-In Options

```typescript
// Simple provider name
await auth.signIn('google');

// With options
await auth.signIn({
  provider: 'google',
  options: {
    loginHint: 'user@example.com',
    prompt: 'consent'
  }
});

// With credentials (for password-based auth)
await auth.signIn({
  provider: 'email_password',
  credentials: {
    email: 'user@example.com',
    password: 'secure-password'
  }
});
```

### Token Management

```typescript
// Manual token refresh
await auth.refreshToken();

// Get ID token
const idToken = await auth.getIdToken();

// Automatic refresh is handled by default
auth.configure({
  autoRefreshToken: true,
  tokenRefreshBuffer: 300000 // Refresh 5 minutes before expiry
});
```

### State Management

```typescript
// Subscribe to auth state changes
const unsubscribe = auth.onAuthStateChange((state) => {
  console.log('User:', state.user);
  console.log('Loading:', state.isLoading);
  console.log('Authenticated:', state.isAuthenticated);
  console.log('Provider:', state.provider);
});

// Clean up subscription
unsubscribe();
```

### Platform Detection

```typescript
import { PlatformDetector } from 'capacitor-auth-manager';

const platform = PlatformDetector.getPlatform();
console.log(platform);
// {
//   platform: 'web',
//   isNative: false,
//   isWeb: true,
//   isMobile: false,
//   isDesktop: true,
//   userAgent: '...'
// }
```

## TypeScript Support

Full TypeScript support with detailed types:

```typescript
import type { 
  AuthUser, 
  AuthResult, 
  SignInOptions,
  AuthState 
} from 'capacitor-auth-manager';

// All methods and hooks are fully typed
const result: AuthResult = await auth.signIn('google');
const user: AuthUser | null = auth.getCurrentUser();
```

## Migration from v1.x

See the [Migration Guide](./docs/MIGRATION.md) for detailed upgrade instructions.

Key changes in v2.0:
- No provider wrapper required
- Direct singleton API
- Optional Capacitor dependency
- Better tree-shaking
- React hooks included

## Backward Compatibility with Capacitor Plugin

For users who still need the Capacitor plugin interface:

```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

// Works like v1.x
await CapacitorAuthManager.initialize({
  providers: [
    {
      provider: AuthProvider.GOOGLE,
      options: { clientId: 'YOUR_CLIENT_ID' }
    }
  ]
});

await CapacitorAuthManager.signIn({
  provider: AuthProvider.GOOGLE
});
```

## Examples

Check out the [examples](./examples) directory for complete applications:

- [React Example](./examples/react)
- [Vue Example](./examples/vue)
- [Angular Example](./examples/angular)
- [Vanilla JS Example](./examples/vanilla)
- [Capacitor Example](./examples/capacitor)

## API Reference

### Core API

```typescript
// Configure auth
auth.configure(config: AuthManagerConfig): void

// Sign in
auth.signIn(provider: string | SignInOptions): Promise<AuthResult>

// Sign out  
auth.signOut(options?: SignOutOptions): Promise<void>

// Get current user
auth.getCurrentUser(): AuthUser | null

// Get auth state
auth.getAuthState(): AuthState

// Check authentication
auth.isAuthenticated(): boolean

// Listen to changes
auth.onAuthStateChange(callback: (state: AuthState) => void): () => void

// Token refresh
auth.refreshToken(provider?: string): Promise<AuthResult>

// Provider utilities
auth.getAvailableProviders(): Promise<string[]>
auth.getSupportedProviders(): Promise<string[]>
auth.isProviderSupported(provider: string): Promise<boolean>
```

## Platform-Specific Setup

### iOS Setup

1. Add required capabilities in Xcode:
   - Sign in with Apple (if using Apple Auth)
   - Keychain Sharing (for secure credential storage)

2. Update your `Info.plist` for each provider you're using

### Android Setup

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

2. Update your `AndroidManifest.xml` for each provider

### Web Setup

Configure redirect URIs in each provider's console:
- **Google**: Add your domain to authorized JavaScript origins
- **Apple**: Configure your Service ID with proper domains and redirect URLs
- **Facebook**: Add your domain to valid OAuth redirect URIs
- **Microsoft**: Configure redirect URIs in Azure AD

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © [Ahsan Mahmood](https://github.com/aoneahsan)

## Support

- 📧 Email: aoneahsan@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/capacitor-auth-manager/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/aoneahsan/capacitor-auth-manager/discussions)