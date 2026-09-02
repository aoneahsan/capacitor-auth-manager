import { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../core/auth-manager.js';
import type { AuthState } from '../core/types.js';
import type {
  AuthUser,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  GetIdTokenOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
} from '../definitions.js';
import type {
  UseAuthReturn,
  UseAuthStateReturn,
  UseAuthProviderReturn,
} from './types.js';

/**
 * Hook for complete authentication functionality
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { user, signIn, signOut, isLoading } = useAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   if (user) {
 *     return (
 *       <div>
 *         <p>Welcome, {user.displayName}!</p>
 *         <button onClick={() => signOut()}>Sign Out</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <button onClick={() => signIn('google')}>
 *       Sign In with Google
 *     </button>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(auth.getAuthState());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChange((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(
    async (providerOrOptions: string | SignInOptions) => {
      setError(null);
      try {
        return await auth.signIn(providerOrOptions);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const signOut = useCallback(async (options?: SignOutOptions) => {
    setError(null);
    try {
      await auth.signOut(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const refreshToken = useCallback(async (provider?: string) => {
    setError(null);
    try {
      return await auth.refreshToken(provider);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const linkAccount = useCallback(async (options: LinkAccountOptions) => {
    setError(null);
    try {
      return await auth.linkAccount(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const unlinkAccount = useCallback(async (options: UnlinkAccountOptions) => {
    setError(null);
    try {
      await auth.unlinkAccount(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const revokeAccess = useCallback(
    async (token?: string, provider?: string) => {
      setError(null);
      try {
        await auth.revokeAccess(token, provider);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  const getIdToken = useCallback(async (options?: GetIdTokenOptions) => {
    setError(null);
    try {
      return await auth.getIdToken(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (options: UpdateProfileOptions) => {
    setError(null);
    try {
      return await auth.updateProfile(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (options?: DeleteAccountOptions) => {
    setError(null);
    try {
      await auth.deleteAccount(options);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    provider: state.provider,
    signIn,
    signOut,
    refreshToken,
    linkAccount,
    unlinkAccount,
    revokeAccess,
    getIdToken,
    updateProfile,
    deleteAccount,
    error,
  };
}

/**
 * Hook for read-only auth state
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, isAuthenticated } = useAuthState();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in to view your profile</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <img src={user.photoURL} alt={user.displayName} />
 *       <h2>{user.displayName}</h2>
 *       <p>{user.email}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthState(): UseAuthStateReturn {
  const [state, setState] = useState<AuthState>(auth.getAuthState());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChange((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    provider: state.provider,
  };
}

/**
 * Hook for specific auth provider functionality
 * @example
 * ```tsx
 * function GoogleLoginButton() {
 *   const { signIn, isSupported, isConfigured } = useAuthProvider('google');
 *
 *   if (!isSupported) {
 *     return <div>Google Sign-In is not supported on this platform</div>;
 *   }
 *
 *   if (!isConfigured) {
 *     return <div>Google Sign-In is not configured</div>;
 *   }
 *
 *   return (
 *     <button onClick={() => signIn({ scopes: ['email', 'profile'] })}>
 *       Sign In with Google
 *     </button>
 *   );
 * }
 * ```
 */
export function useAuthProvider(provider: string): UseAuthProviderReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkProvider = async () => {
      try {
        const supported = await auth.isProviderSupported(provider);
        if (mountedRef.current) {
          setIsSupported(supported);
        }

        // Check if configured (public accessor — no private state peeking)
        if (mountedRef.current) {
          setIsConfigured(auth.isProviderConfigured(provider));
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
        }
      }
    };

    checkProvider();

    return () => {
      mountedRef.current = false;
    };
  }, [provider]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      // Pass provider as string directly, which is supported by our new API
      return await auth.signIn(provider);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [provider]);

  const signOut = useCallback(
    async (options?: SignOutOptions) => {
      setError(null);
      try {
        await auth.signOut({
          ...options,
          // `provider` here is the provider-name string passed to useAuthProvider(); the core
          // signOut treats it as a string key. Cast to satisfy SignOutOptions' enum-typed field.
          provider: provider as SignOutOptions['provider'],
        });
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [provider]
  );

  return {
    isSupported,
    isConfigured,
    signIn,
    signOut,
    error,
  };
}

/**
 * Hook to get the current authenticated user
 * @example
 * ```tsx
 * function Avatar() {
 *   const user = useUser();
 *
 *   if (!user) return null;
 *
 *   return (
 *     <img
 *       src={user.photoURL || '/default-avatar.png'}
 *       alt={user.displayName || 'User'}
 *     />
 *   );
 * }
 * ```
 */
export function useUser(): AuthUser | null {
  const { user } = useAuthState();
  return user;
}

/**
 * Hook to check if user is authenticated
 * @example
 * ```tsx
 * function ProtectedRoute({ children }) {
 *   const isAuthenticated = useIsAuthenticated();
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />;
 *   }
 *
 *   return children;
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthState();
  return isAuthenticated;
}
