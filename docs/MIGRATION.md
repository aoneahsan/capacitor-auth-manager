# Migration Guide: v1.x to v2.0

## Overview

Version 2.0 brings significant improvements to the capacitor-auth-manager package:

- **Framework Agnostic**: Works with React, Vue, Angular, and vanilla JavaScript
- **No Provider Required**: Direct singleton API without context providers
- **Optional Capacitor**: Capacitor is now optional, works in any web app
- **Dynamic Loading**: Providers are loaded only when used
- **Better Bundle Size**: Tree-shakeable with modular exports

## Breaking Changes

### 1. New Import Structure

**Before (v1.x):**
```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

const auth = new CapacitorAuthManager();
await auth.initialize({
  providers: [...]
});
```

**After (v2.0):**
```typescript
// Direct singleton import
import { auth } from 'capacitor-auth-manager';

// Configure on first use
auth.configure({
  providers: {
    google: { clientId: '...' },
    apple: { clientId: '...' }
  }
});
```

### 2. Provider Configuration

**Before (v1.x):**
```typescript
await auth.initialize({
  providers: [
    {
      provider: AuthProvider.GOOGLE,
      options: {
        clientId: '...',
        scopes: ['email', 'profile']
      }
    }
  ]
});
```

**After (v2.0):**
```typescript
auth.configure({
  providers: {
    google: {
      clientId: '...',
      scopes: ['email', 'profile']
    }
  }
});
```

### 3. Sign In API

**Before (v1.x):**
```typescript
const result = await auth.signIn({
  provider: AuthProvider.GOOGLE,
  options: { ... }
});
```

**After (v2.0):**
```typescript
// Simple string for provider
const result = await auth.signIn('google');

// Or with options
const result = await auth.signIn({
  provider: 'google',
  options: { ... }
});
```

### 4. React Integration

**Before (v1.x):**
```tsx
// Required provider setup
<AuthProvider config={...}>
  <App />
</AuthProvider>

// In component
const auth = useContext(AuthContext);
```

**After (v2.0):**
```tsx
// No provider needed!
import { useAuth } from 'capacitor-auth-manager/react';

function Component() {
  const { user, signIn, signOut } = useAuth();
  // Use directly
}
```

## New Features

### 1. Multiple Import Options

```typescript
// Core functionality only
import { auth } from 'capacitor-auth-manager/core';

// React hooks
import { useAuth, useAuthState } from 'capacitor-auth-manager/react';

// Specific providers (future)
import { GoogleAuth } from 'capacitor-auth-manager/providers/google';
```

### 2. Framework-Specific Hooks

#### React
```tsx
import { useAuth, useAuthState, useUser } from 'capacitor-auth-manager/react';

function App() {
  const { user, signIn, signOut, isLoading } = useAuth();
  const authState = useAuthState(); // Read-only state
  const currentUser = useUser(); // Just the user
}
```

#### Vue (Coming Soon)
```vue
<script setup>
import { useAuth } from 'capacitor-auth-manager/vue';

const { user, signIn, signOut } = useAuth();
</script>
```

#### Angular (Coming Soon)
```typescript
import { AuthService } from 'capacitor-auth-manager/angular';

@Component({...})
export class AppComponent {
  constructor(private auth: AuthService) {}
}
```

### 3. Better Error Messages

When a provider SDK is missing:
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

## Step-by-Step Migration

### 1. Update Package

```bash
npm update capacitor-auth-manager@^2.0.0
# or
yarn upgrade capacitor-auth-manager@^2.0.0
```

### 2. Remove Provider Wrapper (React)

Remove any `<AuthProvider>` wrapper from your app:

```tsx
// Remove this
<AuthProvider config={authConfig}>
  <App />
</AuthProvider>

// Just use
<App />
```

### 3. Update Imports

```typescript
// Old
import { CapacitorAuthManager, AuthProvider } from 'capacitor-auth-manager';

// New
import { auth } from 'capacitor-auth-manager';

// For React
import { useAuth } from 'capacitor-auth-manager/react';
```

### 4. Update Configuration

Move configuration to where you use it:

```typescript
// Can be in your app initialization
auth.configure({
  providers: {
    google: { clientId: process.env.GOOGLE_CLIENT_ID },
    apple: { 
      clientId: process.env.APPLE_CLIENT_ID,
      redirectUri: window.location.origin + '/auth/callback'
    }
  },
  enableLogging: process.env.NODE_ENV === 'development'
});
```

### 5. Update Auth Calls

```typescript
// Old
await auth.signIn({ provider: AuthProvider.GOOGLE });

// New
await auth.signIn('google');
```

## Backward Compatibility

For gradual migration, the old Capacitor plugin interface is still available:

```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

// Works like v1.x
const plugin = CapacitorAuthManager;
```

However, we recommend migrating to the new API for better performance and features.

## Common Issues

### 1. "Provider not configured" Error

Make sure to call `auth.configure()` before using auth methods:

```typescript
// In your app initialization
auth.configure({
  providers: {
    google: { clientId: '...' }
  }
});
```

### 2. React Hooks Not Working

Make sure to import from the React submodule:

```typescript
// ✅ Correct
import { useAuth } from 'capacitor-auth-manager/react';

// ❌ Wrong
import { useAuth } from 'capacitor-auth-manager';
```

### 3. TypeScript Errors

Update your TypeScript to 4.1+ and ensure `moduleResolution` is set to `node`:

```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

## Need Help?

- Check the [examples](../examples) directory
- Open an [issue](https://github.com/aoneahsan/capacitor-auth-manager/issues)
- Read the [API documentation](./API.md)