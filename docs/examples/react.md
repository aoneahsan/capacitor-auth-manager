# React Integration Guide

This guide demonstrates how to integrate Capacitor Auth Manager with a React application, including hooks, context providers, and best practices.

## Installation

```bash
# Install dependencies
npm install capacitor-auth-manager
npm install @capacitor/core

# For TypeScript projects
npm install --save-dev @types/react
```

## Basic Setup

### 1. Create Auth Context

Create `contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CapacitorAuthManager, AuthState, User } from 'capacitor-auth-manager';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize auth manager
    initializeAuth();

    // Set up auth state listener
    const listener = CapacitorAuthManager.addAuthStateListener((state) => {
      setAuthState(state);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      await CapacitorAuthManager.initialize({
        providers: {
          google: {
            webClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID!,
          },
          apple: {
            clientId: process.env.REACT_APP_APPLE_CLIENT_ID!,
          },
          facebook: {
            appId: process.env.REACT_APP_FACEBOOK_APP_ID!,
          },
        },
      });

      // Get initial auth state
      const state = await CapacitorAuthManager.getCurrentUser();
      setAuthState(state);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await CapacitorAuthManager.signIn({ provider });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await CapacitorAuthManager.signOut();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user: authState?.user || null,
    isAuthenticated: authState?.isAuthenticated || false,
    isLoading,
    signIn,
    signOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 2. Create Auth Hooks

Create `hooks/useCapacitorAuth.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import {
  CapacitorAuthManager,
  AuthState,
  SignInOptions,
  AuthResult,
} from 'capacitor-auth-manager';

export const useCapacitorAuth = () => {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let listener: any;

    const init = async () => {
      try {
        const state = await CapacitorAuthManager.getCurrentUser();
        setAuthState(state);

        listener = CapacitorAuthManager.addAuthStateListener(setAuthState);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  const signIn = useCallback(
    async (options: SignInOptions): Promise<AuthResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await CapacitorAuthManager.signIn(options);
        return result;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await CapacitorAuthManager.signOut();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const result = await CapacitorAuthManager.refreshToken();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    user: authState?.user || null,
    isAuthenticated: authState?.isAuthenticated || false,
    accessToken: authState?.accessToken || null,
    loading,
    error,
    signIn,
    signOut,
    refreshToken,
  };
};
```

### 3. Protected Route Component

Create `components/ProtectedRoute.tsx`:

```tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <>{children}</>;
};
```

## Complete Example App

### App.tsx

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path='/login'
            element={<LoginPage />}
          />
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/'
            element={<Navigate to='/dashboard' />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### LoginPage.tsx

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading, error } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    try {
      setSelectedProvider(provider);
      await signIn(provider);
      navigate('/dashboard');
    } catch (err) {
      console.error('Sign in error:', err);
      // Error is already set in context
    } finally {
      setSelectedProvider(null);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-container'>
        <h1>Welcome Back</h1>
        <p>Sign in to continue</p>

        {error && <div className='error-message'>{error.message}</div>}

        <div className='auth-buttons'>
          <button
            className='auth-button google'
            onClick={() => handleSignIn('google')}
            disabled={isLoading}
          >
            {selectedProvider === 'google' && isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <img
                  src='/google-icon.svg'
                  alt='Google'
                />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <button
            className='auth-button apple'
            onClick={() => handleSignIn('apple')}
            disabled={isLoading}
          >
            {selectedProvider === 'apple' && isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <img
                  src='/apple-icon.svg'
                  alt='Apple'
                />
                <span>Continue with Apple</span>
              </>
            )}
          </button>

          <button
            className='auth-button facebook'
            onClick={() => handleSignIn('facebook')}
            disabled={isLoading}
          >
            {selectedProvider === 'facebook' && isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <img
                  src='/facebook-icon.svg'
                  alt='Facebook'
                />
                <span>Continue with Facebook</span>
              </>
            )}
          </button>

          <button
            className='auth-button microsoft'
            onClick={() => handleSignIn('microsoft')}
            disabled={isLoading}
          >
            {selectedProvider === 'microsoft' && isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <img
                  src='/microsoft-icon.svg'
                  alt='Microsoft'
                />
                <span>Continue with Microsoft</span>
              </>
            )}
          </button>
        </div>

        <div className='divider'>
          <span>or</span>
        </div>

        <button
          className='auth-button email'
          onClick={() => navigate('/login/email')}
          disabled={isLoading}
        >
          <span>Continue with Email</span>
        </button>
      </div>
    </div>
  );
};
```

### ProfilePage.tsx

```tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CapacitorAuthManager } from 'capacitor-auth-manager';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [linking, setLinking] = useState<string | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);

  React.useEffect(() => {
    loadLinkedProviders();
  }, []);

  const loadLinkedProviders = async () => {
    const state = await CapacitorAuthManager.getCurrentUser();
    setLinkedProviders(state.linkedProviders || []);
  };

  const handleLinkProvider = async (provider: string) => {
    try {
      setLinking(provider);
      await CapacitorAuthManager.linkProvider({ provider });
      await loadLinkedProviders();
      alert(`Successfully linked ${provider} account`);
    } catch (error) {
      console.error('Link provider error:', error);
      alert(`Failed to link ${provider}: ${error.message}`);
    } finally {
      setLinking(null);
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    try {
      await CapacitorAuthManager.unlinkProvider({ provider });
      await loadLinkedProviders();
      alert(`Successfully unlinked ${provider} account`);
    } catch (error) {
      console.error('Unlink provider error:', error);
      alert(`Failed to unlink ${provider}: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className='profile-page'>
      <div className='profile-container'>
        <div className='profile-header'>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              className='profile-avatar'
            />
          )}
          <h1>{user.displayName || 'User'}</h1>
          <p>{user.email}</p>
        </div>

        <div className='profile-section'>
          <h2>Account Information</h2>
          <div className='info-grid'>
            <div>
              <label>User ID:</label>
              <span>{user.uid}</span>
            </div>
            <div>
              <label>Email Verified:</label>
              <span>{user.emailVerified ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <label>Provider:</label>
              <span>{user.providerId}</span>
            </div>
            <div>
              <label>Created:</label>
              <span>
                {new Date(user.metadata.creationTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className='profile-section'>
          <h2>Linked Accounts</h2>
          <div className='linked-accounts'>
            {['google', 'apple', 'facebook', 'microsoft', 'github'].map(
              (provider) => {
                const isLinked = linkedProviders.includes(provider);
                return (
                  <div
                    key={provider}
                    className='provider-row'
                  >
                    <span className='provider-name'>{provider}</span>
                    {isLinked ? (
                      <button
                        onClick={() => handleUnlinkProvider(provider)}
                        className='unlink-button'
                        disabled={linkedProviders.length === 1}
                      >
                        Unlink
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLinkProvider(provider)}
                        className='link-button'
                        disabled={linking === provider}
                      >
                        {linking === provider ? 'Linking...' : 'Link'}
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className='profile-actions'>
          <button
            onClick={handleSignOut}
            className='sign-out-button'
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Advanced Features

### Token Management Hook

```typescript
// hooks/useAuthToken.ts
import { useEffect, useState } from 'react';
import { CapacitorAuthManager } from 'capacitor-auth-manager';

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkToken = async () => {
      const authState = await CapacitorAuthManager.getCurrentUser();

      if (authState.isAuthenticated && authState.accessToken) {
        setToken(authState.accessToken);

        const expired = await CapacitorAuthManager.isTokenExpired();
        setIsExpired(expired);

        if (expired) {
          try {
            await CapacitorAuthManager.refreshToken();
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }
      } else {
        setToken(null);
        setIsExpired(false);
      }
    };

    checkToken();

    // Check token every 5 minutes
    interval = setInterval(checkToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { token, isExpired };
};
```

### API Integration Hook

```typescript
// hooks/useAuthenticatedApi.ts
import { useCallback } from 'react';
import { useAuthToken } from './useAuthToken';

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

export const useAuthenticatedApi = () => {
  const { token } = useAuthToken();

  const request = useCallback(
    async (url: string, options: RequestOptions = {}) => {
      const { authenticated = true, headers = {}, ...restOptions } = options;

      const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (authenticated && token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...restOptions,
        headers: finalHeaders,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, trigger refresh
          await CapacitorAuthManager.refreshToken();

          // Retry request with new token
          const newState = await CapacitorAuthManager.getCurrentUser();
          if (newState.accessToken) {
            finalHeaders['Authorization'] = `Bearer ${newState.accessToken}`;
            return fetch(url, { ...restOptions, headers: finalHeaders });
          }
        }

        throw new Error(`API Error: ${response.status}`);
      }

      return response;
    },
    [token]
  );

  const get = useCallback(
    (url: string, options?: RequestOptions) =>
      request(url, { ...options, method: 'GET' }),
    [request]
  );

  const post = useCallback(
    (url: string, data: any, options?: RequestOptions) =>
      request(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [request]
  );

  const put = useCallback(
    (url: string, data: any, options?: RequestOptions) =>
      request(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [request]
  );

  const del = useCallback(
    (url: string, options?: RequestOptions) =>
      request(url, { ...options, method: 'DELETE' }),
    [request]
  );

  return { get, post, put, delete: del };
};

// Usage
const MyComponent = () => {
  const api = useAuthenticatedApi();

  const loadUserData = async () => {
    const response = await api.get('/api/user/profile');
    const data = await response.json();
    return data;
  };
};
```

### Biometric Authentication Component

```tsx
// components/BiometricAuth.tsx
import React, { useState, useEffect } from 'react';
import { CapacitorAuthManager } from 'capacitor-auth-manager';

export const BiometricAuth: React.FC = () => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available =
      await CapacitorAuthManager.isProviderAvailable('biometric');
    setBiometricAvailable(available);

    if (available) {
      // Get biometric type (fingerprint, face, etc.)
      const config = await CapacitorAuthManager.getProviderConfig('biometric');
      setBiometricType(config?.type || 'biometric');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await CapacitorAuthManager.signIn({
        provider: 'biometric',
        customParameters: {
          reason: 'Authenticate to access your account',
        },
      });

      console.log('Biometric auth successful:', result);
    } catch (error) {
      console.error('Biometric auth failed:', error);

      if (error.code === 'auth/biometric-not-enrolled') {
        alert('Please enroll biometric authentication in your device settings');
      }
    }
  };

  if (!biometricAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleBiometricAuth}
      className='biometric-button'
    >
      {biometricType === 'face' ? '👤' : '👆'}
      Use {biometricType} Authentication
    </button>
  );
};
```

## Testing

### Mock Auth for Development

```typescript
// mocks/mockAuth.ts
import { CapacitorAuthManager } from 'capacitor-auth-manager';

export const setupMockAuth = () => {
  if (process.env.NODE_ENV === 'development') {
    // Override methods for testing
    CapacitorAuthManager.signIn = async (options) => {
      console.log('Mock sign in:', options);

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        user: {
          uid: 'mock-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://via.placeholder.com/150',
          emailVerified: true,
          providerId: options.provider,
          phoneNumber: null,
          isAnonymous: false,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
          providerData: [],
        },
        credential: {
          providerId: options.provider,
          signInMethod: options.provider,
        },
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        expiresAt: Date.now() + 3600000,
      };
    };
  }
};
```

### Component Tests

```tsx
// __tests__/LoginPage.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../contexts/AuthContext';

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  it('renders sign in buttons', () => {
    const { getByText } = renderWithAuth(<LoginPage />);

    expect(getByText('Continue with Google')).toBeInTheDocument();
    expect(getByText('Continue with Apple')).toBeInTheDocument();
    expect(getByText('Continue with Facebook')).toBeInTheDocument();
  });

  it('handles sign in click', async () => {
    const { getByText } = renderWithAuth(<LoginPage />);

    const googleButton = getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(googleButton).toBeDisabled();
    });
  });
});
```

## Performance Optimization

### Lazy Loading Auth Providers

```tsx
// utils/lazyAuth.ts
export const lazyLoadProvider = async (provider: string) => {
  switch (provider) {
    case 'google':
      await import(/* webpackChunkName: "google-auth" */ './providers/google');
      break;
    case 'facebook':
      await import(
        /* webpackChunkName: "facebook-auth" */ './providers/facebook'
      );
      break;
    // Add other providers
  }
};

// Usage in component
const handleSignIn = async (provider: string) => {
  await lazyLoadProvider(provider);
  await signIn(provider);
};
```

### Memoized User Data

```tsx
import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  const userInitials = useMemo(() => {
    if (!user?.displayName) return '?';

    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }, [user?.displayName]);

  const memberSince = useMemo(() => {
    if (!user?.metadata.creationTime) return null;

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(new Date(user.metadata.creationTime));
  }, [user?.metadata.creationTime]);

  // Rest of component
};
```

## Deployment Considerations

### Environment Variables

Create `.env` files for different environments:

```bash
# .env.development
REACT_APP_GOOGLE_CLIENT_ID=your-dev-client-id
REACT_APP_APPLE_CLIENT_ID=your-dev-apple-id
REACT_APP_API_URL=http://localhost:3000

# .env.production
REACT_APP_GOOGLE_CLIENT_ID=your-prod-client-id
REACT_APP_APPLE_CLIENT_ID=your-prod-apple-id
REACT_APP_API_URL=https://api.yourapp.com
```

### Build Configuration

```json
// package.json
{
  "scripts": {
    "build:web": "react-scripts build",
    "build:ios": "npm run build:web && npx cap sync ios",
    "build:android": "npm run build:web && npx cap sync android",
    "build:all": "npm run build:web && npx cap sync"
  }
}
```

---

Created by [Ahsan Mahmood](https://aoneahsan.com) - Open source for the community
