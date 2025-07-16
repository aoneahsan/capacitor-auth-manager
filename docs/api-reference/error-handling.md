# Error Handling

This guide covers comprehensive error handling strategies for Capacitor Auth Manager, including error types, common scenarios, and best practices.

## Error Types

### AuthError Interface

All authentication errors implement the `AuthError` interface:

```typescript
interface AuthError {
  code: string;
  message: string;
  details?: any;
  provider?: string;
  originalError?: any;
}
```

### Error Categories

#### 1. Authentication Errors
Errors related to the authentication process itself.

#### 2. Network Errors
Connection and communication issues.

#### 3. Configuration Errors
Incorrect setup or configuration issues.

#### 4. Token Errors
Issues with token management and validation.

#### 5. Provider Errors
Provider-specific errors and limitations.

## Common Error Codes

### Authentication Errors

#### `auth/user-cancelled`
User cancelled the authentication flow.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'google' });
} catch (error) {
  if (error.code === 'auth/user-cancelled') {
    console.log('User cancelled sign in');
    // Don't show error message, user intentionally cancelled
  }
}
```

#### `auth/invalid-credential`
Invalid or expired authentication credential.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'apple' });
} catch (error) {
  if (error.code === 'auth/invalid-credential') {
    console.error('Invalid credential provided');
    // Show error message to user
    showError('Authentication failed. Please try again.');
  }
}
```

#### `auth/account-exists-with-different-credential`
Account already exists with different authentication provider.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'facebook' });
} catch (error) {
  if (error.code === 'auth/account-exists-with-different-credential') {
    console.log('Account exists with different provider');
    // Offer to link accounts or sign in with existing provider
    showAccountLinkingOptions(error.details);
  }
}
```

### Network Errors

#### `auth/network-error`
Network connection issues.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'google' });
} catch (error) {
  if (error.code === 'auth/network-error') {
    console.error('Network error occurred');
    // Show retry option
    showRetryDialog('Network error. Please check your connection and try again.');
  }
}
```

#### `auth/timeout`
Request timeout.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'microsoft' });
} catch (error) {
  if (error.code === 'auth/timeout') {
    console.error('Request timeout');
    // Implement retry logic
    await retryWithBackoff(() => 
      CapacitorAuthManager.signIn({ provider: 'microsoft' })
    );
  }
}
```

### Configuration Errors

#### `auth/provider-not-configured`
Authentication provider not properly configured.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'github' });
} catch (error) {
  if (error.code === 'auth/provider-not-configured') {
    console.error('Provider not configured:', error.provider);
    // Show configuration error to developer
    showConfigurationError(`${error.provider} is not properly configured`);
  }
}
```

#### `auth/invalid-configuration`
Invalid configuration parameters.

```typescript
try {
  await CapacitorAuthManager.initialize({
    providers: [{ provider: 'google', options: {} }]
  });
} catch (error) {
  if (error.code === 'auth/invalid-configuration') {
    console.error('Invalid configuration:', error.details);
    // Show specific configuration issues
    showConfigurationDetails(error.details);
  }
}
```

### Token Errors

#### `auth/token-expired`
Authentication token has expired.

```typescript
try {
  const user = await CapacitorAuthManager.getCurrentUser();
  // Make API call with token
} catch (error) {
  if (error.code === 'auth/token-expired') {
    console.log('Token expired, attempting refresh');
    try {
      await CapacitorAuthManager.refreshToken();
      // Retry original operation
    } catch (refreshError) {
      // Refresh failed, need to re-authenticate
      redirectToLogin();
    }
  }
}
```

#### `auth/invalid-token`
Token is invalid or malformed.

```typescript
try {
  await CapacitorAuthManager.refreshToken();
} catch (error) {
  if (error.code === 'auth/invalid-token') {
    console.error('Invalid token');
    // Clear stored tokens and redirect to login
    await CapacitorAuthManager.signOut();
    redirectToLogin();
  }
}
```

### Provider-Specific Errors

#### `auth/provider-not-available`
Provider not available on current platform.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'apple' });
} catch (error) {
  if (error.code === 'auth/provider-not-available') {
    console.log('Apple Sign In not available on this platform');
    // Show alternative sign in options
    showAlternativeProviders(['google', 'facebook']);
  }
}
```

#### `auth/provider-disabled`
Provider is disabled or not properly set up.

```typescript
try {
  await CapacitorAuthManager.signIn({ provider: 'facebook' });
} catch (error) {
  if (error.code === 'auth/provider-disabled') {
    console.error('Facebook provider is disabled');
    // Hide Facebook login button
    hideProviderOption('facebook');
  }
}
```

## Error Handling Patterns

### Basic Error Handling

```typescript
async function handleSignIn(provider: string) {
  try {
    const result = await CapacitorAuthManager.signIn({ provider });
    console.log('Sign in successful:', result.user);
    return result;
  } catch (error) {
    console.error('Sign in failed:', error);
    
    // Handle specific errors
    switch (error.code) {
      case 'auth/user-cancelled':
        // User cancelled - don't show error
        break;
      case 'auth/network-error':
        showError('Network error. Please check your connection.');
        break;
      case 'auth/invalid-credential':
        showError('Authentication failed. Please try again.');
        break;
      default:
        showError('Sign in failed. Please try again.');
    }
    
    throw error;
  }
}
```

### Advanced Error Handling with Retry

```typescript
async function handleSignInWithRetry(provider: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await CapacitorAuthManager.signIn({ provider });
      return result;
    } catch (error) {
      console.error(`Sign in attempt ${attempt} failed:`, error);
      
      // Don't retry user-cancelled or configuration errors
      if (error.code === 'auth/user-cancelled' || 
          error.code === 'auth/provider-not-configured') {
        throw error;
      }
      
      // Retry network errors and timeouts
      if (error.code === 'auth/network-error' || 
          error.code === 'auth/timeout') {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
      
      throw error;
    }
  }
}
```

### Centralized Error Handler

```typescript
class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  
  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }
  
  public handleError(error: AuthError, context?: string): void {
    console.error(`Auth error in ${context || 'unknown context'}:`, error);
    
    // Log error for analytics
    this.logError(error, context);
    
    // Show appropriate user message
    this.showUserMessage(error);
    
    // Take automatic actions if needed
    this.handleAutoActions(error);
  }
  
  private logError(error: AuthError, context?: string): void {
    // Send to error tracking service
    // analytics.track('auth_error', {
    //   code: error.code,
    //   message: error.message,
    //   provider: error.provider,
    //   context
    // });
  }
  
  private showUserMessage(error: AuthError): void {
    const userMessages = {
      'auth/user-cancelled': null, // Don't show message
      'auth/network-error': 'Please check your internet connection and try again.',
      'auth/invalid-credential': 'Authentication failed. Please try again.',
      'auth/account-exists-with-different-credential': 'An account with this email already exists. Please use a different sign-in method.',
      'auth/token-expired': 'Your session has expired. Please sign in again.',
      'auth/provider-not-available': 'This sign-in method is not available on your device.',
      'auth/provider-disabled': 'This sign-in method is currently unavailable.',
      'auth/timeout': 'Sign-in is taking too long. Please try again.',
      'auth/invalid-configuration': 'There is a configuration issue. Please contact support.',
      'auth/provider-not-configured': 'This sign-in method is not configured. Please contact support.'
    };
    
    const message = userMessages[error.code] || 'An unexpected error occurred. Please try again.';
    
    if (message) {
      this.showToast(message);
    }
  }
  
  private handleAutoActions(error: AuthError): void {
    switch (error.code) {
      case 'auth/token-expired':
        this.attemptTokenRefresh();
        break;
      case 'auth/invalid-token':
        this.clearAuthData();
        break;
      case 'auth/provider-not-available':
        this.hideProviderOption(error.provider);
        break;
    }
  }
  
  private async attemptTokenRefresh(): Promise<void> {
    try {
      await CapacitorAuthManager.refreshToken();
      this.showToast('Session refreshed successfully');
    } catch (refreshError) {
      this.clearAuthData();
      this.redirectToLogin();
    }
  }
  
  private async clearAuthData(): Promise<void> {
    await CapacitorAuthManager.signOut();
  }
  
  private redirectToLogin(): void {
    // Redirect to login page
    window.location.href = '/login';
  }
  
  private hideProviderOption(provider: string): void {
    // Hide provider button in UI
    document.getElementById(`${provider}-login-btn`)?.style.setProperty('display', 'none');
  }
  
  private showToast(message: string): void {
    // Show toast notification
    console.log('Toast:', message);
  }
}

// Usage
const errorHandler = AuthErrorHandler.getInstance();

try {
  await CapacitorAuthManager.signIn({ provider: 'google' });
} catch (error) {
  errorHandler.handleError(error, 'google-sign-in');
}
```

## Framework-Specific Error Handling

### React Error Boundary

```typescript
import React from 'react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: AuthError;
}

class AuthErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  AuthErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error: error as AuthError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-error">
          <h2>Authentication Error</h2>
          <p>Something went wrong with authentication.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<AuthErrorBoundary>
  <App />
</AuthErrorBoundary>
```

### React Hook for Error Handling

```typescript
import { useState, useCallback } from 'react';

interface UseAuthErrorReturn {
  error: AuthError | null;
  handleError: (error: AuthError) => void;
  clearError: () => void;
  isError: boolean;
}

export function useAuthError(): UseAuthErrorReturn {
  const [error, setError] = useState<AuthError | null>(null);

  const handleError = useCallback((error: AuthError) => {
    setError(error);
    
    // Auto-clear certain errors
    if (error.code === 'auth/user-cancelled') {
      setTimeout(() => setError(null), 100);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    isError: error !== null
  };
}

// Usage in component
function LoginComponent() {
  const { error, handleError, clearError, isError } = useAuthError();

  const handleSignIn = async (provider: string) => {
    try {
      clearError();
      await CapacitorAuthManager.signIn({ provider });
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      {isError && (
        <div className="error-message">
          {error.message}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={() => handleSignIn('google')}>
        Sign in with Google
      </button>
    </div>
  );
}
```

### Vue Error Handling

```vue
<template>
  <div>
    <div v-if="error" class="error-message">
      {{ error.message }}
      <button @click="clearError">Dismiss</button>
    </div>
    
    <button @click="signIn('google')" :disabled="loading">
      Sign in with Google
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { CapacitorAuthManager } from 'capacitor-auth-manager';

const error = ref(null);
const loading = ref(false);

const signIn = async (provider) => {
  try {
    loading.value = true;
    error.value = null;
    
    await CapacitorAuthManager.signIn({ provider });
  } catch (err) {
    error.value = err;
    console.error('Sign in error:', err);
  } finally {
    loading.value = false;
  }
};

const clearError = () => {
  error.value = null;
};
</script>
```

## Testing Error Scenarios

### Mock Error Responses

```typescript
// For testing purposes
export const mockAuthErrors = {
  userCancelled: {
    code: 'auth/user-cancelled',
    message: 'User cancelled the authentication flow',
    provider: 'google'
  },
  networkError: {
    code: 'auth/network-error',
    message: 'Network connection failed',
    provider: 'facebook'
  },
  invalidCredential: {
    code: 'auth/invalid-credential',
    message: 'Invalid authentication credential',
    provider: 'apple'
  }
};

// Test error handling
describe('Auth Error Handling', () => {
  it('should handle user cancellation gracefully', async () => {
    jest.spyOn(CapacitorAuthManager, 'signIn')
      .mockRejectedValue(mockAuthErrors.userCancelled);
    
    const { handleError } = useAuthError();
    
    try {
      await CapacitorAuthManager.signIn({ provider: 'google' });
    } catch (error) {
      handleError(error);
      expect(error.code).toBe('auth/user-cancelled');
    }
  });
});
```

## Best Practices

### 1. Always Handle Errors
```typescript
// Good
try {
  await CapacitorAuthManager.signIn({ provider: 'google' });
} catch (error) {
  handleError(error);
}

// Bad
CapacitorAuthManager.signIn({ provider: 'google' }); // Unhandled promise
```

### 2. Provide Meaningful Error Messages
```typescript
// Good
const userFriendlyMessage = {
  'auth/network-error': 'Please check your internet connection',
  'auth/invalid-credential': 'Authentication failed, please try again'
};

// Bad
showError(error.message); // Raw technical error message
```

### 3. Implement Retry Logic for Appropriate Errors
```typescript
// Good - retry network errors
if (error.code === 'auth/network-error') {
  await retryWithBackoff(() => signIn(provider));
}

// Bad - don't retry user cancellation
if (error.code === 'auth/user-cancelled') {
  await retryWithBackoff(() => signIn(provider)); // Don't do this
}
```

### 4. Log Errors for Debugging
```typescript
// Good
console.error('Auth error:', {
  code: error.code,
  message: error.message,
  provider: error.provider,
  timestamp: new Date().toISOString()
});

// Consider using error tracking service
// Sentry.captureException(error);
```

### 5. Handle Platform-Specific Errors
```typescript
// Good
if (error.code === 'auth/provider-not-available') {
  // Show alternative providers based on platform
  if (isPlatform('ios')) {
    showProviders(['apple', 'google']);
  } else {
    showProviders(['google', 'facebook']);
  }
}
```

## Common Pitfalls

### 1. Not Handling User Cancellation
```typescript
// Bad - shows error for user cancellation
catch (error) {
  showError(error.message); // Shows error even if user cancelled
}

// Good - handle cancellation gracefully
catch (error) {
  if (error.code !== 'auth/user-cancelled') {
    showError(error.message);
  }
}
```

### 2. Infinite Retry Loops
```typescript
// Bad - could retry forever
catch (error) {
  setTimeout(() => signIn(provider), 1000); // Infinite loop
}

// Good - limited retries
catch (error) {
  if (retryCount < maxRetries && error.code === 'auth/network-error') {
    retryCount++;
    setTimeout(() => signIn(provider), 1000);
  }
}
```

### 3. Not Clearing Errors
```typescript
// Bad - error persists
const [error, setError] = useState(null);

// Good - clear errors appropriately
const clearError = () => setError(null);
const handleNewSignIn = () => {
  clearError(); // Clear previous errors
  signIn(provider);
};
```

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community