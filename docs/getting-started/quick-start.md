# Quick Start Guide

Get up and running with Capacitor Auth Manager in just a few minutes! This guide shows you how to implement basic authentication in your app.

## Basic Setup

### 1. Import and Initialize

```typescript
import { CapacitorAuthManager } from 'capacitor-auth-manager';

// Initialize with your configuration
await CapacitorAuthManager.initialize({
  providers: {
    google: {
      webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID'
    }
  }
});
```

### 2. Listen to Auth State Changes

```typescript
// Subscribe to auth state changes
const authStateListener = CapacitorAuthManager.addAuthStateListener((state) => {
  console.log('Auth state changed:', state);
  
  if (state.isAuthenticated) {
    console.log('User signed in:', state.user);
  } else {
    console.log('User signed out');
  }
});

// Remember to remove listener when done
// authStateListener.remove();
```

### 3. Implement Sign In

```typescript
async function signInWithGoogle() {
  try {
    const result = await CapacitorAuthManager.signIn({ 
      provider: 'google' 
    });
    
    console.log('Sign in successful:', result.user);
    // User is now authenticated
  } catch (error) {
    console.error('Sign in failed:', error);
  }
}
```

### 4. Get Current User

```typescript
async function getCurrentUser() {
  const authState = await CapacitorAuthManager.getCurrentUser();
  
  if (authState.isAuthenticated) {
    console.log('Current user:', authState.user);
    return authState.user;
  } else {
    console.log('No user signed in');
    return null;
  }
}
```

### 5. Sign Out

```typescript
async function signOut() {
  try {
    await CapacitorAuthManager.signOut();
    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}
```

## Complete Example

Here's a complete example implementing authentication in a simple app:

### React Example

```tsx
import React, { useEffect, useState } from 'react';
import { CapacitorAuthManager } from 'capacitor-auth-manager';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth manager
    initializeAuth();
    
    // Set up auth state listener
    const listener = CapacitorAuthManager.addAuthStateListener((state) => {
      setUser(state.isAuthenticated ? state.user : null);
      setLoading(false);
    });

    return () => listener.remove();
  }, []);

  const initializeAuth = async () => {
    await CapacitorAuthManager.initialize({
      providers: {
        google: {
          webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID'
        },
        apple: {
          clientId: 'YOUR_APPLE_CLIENT_ID'
        }
      }
    });

    // Check current auth state
    const state = await CapacitorAuthManager.getCurrentUser();
    setUser(state.isAuthenticated ? state.user : null);
    setLoading(false);
  };

  const handleSignIn = async (provider) => {
    try {
      setLoading(true);
      await CapacitorAuthManager.signIn({ provider });
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await CapacitorAuthManager.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      {user ? (
        <div>
          <h1>Welcome, {user.displayName}!</h1>
          <p>Email: {user.email}</p>
          {user.photoURL && <img src={user.photoURL} alt="Profile" />}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <h1>Sign In</h1>
          <button onClick={() => handleSignIn('google')}>
            Sign in with Google
          </button>
          <button onClick={() => handleSignIn('apple')}>
            Sign in with Apple
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
```

### Vue Example

```vue
<template>
  <div id="app">
    <div v-if="loading">Loading...</div>
    
    <div v-else-if="user">
      <h1>Welcome, {{ user.displayName }}!</h1>
      <p>Email: {{ user.email }}</p>
      <img v-if="user.photoURL" :src="user.photoURL" alt="Profile" />
      <button @click="signOut">Sign Out</button>
    </div>
    
    <div v-else>
      <h1>Sign In</h1>
      <button @click="signIn('google')">Sign in with Google</button>
      <button @click="signIn('apple')">Sign in with Apple</button>
    </div>
  </div>
</template>

<script>
import { CapacitorAuthManager } from 'capacitor-auth-manager';

export default {
  data() {
    return {
      user: null,
      loading: true
    };
  },
  
  async mounted() {
    await this.initializeAuth();
    
    // Listen to auth state changes
    this.authListener = CapacitorAuthManager.addAuthStateListener((state) => {
      this.user = state.isAuthenticated ? state.user : null;
    });
  },
  
  beforeUnmount() {
    if (this.authListener) {
      this.authListener.remove();
    }
  },
  
  methods: {
    async initializeAuth() {
      await CapacitorAuthManager.initialize({
        providers: {
          google: { webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID' },
          apple: { clientId: 'YOUR_APPLE_CLIENT_ID' }
        }
      });
      
      const state = await CapacitorAuthManager.getCurrentUser();
      this.user = state.isAuthenticated ? state.user : null;
      this.loading = false;
    },
    
    async signIn(provider) {
      try {
        this.loading = true;
        await CapacitorAuthManager.signIn({ provider });
      } catch (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async signOut() {
      try {
        this.loading = true;
        await CapacitorAuthManager.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

## Advanced Usage

### Multiple Providers

```typescript
// Configure multiple providers
await CapacitorAuthManager.initialize({
  providers: {
    google: { webClientId: 'YOUR_GOOGLE_CLIENT_ID' },
    facebook: { appId: 'YOUR_FACEBOOK_APP_ID' },
    apple: { clientId: 'YOUR_APPLE_CLIENT_ID' },
    microsoft: { clientId: 'YOUR_MICROSOFT_CLIENT_ID' }
  }
});

// Sign in with different providers
await CapacitorAuthManager.signIn({ provider: 'facebook' });
await CapacitorAuthManager.signIn({ provider: 'microsoft' });
```

### Custom Scopes

```typescript
// Request additional scopes
const result = await CapacitorAuthManager.signIn({
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/calendar.readonly']
});
```

### Silent Sign In

```typescript
// Try to sign in silently (without user interaction)
try {
  const result = await CapacitorAuthManager.silentSignIn({
    provider: 'google'
  });
  console.log('Silent sign in successful:', result.user);
} catch (error) {
  // Silent sign in failed, show sign in button
  console.log('Silent sign in failed, user interaction required');
}
```

### Token Management

```typescript
// Get access token
const authState = await CapacitorAuthManager.getCurrentUser();
if (authState.isAuthenticated) {
  const accessToken = authState.accessToken;
  
  // Use token for API calls
  const response = await fetch('https://api.example.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
}

// Refresh token if needed
try {
  const newTokens = await CapacitorAuthManager.refreshToken();
  console.log('Tokens refreshed:', newTokens);
} catch (error) {
  // Token refresh failed, user needs to sign in again
  await CapacitorAuthManager.signIn({ provider: 'google' });
}
```

## Best Practices

1. **Always Initialize First**: Call `initialize()` before any other auth methods
2. **Handle Errors Gracefully**: Wrap auth calls in try-catch blocks
3. **Use Auth State Listeners**: Subscribe to auth state changes for reactive UI
4. **Clean Up Listeners**: Remove listeners when components unmount
5. **Secure Token Storage**: Tokens are automatically stored securely by the plugin
6. **Check Platform Availability**: Some providers may not be available on all platforms

## Next Steps

- Explore [Provider-specific Guides](../providers/) for detailed implementation
- Learn about [Error Handling](../api-reference/error-handling.md)
- Implement [Advanced Features](../guides/best-practices.md)
- Check out [Complete Examples](../examples/) for your framework

## Need Help?

- 📖 Read the [Full Documentation](../README.md)
- 🐛 Report issues on [GitHub](https://github.com/aoneahsan/capacitor-auth-manager/issues)
- 💬 Join the [Discussion](https://github.com/aoneahsan/capacitor-auth-manager/discussions)

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community