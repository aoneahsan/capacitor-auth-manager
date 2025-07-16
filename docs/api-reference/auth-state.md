# Authentication State

This document explains the authentication state management system in Capacitor Auth Manager, including how to listen for changes and understand the state structure.

## Overview

Capacitor Auth Manager provides a reactive authentication state system that allows your application to respond to authentication changes in real-time. The state is automatically updated when users sign in, sign out, or when tokens are refreshed.

## AuthState Interface

The `AuthState` interface represents the current authentication status:

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
  lastUpdated: number;
}
```

### Properties

#### `isAuthenticated: boolean`
Indicates whether the user is currently authenticated.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.isAuthenticated) {
  console.log('User is signed in');
} else {
  console.log('User is not signed in');
}
```

#### `user: User | null`
Contains the user information when authenticated, `null` otherwise.

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

#### `provider: string | null`
The primary authentication provider used for the current session.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
console.log('Primary provider:', authState.provider); // 'google', 'apple', etc.
```

#### `accessToken: string | null`
The current access token for API requests.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.accessToken) {
  // Use token for API requests
  const response = await fetch('/api/user', {
    headers: {
      'Authorization': `Bearer ${authState.accessToken}`
    }
  });
}
```

#### `idToken: string | null`
The ID token containing user identity information (when available).

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.idToken) {
  // ID token can be used for server-side verification
  const decoded = jwt.decode(authState.idToken);
  console.log('Token claims:', decoded);
}
```

#### `refreshToken: string | null`
The refresh token for obtaining new access tokens.

```typescript
// Refresh tokens are managed automatically
// but can be accessed if needed
const authState = await CapacitorAuthManager.getCurrentUser();
console.log('Has refresh token:', !!authState.refreshToken);
```

#### `expiresAt: number | null`
Timestamp when the access token expires (Unix timestamp in milliseconds).

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.expiresAt) {
  const expirationDate = new Date(authState.expiresAt);
  console.log('Token expires at:', expirationDate.toLocaleString());
  
  const isExpired = Date.now() > authState.expiresAt;
  console.log('Token is expired:', isExpired);
}
```

#### `linkedProviders: string[]`
Array of all linked authentication providers.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
console.log('Linked providers:', authState.linkedProviders);
// ['google', 'facebook', 'github']
```

#### `lastUpdated: number`
Timestamp when the auth state was last updated.

```typescript
const authState = await CapacitorAuthManager.getCurrentUser();
const lastUpdate = new Date(authState.lastUpdated);
console.log('State last updated:', lastUpdate.toLocaleString());
```

## State Management

### Getting Current State

```typescript
// Get current authentication state
const authState = await CapacitorAuthManager.getCurrentUser();

// Quick check for authentication
const isAuthenticated = await CapacitorAuthManager.isAuthenticated();
```

### Listening to State Changes

The most powerful feature is the ability to listen for real-time auth state changes:

```typescript
const listener = CapacitorAuthManager.addAuthStateListener((authState) => {
  console.log('Auth state changed:', authState);
  
  if (authState.isAuthenticated) {
    console.log('User signed in:', authState.user);
    // Update UI to show authenticated state
    showDashboard();
  } else {
    console.log('User signed out');
    // Update UI to show unauthenticated state
    showLoginPage();
  }
});

// Remember to remove listener when done
// listener.remove();
```

### State Change Triggers

The auth state changes in the following scenarios:

1. **User Signs In**: `isAuthenticated` becomes `true`, `user` is populated
2. **User Signs Out**: `isAuthenticated` becomes `false`, `user` becomes `null`
3. **Token Refresh**: `accessToken` and `expiresAt` are updated
4. **Provider Linking**: `linkedProviders` array is updated
5. **Profile Update**: `user` object is updated

## React Integration

### Using State in React Components

```typescript
import { useEffect, useState } from 'react';
import { CapacitorAuthManager, AuthState } from 'capacitor-auth-manager';

function useAuthState() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial state
    CapacitorAuthManager.getCurrentUser().then(state => {
      setAuthState(state);
      setLoading(false);
    });

    // Listen for changes
    const listener = CapacitorAuthManager.addAuthStateListener(state => {
      setAuthState(state);
      setLoading(false);
    });

    return () => listener.remove();
  }, []);

  return { authState, loading };
}

// Usage in component
function MyComponent() {
  const { authState, loading } = useAuthState();

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {authState?.isAuthenticated ? (
        <div>Welcome, {authState.user?.displayName}!</div>
      ) : (
        <div>Please sign in</div>
      )}
    </div>
  );
}
```

### Context Provider Pattern

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);

  useEffect(() => {
    const listener = CapacitorAuthManager.addAuthStateListener(setAuthState);
    return () => listener.remove();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authState = useContext(AuthContext);
  return authState;
};
```

## Vue Integration

### Composable for Vue 3

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { CapacitorAuthManager, AuthState } from 'capacitor-auth-manager';

export function useAuthState() {
  const authState = ref<AuthState | null>(null);
  const loading = ref(true);
  let listener: any;

  onMounted(async () => {
    // Get initial state
    authState.value = await CapacitorAuthManager.getCurrentUser();
    loading.value = false;

    // Listen for changes
    listener = CapacitorAuthManager.addAuthStateListener(state => {
      authState.value = state;
      loading.value = false;
    });
  });

  onUnmounted(() => {
    if (listener) {
      listener.remove();
    }
  });

  return { authState, loading };
}
```

### Vue Component Example

```vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="authState?.isAuthenticated">
      Welcome, {{ authState.user?.displayName }}!
    </div>
    <div v-else>
      Please sign in
    </div>
  </div>
</template>

<script setup>
import { useAuthState } from './composables/useAuthState';

const { authState, loading } = useAuthState();
</script>
```

## Angular Integration

### Service for Angular

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CapacitorAuthManager, AuthState } from 'capacitor-auth-manager';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState | null>(null);
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial state
    const initialState = await CapacitorAuthManager.getCurrentUser();
    this.authStateSubject.next(initialState);

    // Listen for changes
    CapacitorAuthManager.addAuthStateListener(state => {
      this.authStateSubject.next(state);
    });
  }

  get isAuthenticated(): boolean {
    return this.authStateSubject.value?.isAuthenticated ?? false;
  }

  get currentUser() {
    return this.authStateSubject.value?.user ?? null;
  }
}
```

### Angular Component Example

```typescript
import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div *ngIf="authService.authState$ | async as authState">
      <div *ngIf="authState.isAuthenticated">
        Welcome, {{ authState.user?.displayName }}!
      </div>
      <div *ngIf="!authState.isAuthenticated">
        Please sign in
      </div>
    </div>
  `
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}
}
```

## Best Practices

### 1. Always Remove Listeners
```typescript
// Good
const listener = CapacitorAuthManager.addAuthStateListener(callback);
// Later...
listener.remove();

// Bad - memory leak
CapacitorAuthManager.addAuthStateListener(callback);
// Never removed
```

### 2. Handle Loading States
```typescript
// Good
const [loading, setLoading] = useState(true);

useEffect(() => {
  const listener = CapacitorAuthManager.addAuthStateListener(state => {
    setAuthState(state);
    setLoading(false); // Set loading to false when state is received
  });
  
  return () => listener.remove();
}, []);

if (loading) return <div>Loading...</div>;
```

### 3. Use State for UI Decisions
```typescript
// Good - reactive UI
const { authState } = useAuthState();

return (
  <div>
    {authState?.isAuthenticated ? (
      <DashboardComponent user={authState.user} />
    ) : (
      <LoginComponent />
    )}
  </div>
);
```

### 4. Check Token Expiration
```typescript
// Good
const isTokenExpired = authState?.expiresAt ? 
  Date.now() > authState.expiresAt : true;

if (isTokenExpired) {
  // Handle token refresh or re-authentication
}
```

## Common Patterns

### Protected Route Component
```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, loading } = useAuthState();

  if (loading) return <div>Loading...</div>;
  
  if (!authState?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Auto-refresh Token
```typescript
useEffect(() => {
  if (!authState?.isAuthenticated) return;

  const checkTokenExpiry = () => {
    if (authState.expiresAt && Date.now() > authState.expiresAt - 60000) {
      // Refresh token 1 minute before expiry
      CapacitorAuthManager.refreshToken().catch(console.error);
    }
  };

  const interval = setInterval(checkTokenExpiry, 30000); // Check every 30 seconds
  return () => clearInterval(interval);
}, [authState]);
```

## Troubleshooting

### State Not Updating
- Ensure listener is properly added
- Check if listener is removed too early
- Verify plugin is properly initialized

### Memory Leaks
- Always remove listeners in cleanup
- Use useEffect cleanup in React
- Use onUnmounted in Vue
- Use ngOnDestroy in Angular

### Initial State Issues
- Get initial state before adding listener
- Handle loading states properly
- Check for null/undefined values

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community