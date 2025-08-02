import { ref, computed, readonly, onUnmounted, Ref, ComputedRef } from 'vue';
import { auth } from '../core/auth-manager';
import type { AuthState } from '../core/types';
import type { AuthUser, SignInOptions, SignOutOptions } from '../definitions';

interface UseAuthReturn {
  user: Readonly<Ref<AuthUser | null>>;
  isLoading: Readonly<Ref<boolean>>;
  isAuthenticated: Readonly<Ref<boolean>>;
  provider: Readonly<Ref<string | null>>;
  signIn: (providerOrOptions: string | SignInOptions) => Promise<any>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  refreshToken: (provider?: string) => Promise<any>;
  error: Readonly<Ref<Error | null>>;
}

interface UseAuthStateReturn {
  user: Readonly<Ref<AuthUser | null>>;
  isLoading: Readonly<Ref<boolean>>;
  isAuthenticated: Readonly<Ref<boolean>>;
  provider: Readonly<Ref<string | null>>;
}

interface UseAuthProviderReturn {
  isSupported: Readonly<Ref<boolean>>;
  isConfigured: Readonly<Ref<boolean>>;
  signIn: () => Promise<any>;
  signOut: (options?: any) => Promise<void>;
  error: Readonly<Ref<Error | null>>;
}

/**
 * Vue 3 composable for complete authentication functionality
 * @example
 * ```vue
 * <script setup>
 * import { useAuth } from 'capacitor-auth-manager/vue';
 * 
 * const { user, signIn, signOut, isLoading } = useAuth();
 * 
 * async function handleGoogleSignIn() {
 *   try {
 *     await signIn('google');
 *   } catch (error) {
 *     console.error('Sign in failed:', error);
 *   }
 * }
 * </script>
 * 
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="user">
 *     <p>Welcome, {{ user.displayName }}!</p>
 *     <button @click="signOut()">Sign Out</button>
 *   </div>
 *   <div v-else>
 *     <button @click="handleGoogleSignIn">Sign In with Google</button>
 *   </div>
 * </template>
 * ```
 */
export function useAuth(): UseAuthReturn {
  const state = ref<AuthState>(auth.getAuthState());
  const error = ref<Error | null>(null);

  // Subscribe to auth state changes
  const unsubscribe = auth.onAuthStateChange((newState) => {
    state.value = newState;
  });

  // Unsubscribe on component unmount
  onUnmounted(() => {
    unsubscribe();
  });

  const signIn = async (providerOrOptions: string | SignInOptions) => {
    error.value = null;
    try {
      const result = await auth.signIn(providerOrOptions);
      return result;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const signOut = async (options?: SignOutOptions) => {
    error.value = null;
    try {
      await auth.signOut(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const refreshToken = async (provider?: string) => {
    error.value = null;
    try {
      const result = await auth.refreshToken(provider);
      return result;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  return {
    user: readonly(computed(() => state.value.user)),
    isLoading: readonly(computed(() => state.value.isLoading)),
    isAuthenticated: readonly(computed(() => state.value.isAuthenticated)),
    provider: readonly(computed(() => state.value.provider)),
    signIn,
    signOut,
    refreshToken,
    error: readonly(error),
  };
}

/**
 * Vue 3 composable for auth state only (no methods)
 * @example
 * ```vue
 * <script setup>
 * import { useAuthState } from 'capacitor-auth-manager/vue';
 * 
 * const { user, isAuthenticated } = useAuthState();
 * </script>
 * ```
 */
export function useAuthState(): UseAuthStateReturn {
  const state = ref<AuthState>(auth.getAuthState());

  const unsubscribe = auth.onAuthStateChange((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    user: readonly(computed(() => state.value.user)),
    isLoading: readonly(computed(() => state.value.isLoading)),
    isAuthenticated: readonly(computed(() => state.value.isAuthenticated)),
    provider: readonly(computed(() => state.value.provider)),
  };
}

/**
 * Vue 3 composable to get just the current user
 * @example
 * ```vue
 * <script setup>
 * import { useUser } from 'capacitor-auth-manager/vue';
 * 
 * const user = useUser();
 * </script>
 * ```
 */
export function useUser(): ComputedRef<AuthUser | null> {
  const { user } = useAuthState();
  return user as ComputedRef<AuthUser | null>;
}

/**
 * Vue 3 composable for specific auth provider
 * @example
 * ```vue
 * <script setup>
 * import { useAuthProvider } from 'capacitor-auth-manager/vue';
 * 
 * const google = useAuthProvider('google');
 * const github = useAuthProvider('github');
 * </script>
 * ```
 */
export function useAuthProvider(provider: string): UseAuthProviderReturn {
  const isSupported = ref(false);
  const isConfigured = ref(false);
  const error = ref<Error | null>(null);

  // Check provider support and configuration
  const checkProvider = async () => {
    try {
      isSupported.value = await auth.isProviderSupported(provider);
      
      // Check if configured
      const config = (auth as any).config?.providers?.[provider];
      isConfigured.value = !!config;
    } catch (err) {
      error.value = err as Error;
    }
  };

  // Initial check
  checkProvider();

  const signIn = async () => {
    error.value = null;
    try {
      const result = await auth.signIn(provider);
      return result;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const signOut = async (options?: any) => {
    error.value = null;
    try {
      await auth.signOut({ ...options, provider });
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  return {
    isSupported: readonly(isSupported),
    isConfigured: readonly(isConfigured),
    signIn,
    signOut,
    error: readonly(error),
  };
}

/**
 * Vue 3 composable for auth configuration
 * @example
 * ```vue
 * <script setup>
 * import { useAuthConfig } from 'capacitor-auth-manager/vue';
 * 
 * const { configure, isInitialized } = useAuthConfig();
 * 
 * // Configure on mount
 * configure({
 *   providers: {
 *     google: { clientId: 'YOUR_CLIENT_ID' }
 *   }
 * });
 * </script>
 * ```
 */
export function useAuthConfig() {
  const isInitialized = ref(false);
  const error = ref<Error | null>(null);

  const configure = async (config: any) => {
    error.value = null;
    try {
      auth.configure(config);
      await auth.initialize();
      isInitialized.value = true;
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  return {
    configure,
    isInitialized: readonly(isInitialized),
    error: readonly(error),
  };
}