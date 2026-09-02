import { EventEmitter } from '../utils/event-emitter.js';
import { Logger } from '../utils/logger.js';
import { WebStorage, StorageInterface } from '../utils/storage.js';
import { AuthError } from '../utils/auth-error.js';
import { ProviderRegistry } from './provider-registry.js';
import type { ProviderDeps } from './provider-registry.js';
import type { AuthManagerConfig, AuthState, AuthStateListener } from './types.js';
import type {
  AuthUser,
  AuthCredential,
  AuthResult,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  GetIdTokenOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
} from '../definitions.js';
import { AuthProvider, AuthErrorCode, AuthPersistence } from '../definitions.js';

/**
 * Maps the config's persistence literal to the {@link AuthPersistence} enum WebStorage expects.
 * Critically, `'memory'` maps to {@link AuthPersistence.NONE} (`'none'`) — previously the literal
 * was cast via `as any` and fell through WebStorage's switch to localStorage, silently breaking
 * in-memory persistence.
 */
function toAuthPersistence(
  persistence: 'local' | 'session' | 'memory' | undefined
): AuthPersistence {
  switch (persistence) {
    case 'session':
      return AuthPersistence.SESSION;
    case 'memory':
      return AuthPersistence.NONE;
    case 'local':
    default:
      return AuthPersistence.LOCAL;
  }
}

class AuthManagerCore {
  private state: AuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    provider: null,
  };

  private stateEmitter = new EventEmitter<AuthState>();
  private storage: StorageInterface;
  private logger: Logger;
  private config: AuthManagerConfig = {};
  private isInitialized = false;
  private tokenRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private initPromise: Promise<void> | null = null;
  private currentPersistence: string | undefined;

  constructor() {
    this.logger = new Logger({
      enableLogging: false,
      logLevel: 'info',
      prefix: 'AuthManager',
    });
    this.storage = new WebStorage(
      AuthPersistence.LOCAL,
      undefined,
      this.logger
    );
    this.currentPersistence = 'local';

    // Auto-initialize on first use
    if (typeof window !== 'undefined') {
      this.initialize().catch((err) => {
        this.logger.error('Auto-initialization failed:', err);
      });
    }
  }

  async initialize(config?: AuthManagerConfig): Promise<void> {
    if (this.isInitialized && !config) {
      return;
    }

    // Coalesce concurrent first-time initialization (e.g. the constructor's auto-init
    // racing with an explicit initialize()) so restoreAuthState does not run twice.
    if (this.initPromise && !config) {
      return this.initPromise;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Configure logger
    if (this.config.enableLogging !== undefined) {
      this.logger.setEnabled(this.config.enableLogging);
    }
    if (this.config.logLevel) {
      this.logger.setLogLevel(this.config.logLevel);
    }

    // A custom storage backend (e.g. secure native storage) takes precedence. Otherwise only
    // recreate storage when persistence actually changes (don't discard in-memory state on a
    // no-op re-initialize).
    if (this.config.storage) {
      this.storage = this.config.storage;
      this.currentPersistence = 'custom';
    } else if (
      this.config.persistence &&
      this.config.persistence !== this.currentPersistence
    ) {
      this.storage = new WebStorage(
        toAuthPersistence(this.config.persistence),
        undefined,
        this.logger
      );
      this.currentPersistence = this.config.persistence;
    }

    // Restore auth state
    this.initPromise = this.restoreAuthState();
    await this.initPromise;

    this.isInitialized = true;
    this.logger.info('Auth manager initialized');
  }

  configure(config: AuthManagerConfig): void {
    this.config = { ...this.config, ...config };

    if (config.enableLogging !== undefined) {
      this.logger.setEnabled(config.enableLogging);
    }
    if (config.logLevel) {
      this.logger.setLogLevel(config.logLevel);
    }
    if (config.storage) {
      this.storage = config.storage;
      this.currentPersistence = 'custom';
    } else if (
      config.persistence &&
      config.persistence !== this.currentPersistence
    ) {
      this.storage = new WebStorage(
        toAuthPersistence(config.persistence),
        undefined,
        this.logger
      );
      this.currentPersistence = config.persistence;
    }

    // Now that providers may be configured, (re)attempt session restore so a persisted
    // session is rehydrated even when the singleton auto-initialized before configure().
    if (config.providers && Object.keys(config.providers).length > 0) {
      void this.restoreAuthState();
    }
  }

  async signIn(providerOrOptions: string | SignInOptions): Promise<AuthResult> {
    await this.ensureInitialized();

    let providerName: string;
    let signInOptions: {
      credentials?: SignInOptions['credentials'];
      options?: SignInOptions['options'];
    } = {};

    if (typeof providerOrOptions === 'string') {
      providerName = providerOrOptions;
    } else {
      // Convert AuthProvider enum to string if needed
      providerName =
        typeof providerOrOptions.provider === 'string'
          ? providerOrOptions.provider
          : AuthProvider[providerOrOptions.provider];
      signInOptions = {
        credentials: providerOrOptions.credentials,
        options: providerOrOptions.options,
      };
    }

    this.updateState({ isLoading: true });

    try {
      // Get provider configuration
      const providerConfig = this.config.providers?.[providerName];
      if (!providerConfig) {
        throw new AuthError(
          'auth/missing-configuration',
          `Provider '${providerName}' is not configured. Call auth.configure() first.`
        );
      }

      // Get provider instance
      const provider = await ProviderRegistry.getProvider(
        providerName,
        providerConfig,
        this.getProviderDeps()
      );

      // Sign in. Credentials are spread to the top level (where credential providers read
      // email/password/phoneNumber/username) AND kept nested under `credentials` for
      // providers that read them there.
      this.logger.info(`Signing in with ${providerName}`);
      // The provider reads credentials/options from this merged shape; `provider` is supplied via
      // construction, not here, so we assert to SignInOptions (whose `provider` is required).
      const result = await provider.signIn({
        ...signInOptions.options,
        ...(signInOptions.credentials ?? {}),
        credentials: signInOptions.credentials,
      } as SignInOptions);

      // Update state
      this.updateState({
        user: result.user,
        isAuthenticated: true,
        provider: providerName,
        isLoading: false,
      });

      // Store a NON-SECRET session snapshot. We deliberately do NOT persist idToken / accessToken /
      // refreshToken / serverAuthCode to the default storage (localStorage on web, Preferences on
      // native — neither hardware-encrypted). Short-lived tokens are re-derived via the provider's
      // silent restore (getCurrentUser) / refreshToken(); persisting them at rest is a needless secret
      // exposure. Consumers who need token persistence can inject a secure storage adapter and read
      // tokens from the live AuthResult.
      await this.storage.set('auth_state', {
        user: result.user,
        provider: providerName,
        credential: this.sanitizeCredentialForStorage(result.credential),
      });

      // Setup token refresh
      if (this.config.autoRefreshToken && result.credential?.refreshToken) {
        this.setupTokenRefresh(providerName, result.credential);
      }

      return result;
    } catch (error) {
      this.updateState({ isLoading: false });
      this.logger.error(`Sign in failed for ${providerName}`, error);
      throw AuthError.fromError(error);
    }
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    await this.ensureInitialized();

    const provider = options?.provider || this.state.provider;
    if (!provider) {
      this.logger.warn('No active auth session to sign out from');
      return;
    }

    this.updateState({ isLoading: true });

    try {
      // Get provider instance
      const providerConfig = this.config.providers?.[provider];
      const providerInstance = await ProviderRegistry.getProvider(
        provider,
        providerConfig,
        this.getProviderDeps()
      );

      // Sign out
      await providerInstance.signOut(options);

      // Clear token refresh. When no specific provider was targeted, clear ALL refresh timers
      // (not just the active provider's) so a global sign-out leaves no orphaned timers behind.
      if (options?.provider) {
        this.clearTokenRefresh(provider);
      } else {
        this.clearAllTokenRefresh();
      }

      // Clear state
      this.updateState({
        user: null,
        isAuthenticated: false,
        provider: null,
        isLoading: false,
      });

      // Clear storage
      await this.storage.remove('auth_state');

      this.logger.info(`Signed out from ${provider}`);
    } catch (error) {
      this.updateState({ isLoading: false });
      this.logger.error(`Sign out failed for ${provider}`, error);
      throw AuthError.fromError(error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.state.user;
  }

  getAuthState(): AuthState {
    return { ...this.state };
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getCurrentProvider(): string | null {
    return this.state.provider;
  }

  async refreshToken(provider?: string): Promise<AuthResult> {
    await this.ensureInitialized();

    const targetProvider = provider || this.state.provider;
    if (!targetProvider) {
      throw new AuthError(
        'auth/no-auth-session',
        'No active auth session to refresh'
      );
    }

    try {
      const providerConfig = this.config.providers?.[targetProvider];
      const providerInstance = await ProviderRegistry.getProvider(
        targetProvider,
        providerConfig,
        this.getProviderDeps()
      );

      if (!providerInstance.refreshToken) {
        throw new AuthError(
          AuthErrorCode.OPERATION_NOT_SUPPORTED,
          `Provider '${targetProvider}' does not support token refresh`
        );
      }

      const result = await providerInstance.refreshToken();

      // Update user
      this.updateState({ user: result.user });

      // Setup new token refresh
      if (this.config.autoRefreshToken && result.credential?.refreshToken) {
        this.setupTokenRefresh(targetProvider, result.credential);
      }

      return result;
    } catch (error) {
      this.logger.error(`Token refresh failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Links an additional auth credential to the current account, delegating to the resolved
   * provider's optional `linkAccount`. Throws `OPERATION_NOT_ALLOWED` if the provider doesn't
   * implement it. Mirrors `CapacitorAuthManagerWeb.linkAccount` so React/Vue/Angular consumers
   * reach the same capability through the `auth` singleton.
   */
  async linkAccount(options: LinkAccountOptions): Promise<AuthResult> {
    await this.ensureInitialized();
    const providerName =
      typeof options.provider === 'string'
        ? options.provider
        : AuthProvider[options.provider];
    const provider = await this.resolveProvider(providerName);

    if (typeof provider.linkAccount !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `linkAccount not supported for ${providerName}`
      );
    }

    try {
      const result = await provider.linkAccount(options);
      this.updateState({ user: result.user });
      return result;
    } catch (error) {
      this.logger.error(`Account linking failed for ${providerName}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Unlinks a provider credential from the current account via the resolved provider's optional
   * `unlinkAccount`. Throws `OPERATION_NOT_ALLOWED` if unsupported.
   */
  async unlinkAccount(options: UnlinkAccountOptions): Promise<void> {
    await this.ensureInitialized();
    const providerName =
      typeof options.provider === 'string'
        ? options.provider
        : AuthProvider[options.provider];
    const provider = await this.resolveProvider(providerName);

    if (typeof provider.unlinkAccount !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `unlinkAccount not supported for ${providerName}`
      );
    }

    try {
      await provider.unlinkAccount(options);
    } catch (error) {
      this.logger.error(`Account unlinking failed for ${providerName}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Revokes the access/refresh token for a provider (current provider when `provider` is omitted),
   * delegating to the provider's optional `revokeAccess`. Throws `OPERATION_NOT_ALLOWED` if
   * unsupported.
   */
  async revokeAccess(token?: string, provider?: string): Promise<void> {
    await this.ensureInitialized();
    const targetProvider = provider || this.state.provider;
    if (!targetProvider) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active auth session to revoke access for'
      );
    }
    const providerInstance = await this.resolveProvider(targetProvider);

    if (typeof providerInstance.revokeAccess !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `revokeAccess not supported for ${targetProvider}`
      );
    }

    try {
      await providerInstance.revokeAccess(token);
    } catch (error) {
      this.logger.error(`Access revocation failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Returns the current ID token for a provider (current provider when `provider` is omitted) by
   * delegating to the provider's optional `getIdToken`. Throws `OPERATION_NOT_ALLOWED` if the
   * provider doesn't issue/expose ID tokens.
   */
  async getIdToken(options?: GetIdTokenOptions): Promise<string> {
    await this.ensureInitialized();
    const targetProvider =
      (options?.provider !== undefined
        ? typeof options.provider === 'string'
          ? options.provider
          : AuthProvider[options.provider]
        : undefined) || this.state.provider;
    if (!targetProvider) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active auth session to get an ID token for'
      );
    }
    const provider = await this.resolveProvider(targetProvider);

    const getIdTokenFn = (
      provider as {
        getIdToken?: (forceRefresh?: boolean) => Promise<string>;
      }
    ).getIdToken;
    if (typeof getIdTokenFn !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `getIdToken not supported for ${targetProvider}`
      );
    }

    try {
      return await getIdTokenFn.call(provider, options?.forceRefresh ?? false);
    } catch (error) {
      this.logger.error(`getIdToken failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Updates the signed-in user's profile via the current provider's optional `updateProfile`.
   * Throws `OPERATION_NOT_ALLOWED` if the provider doesn't implement it.
   */
  async updateProfile(options: UpdateProfileOptions): Promise<AuthUser> {
    await this.ensureInitialized();
    const targetProvider = this.state.provider;
    if (!targetProvider) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No authenticated user to update'
      );
    }
    const provider = await this.resolveProvider(targetProvider);

    const updateFn = (
      provider as {
        updateProfile?: (options: UpdateProfileOptions) => Promise<AuthUser>;
      }
    ).updateProfile;
    if (typeof updateFn !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `updateProfile not supported for ${targetProvider}`
      );
    }

    try {
      const updatedUser = await updateFn.call(provider, options);
      this.updateState({ user: updatedUser });
      return updatedUser;
    } catch (error) {
      this.logger.error(`updateProfile failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Deletes the current account via the provider's optional `deleteAccount` (current provider when
   * `provider` is omitted), then clears local state. Throws `OPERATION_NOT_ALLOWED` if the provider
   * doesn't implement it.
   */
  async deleteAccount(options?: DeleteAccountOptions): Promise<void> {
    await this.ensureInitialized();
    const targetProvider =
      (options?.provider !== undefined
        ? typeof options.provider === 'string'
          ? options.provider
          : AuthProvider[options.provider]
        : undefined) || this.state.provider;
    if (!targetProvider) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No authenticated user to delete'
      );
    }
    const provider = await this.resolveProvider(targetProvider);

    const deleteFn = (
      provider as { deleteAccount?: () => Promise<void> }
    ).deleteAccount;
    if (typeof deleteFn !== 'function') {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `deleteAccount not supported for ${targetProvider}`
      );
    }

    try {
      await deleteFn.call(provider);
      // Account deleted server-side: clear local session + timers.
      this.clearTokenRefresh(targetProvider);
      this.updateState({
        user: null,
        isAuthenticated: false,
        provider: null,
      });
      await this.storage.remove('auth_state');
    } catch (error) {
      this.logger.error(`deleteAccount failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
  }

  /**
   * Whether a provider has been supplied to `configure()`/`initialize()`. Public accessor so
   * adapters (React/Vue/Angular) no longer reach into the private `config` via `as any`.
   */
  isProviderConfigured(name: string): boolean {
    return !!this.config.providers?.[name];
  }

  /** Names of every provider supplied to `configure()`/`initialize()`. */
  getConfiguredProviders(): string[] {
    return this.config.providers ? Object.keys(this.config.providers) : [];
  }

  onAuthStateChange(listener: AuthStateListener): () => void {
    // Immediately call with current state
    listener(this.getAuthState());

    // Subscribe to future changes
    return this.stateEmitter.subscribe(listener);
  }

  async getAvailableProviders(): Promise<string[]> {
    return ProviderRegistry.getAvailableProviders();
  }

  async getSupportedProviders(): Promise<string[]> {
    return ProviderRegistry.getSupportedProviders();
  }

  async isProviderSupported(provider: string): Promise<boolean> {
    const supported = await this.getSupportedProviders();
    return supported.includes(provider);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private getProviderDeps(): ProviderDeps {
    return { storage: this.storage, logger: this.logger };
  }

  /**
   * Resolves a provider instance through the registry, threading the configured options and the
   * manager's shared storage/logger. Shared by the capability methods (link/unlink/revoke/
   * getIdToken/updateProfile/deleteAccount).
   */
  private async resolveProvider(name: string) {
    return ProviderRegistry.getProvider(
      name,
      this.config.providers?.[name],
      this.getProviderDeps()
    );
  }

  private updateState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.stateEmitter.emit(this.state);
  }

  /**
   * Strips secret token material from a credential before it reaches the default (unencrypted)
   * storage. Only non-secret session metadata is kept; tokens are re-derived from the provider's
   * silent restore. See the persist site in {@link signIn} for the rationale.
   */
  private sanitizeCredentialForStorage(
    credential?: AuthCredential
  ):
    | Pick<
        AuthCredential,
        'providerId' | 'signInMethod' | 'expiresAt' | 'tokenType' | 'scope'
      >
    | undefined {
    if (!credential) {
      return undefined;
    }
    return {
      providerId: credential.providerId,
      signInMethod: credential.signInMethod,
      expiresAt: credential.expiresAt,
      tokenType: credential.tokenType,
      scope: credential.scope,
    };
  }

  private async restoreAuthState(): Promise<void> {
    try {
      const stored = await this.storage.get<{
        user?: AuthUser;
        provider?: string;
        credential?: AuthCredential;
      }>('auth_state');
      if (stored?.user && stored?.provider) {
        // Verify the session is still valid
        const providerConfig = this.config.providers?.[stored.provider];
        if (providerConfig) {
          try {
            const provider = await ProviderRegistry.getProvider(
              stored.provider,
              providerConfig,
              this.getProviderDeps()
            );
            const currentUser = await provider.getCurrentUser();

            if (currentUser) {
              this.updateState({
                user: currentUser,
                isAuthenticated: true,
                provider: stored.provider,
              });

              // Setup token refresh if needed
              if (
                stored.credential?.refreshToken &&
                this.config.autoRefreshToken
              ) {
                this.setupTokenRefresh(stored.provider, stored.credential);
              }
            }
          } catch (error) {
            this.logger.warn('Failed to restore auth session:', error);
            await this.storage.remove('auth_state');
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to restore auth state:', error);
    }
  }

  private setupTokenRefresh(provider: string, credential: AuthResult['credential']): void {
    this.clearTokenRefresh(provider);

    if (!credential.expiresAt || !credential.refreshToken) {
      return;
    }

    const buffer = this.config.tokenRefreshBuffer || 300000; // 5 minutes
    const refreshTime = credential.expiresAt - buffer - Date.now();

    if (refreshTime > 0) {
      this.scheduleRefresh(provider, refreshTime, credential);
    }
  }

  /**
   * Schedules the refresh, clamping the delay to the 32-bit `setTimeout` ceiling
   * (2,147,483,647 ms ≈ 24.8 days). Without clamping, a far-future `expiresAt` overflows the
   * timer and fires almost immediately, causing a refresh storm. When clamped, the timer simply
   * re-schedules the remaining wait on fire instead of refreshing early.
   */
  private scheduleRefresh(
    provider: string,
    delayMs: number,
    credential: AuthResult['credential']
  ): void {
    const MAX_TIMEOUT = 2_147_483_647;
    const clamped = Math.min(delayMs, MAX_TIMEOUT);
    const timer = setTimeout(() => {
      const remaining = delayMs - clamped;
      if (remaining > 0) {
        // We hit the clamp ceiling — reschedule the rest rather than refreshing prematurely.
        this.scheduleRefresh(provider, remaining, credential);
        return;
      }
      void (async () => {
        try {
          await this.refreshToken(provider);
        } catch (error) {
          this.logger.error(`Auto token refresh failed for ${provider}`, error);
        }
      })();
    }, clamped);

    this.tokenRefreshTimers.set(provider, timer);
  }

  private clearTokenRefresh(provider: string): void {
    const timer = this.tokenRefreshTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.tokenRefreshTimers.delete(provider);
    }
  }

  /** Clears every active refresh timer (used on a global, untargeted sign-out). */
  private clearAllTokenRefresh(): void {
    for (const timer of this.tokenRefreshTimers.values()) {
      clearTimeout(timer);
    }
    this.tokenRefreshTimers.clear();
  }

  dispose(): void {
    // Clear all timers
    for (const timer of this.tokenRefreshTimers.values()) {
      clearTimeout(timer);
    }
    this.tokenRefreshTimers.clear();

    // Clear providers
    ProviderRegistry.clearAll();

    // Clear listeners
    this.stateEmitter.clear();
  }
}

let instance: AuthManagerCore | null = null;

/**
 * Returns the process-wide auth manager, constructing it on first call.
 *
 * The singleton is created lazily on purpose (ISSUE-002): constructing it eagerly at module scope
 * built a `WebStorage` that read `window.localStorage` while the module was being evaluated, which
 * crashed any import under Node / SSR and made `"sideEffects": false` untrue. Nothing touches the
 * browser until the first real use.
 */
export function getAuth(): AuthManagerCore {
  if (!instance) {
    instance = new AuthManagerCore();
  }
  return instance;
}

/**
 * The shared auth manager. Every property access is forwarded to the lazily-created instance, so
 * `import { auth } from 'capacitor-auth-manager'` keeps working unchanged while importing the
 * package has no side effects.
 */
export const auth: AuthManagerCore = new Proxy({} as AuthManagerCore, {
  get(_target, property) {
    const target = getAuth();
    const value = Reflect.get(target, property, target) as unknown;
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(target)
      : value;
  },
  set(_target, property, value) {
    return Reflect.set(getAuth(), property, value);
  },
  has(_target, property) {
    return Reflect.has(getAuth(), property);
  },
});

// Export types
export type { AuthManagerCore };
