import { ref, computed, readonly, onUnmounted, Ref, ComputedRef } from 'vue';
import { auth } from '../core/auth-manager';
import type { AuthState, AuthManagerConfig } from '../core/types';
import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  GetIdTokenOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
} from '../definitions';

interface UseAuthReturn {
  user: Readonly<Ref<AuthUser | null>>;
  isLoading: Readonly<Ref<boolean>>;
  isAuthenticated: Readonly<Ref<boolean>>;
  provider: Readonly<Ref<string | null>>;
  signIn: (providerOrOptions: string | SignInOptions) => Promise<AuthResult>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  refreshToken: (provider?: string) => Promise<AuthResult>;
  linkAccount: (options: LinkAccountOptions) => Promise<AuthResult>;
  unlinkAccount: (options: UnlinkAccountOptions) => Promise<void>;
  revokeAccess: (token?: string, provider?: string) => Promise<void>;
  getIdToken: (options?: GetIdTokenOptions) => Promise<string>;
  updateProfile: (options: UpdateProfileOptions) => Promise<AuthUser>;
  deleteAccount: (options?: DeleteAccountOptions) => Promise<void>;
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
  signIn: () => Promise<AuthResult>;
  signOut: (options?: SignOutOptions) => Promise<void>;
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
 *     // handle sign-in error (error is also exposed via the returned `error` ref)
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
      return await auth.signIn(providerOrOptions);
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
      return await auth.refreshToken(provider);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const linkAccount = async (options: LinkAccountOptions) => {
    error.value = null;
    try {
      return await auth.linkAccount(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const unlinkAccount = async (options: UnlinkAccountOptions) => {
    error.value = null;
    try {
      await auth.unlinkAccount(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const revokeAccess = async (token?: string, provider?: string) => {
    error.value = null;
    try {
      await auth.revokeAccess(token, provider);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const getIdToken = async (options?: GetIdTokenOptions) => {
    error.value = null;
    try {
      return await auth.getIdToken(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const updateProfile = async (options: UpdateProfileOptions) => {
    error.value = null;
    try {
      return await auth.updateProfile(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const deleteAccount = async (options?: DeleteAccountOptions) => {
    error.value = null;
    try {
      await auth.deleteAccount(options);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  return {
    user: readonly(computed(() => state.value.user)) as Readonly<Ref<AuthUser | null>>,
    isLoading: readonly(computed(() => state.value.isLoading)),
    isAuthenticated: readonly(computed(() => state.value.isAuthenticated)),
    provider: readonly(computed(() => state.value.provider)),
    signIn,
    signOut,
    refreshToken,
    linkAccount,
    unlinkAccount,
    revokeAccess,
    getIdToken,
    updateProfile,
    deleteAccount,
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
    user: readonly(computed(() => state.value.user)) as Readonly<Ref<AuthUser | null>>,
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

      // Check if configured (public accessor — no private state peeking)
      isConfigured.value = auth.isProviderConfigured(provider);
    } catch (err) {
      error.value = err as Error;
    }
  };

  // Initial check
  checkProvider();

  const signIn = async () => {
    error.value = null;
    try {
      return await auth.signIn(provider);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  const signOut = async (options?: SignOutOptions) => {
    error.value = null;
    try {
      // `provider` is the provider-name string passed to useAuthProvider(); the core signOut
      // treats it as a string key. Cast to satisfy SignOutOptions' enum-typed field.
      await auth.signOut({
        ...options,
        provider: provider as SignOutOptions['provider'],
      });
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

  const configure = async (config: AuthManagerConfig) => {
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
