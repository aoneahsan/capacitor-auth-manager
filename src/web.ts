import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

import type {
  CapacitorAuthManagerPlugin,
  AuthManagerInitOptions,
  SignInOptions,
  SignOutOptions,
  AuthResult,
  AuthUser,
  RefreshTokenOptions,
  AuthStateChangeCallback,
  IsSupportedOptions,
  IsSupportedResult,
  ConfigureOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  PasswordResetOptions,
  EmailVerificationOptions,
  SendSmsCodeOptions,
  VerifySmsCodeOptions,
  SendEmailCodeOptions,
  VerifyEmailCodeOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
  GetIdTokenOptions,
  SetCustomParametersOptions,
  RevokeAccessOptions,
  AuthProviderConfig,
  AuthCredential,
} from './definitions';

import { AuthErrorCode, AuthPersistence, AuthProvider } from './definitions';

import { AuthError } from './utils/auth-error';
import { EventEmitter } from './utils/event-emitter';
import { WebStorage, StorageInterface } from './utils/storage';
import { Logger } from './utils/logger';
import { BaseAuthProvider } from './providers/base-provider';
import { ProviderFactory, AnyAuthProvider } from './providers/provider-factory';

export class CapacitorAuthManagerWeb
  extends WebPlugin
  implements CapacitorAuthManagerPlugin
{
  private providers: Map<AuthProvider, AnyAuthProvider> = new Map();
  private storage: StorageInterface;
  private logger: Logger;
  private authStateEmitter: EventEmitter<AuthUser | null>;
  private isInitialized = false;
  private currentProvider: AuthProvider | null = null;
  private tokenRefreshTimers: Map<AuthProvider, ReturnType<typeof setTimeout>> =
    new Map();
  private autoRefreshToken = true;
  private tokenRefreshBuffer = 300000; // 5 minutes before expiry

  constructor() {
    super();
    this.authStateEmitter = new EventEmitter<AuthUser | null>();
    this.storage = new WebStorage(AuthPersistence.LOCAL);
    this.logger = new Logger({
      enableLogging: false,
      logLevel: 'info',
      prefix: 'CapAuthManager',
    });
  }

  async initialize(options: AuthManagerInitOptions): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Auth manager already initialized');
      return;
    }

    try {
      // Configure logger
      if (options.enableLogging !== undefined) {
        this.logger.setEnabled(options.enableLogging);
      }
      if (options.logLevel) {
        this.logger.setLogLevel(options.logLevel);
      }

      // Configure persistence
      if (options.persistence) {
        this.storage = new WebStorage(options.persistence);
      }

      // Configure auto refresh
      this.autoRefreshToken = options.autoRefreshToken ?? true;
      this.tokenRefreshBuffer = options.tokenRefreshBuffer ?? 300000;

      // Initialize providers
      for (const providerConfig of options.providers) {
        await this.initializeProvider(providerConfig);
      }

      // Load last used provider
      const lastProvider = await this.storage.get('last_auth_provider');
      if (lastProvider) {
        this.currentProvider = lastProvider as AuthProvider;
      }

      this.isInitialized = true;
      this.logger.info('Auth manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize auth manager', error);
      throw AuthError.fromError(error);
    }
  }

  async signIn(options: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    const provider = this.getProvider(options.provider);

    try {
      this.logger.info(`Signing in with ${options.provider}`);

      const result = await provider.signIn(options);

      // Set as current provider
      this.currentProvider = options.provider;
      await this.storage.set('last_auth_provider', options.provider);

      // Setup token refresh if needed
      if (this.autoRefreshToken && result.credential?.refreshToken) {
        this.setupTokenRefresh(options.provider, result.credential);
      }

      // Forward auth state change
      this.authStateEmitter.emit(result.user);

      return result;
    } catch (error) {
      this.logger.error(`Sign in failed for ${options.provider}`, error);
      throw AuthError.fromError(error, options.provider);
    }
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      if (options?.provider) {
        // Sign out from specific provider
        const provider = this.getProvider(options.provider);
        await provider.signOut(options);

        // Cancel token refresh
        this.cancelTokenRefresh(options.provider);
      } else if (this.currentProvider) {
        // Sign out from current provider
        const provider = this.getProvider(this.currentProvider);
        await provider.signOut(options);

        // Untargeted sign-out: clear ALL refresh timers, not just the current provider's, so
        // no orphaned timers remain for previously-active providers (F-18).
        this.cancelAllTokenRefresh();

        // Clear current provider
        this.currentProvider = null;
        await this.storage.remove('last_auth_provider');
      } else {
        // Sign out from all providers
        for (const [providerId, provider] of this.providers) {
          try {
            await provider.signOut(options);
            this.cancelTokenRefresh(providerId);
          } catch (error) {
            this.logger.error(`Failed to sign out from ${providerId}`, error);
          }
        }

        // Defensive: clear any remaining timers (e.g. for providers that errored above).
        this.cancelAllTokenRefresh();

        this.currentProvider = null;
        await this.storage.remove('last_auth_provider');
      }

      // Emit null user
      this.authStateEmitter.emit(null);
    } catch (error) {
      this.logger.error('Sign out failed', error);
      throw AuthError.fromError(error);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    this.validateInitialized();

    if (this.currentProvider) {
      const provider = this.getProvider(this.currentProvider);
      return provider.getCurrentUser();
    }

    // Try to get user from any provider. A not-yet-initialized provider can throw from
    // getCurrentUser() (it lazily initializes), so isolate each and skip failures.
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const user = await provider.getCurrentUser();
        if (user) {
          // Remember which provider owns the active session for subsequent calls.
          this.currentProvider = providerId;
          return user;
        }
      } catch (error) {
        this.logger.debug(
          `getCurrentUser: provider ${providerId} threw; skipping`,
          error
        );
        continue;
      }
    }

    return null;
  }

  async refreshToken(options?: RefreshTokenOptions): Promise<AuthResult> {
    this.validateInitialized();

    const providerId = options?.provider || this.currentProvider;
    if (!providerId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'No provider specified for token refresh'
      );
    }

    const provider = this.getProvider(providerId);

    if (!provider.refreshToken) {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `Token refresh not supported for provider ${providerId}`
      );
    }

    try {
      const result = await provider.refreshToken(options);

      // Setup new token refresh
      if (this.autoRefreshToken && result.credential?.refreshToken) {
        this.setupTokenRefresh(providerId, result.credential);
      }

      return result;
    } catch (error) {
      this.logger.error(`Token refresh failed for ${providerId}`, error);
      throw AuthError.fromError(error, providerId);
    }
  }

  async addAuthStateListener(
    callback: AuthStateChangeCallback
  ): Promise<PluginListenerHandle> {
    const unsubscribe = this.authStateEmitter.subscribe(callback);

    // Create a Capacitor-compatible listener handle
    const handle: PluginListenerHandle = {
      remove: async () => {
        unsubscribe();
      },
    };

    // Emit current user state
    const currentUser = await this.getCurrentUser();
    callback(currentUser);

    return handle;
  }

  async removeAllListeners(): Promise<void> {
    this.authStateEmitter.clear();

    // Also clear provider listeners
    for (const provider of this.providers.values()) {
      provider.dispose?.();
    }
  }

  async isSupported(options: IsSupportedOptions): Promise<IsSupportedResult> {
    try {
      if (!this.providers.has(options.provider)) {
        return {
          isSupported: false,
          reason: 'Provider not configured',
          availableProviders: Array.from(this.providers.keys()),
        };
      }

      const provider = this.getProvider(options.provider);
      const isSupported = await provider.isSupported();

      return {
        isSupported,
        reason: isSupported
          ? undefined
          : 'Provider not supported on this platform',
        availableProviders: Array.from(this.providers.keys()),
      };
    } catch (error) {
      return {
        isSupported: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        availableProviders: Array.from(this.providers.keys()),
      };
    }
  }

  async configure(options: ConfigureOptions): Promise<void> {
    this.validateInitialized();

    const providerConfig: AuthProviderConfig = {
      provider: options.provider,
      options: options.options,
    };

    await this.initializeProvider(providerConfig);
  }

  async linkAccount(options: LinkAccountOptions): Promise<AuthResult> {
    this.validateInitialized();

    const provider = this.getProvider(options.provider);

    if (!provider.linkAccount) {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `Account linking not supported for provider ${options.provider}`
      );
    }

    try {
      return await provider.linkAccount(options);
    } catch (error) {
      this.logger.error(
        `Account linking failed for ${options.provider}`,
        error
      );
      throw AuthError.fromError(error, options.provider);
    }
  }

  async unlinkAccount(options: UnlinkAccountOptions): Promise<void> {
    this.validateInitialized();

    const provider = this.getProvider(options.provider);

    if (!provider.unlinkAccount) {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `Account unlinking not supported for provider ${options.provider}`
      );
    }

    try {
      await provider.unlinkAccount(options);
    } catch (error) {
      this.logger.error(
        `Account unlinking failed for ${options.provider}`,
        error
      );
      throw AuthError.fromError(error, options.provider);
    }
  }

  async sendPasswordResetEmail(options: PasswordResetOptions): Promise<void> {
    this.validateInitialized();

    // Try email-password provider first
    const emailPasswordProvider = this.providers.get(AuthProvider.EMAIL_PASSWORD);
    if (emailPasswordProvider && 'sendPasswordReset' in emailPasswordProvider) {
      const provider = emailPasswordProvider as { sendPasswordReset: (email: string) => Promise<void> };
      await provider.sendPasswordReset(options.email);
      return;
    }

    // Try phone-password provider
    const phonePasswordProvider = this.providers.get(AuthProvider.PHONE_PASSWORD);
    if (phonePasswordProvider && 'sendPasswordReset' in phonePasswordProvider) {
      const provider = phonePasswordProvider as { sendPasswordReset: (identifier: string) => Promise<void> };
      await provider.sendPasswordReset(options.email);
      return;
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'Password reset requires email-password or phone-password provider to be configured'
    );
  }

  async sendEmailVerification(
    _options?: EmailVerificationOptions
  ): Promise<void> {
    this.validateInitialized();

    // Email verification is typically handled by email-password provider
    const emailPasswordProvider = this.providers.get(AuthProvider.EMAIL_PASSWORD);
    if (emailPasswordProvider && 'sendEmailVerification' in emailPasswordProvider) {
      const provider = emailPasswordProvider as { sendEmailVerification: () => Promise<void> };
      await provider.sendEmailVerification();
      return;
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'Email verification requires email-password provider to be configured'
    );
  }

  async sendSmsCode(options: SendSmsCodeOptions): Promise<void> {
    this.validateInitialized();

    // Delegate to SMS provider
    const smsProvider = this.providers.get(AuthProvider.SMS);
    if (smsProvider && 'sendCode' in smsProvider) {
      const provider = smsProvider as { sendCode: (phoneNumber: string) => Promise<void> };
      await provider.sendCode(options.phoneNumber);
      return;
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'SMS authentication requires SMS provider to be configured'
    );
  }

  async verifySmsCode(options: VerifySmsCodeOptions): Promise<AuthResult> {
    this.validateInitialized();

    // Delegate to SMS provider
    const smsProvider = this.providers.get(AuthProvider.SMS);
    if (smsProvider && 'verifyCode' in smsProvider) {
      const provider = smsProvider as { verifyCode: (phoneNumber: string, code: string) => Promise<AuthResult> };
      return await provider.verifyCode(options.phoneNumber, options.code);
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'SMS authentication requires SMS provider to be configured'
    );
  }

  async sendEmailCode(options: SendEmailCodeOptions): Promise<void> {
    this.validateInitialized();

    // Delegate to email-code provider
    const emailCodeProvider = this.providers.get(AuthProvider.EMAIL_CODE);
    if (emailCodeProvider) {
      // The email-code provider's signIn accepts { email } to send the code
      await emailCodeProvider.signIn({ provider: AuthProvider.EMAIL_CODE, credentials: { email: options.email } });
      return;
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'Email code authentication requires email-code provider to be configured'
    );
  }

  async verifyEmailCode(options: VerifyEmailCodeOptions): Promise<AuthResult> {
    this.validateInitialized();

    // Delegate to email-code provider
    const emailCodeProvider = this.providers.get(AuthProvider.EMAIL_CODE);
    if (emailCodeProvider) {
      // The email-code provider's signIn accepts { email, code } to verify
      return await emailCodeProvider.signIn({ provider: AuthProvider.EMAIL_CODE, credentials: { email: options.email, code: options.code } });
    }

    throw new AuthError(
      AuthErrorCode.UNSUPPORTED_PROVIDER,
      'Email code authentication requires email-code provider to be configured'
    );
  }

  async updateProfile(options: UpdateProfileOptions): Promise<AuthUser> {
    this.validateInitialized();

    if (!this.currentProvider) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No authenticated user found'
      );
    }

    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Current provider not found'
      );
    }

    // Check if provider supports updateProfile
    if ('updateProfile' in provider && typeof provider.updateProfile === 'function') {
      const updateFn = provider.updateProfile as (options: UpdateProfileOptions) => Promise<AuthUser>;
      return await updateFn(options);
    }

    // Fallback: update cached user info locally
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No authenticated user to update'
      );
    }

    // Update local user data
    const updatedUser: AuthUser = {
      ...currentUser,
      displayName: options.displayName !== undefined ? options.displayName : currentUser.displayName,
      photoURL: options.photoURL !== undefined ? options.photoURL : currentUser.photoURL,
      phoneNumber: options.phoneNumber !== undefined ? options.phoneNumber : currentUser.phoneNumber,
    };

    // Persist the updated user so it survives a reload — providers that extend BaseAuthProvider
    // read the cached user from `${provider}_current_user` on init (F-36). Without this the
    // fallback only emitted the change in-memory and it reverted on the next page load.
    await this.persistFallbackUser(updatedUser);

    this.authStateEmitter.emit(updatedUser);
    return updatedUser;
  }

  /**
   * Writes an updated user back to storage under the same key BaseAuthProvider uses
   * (`${provider}_current_user`) for the active provider, so the local profile change survives a
   * reload even when the provider has no native `updateProfile`. Best-effort: storage failures are
   * logged, not thrown, since the in-memory update already succeeded.
   */
  private async persistFallbackUser(user: AuthUser): Promise<void> {
    if (!this.currentProvider) {
      return;
    }
    try {
      await this.storage.set(`${this.currentProvider}_current_user`, user);
    } catch (error) {
      this.logger.error(
        `Failed to persist updated profile for ${this.currentProvider}`,
        error
      );
    }
  }

  async deleteAccount(options?: DeleteAccountOptions): Promise<void> {
    this.validateInitialized();

    const providerId = options?.provider || this.currentProvider;
    if (!providerId) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No authenticated user found'
      );
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Provider not found'
      );
    }

    // Check if provider supports account deletion
    if ('deleteAccount' in provider && typeof provider.deleteAccount === 'function') {
      const deleteFn = provider.deleteAccount as () => Promise<void>;
      await deleteFn();
      await this.signOut();
      return;
    }

    // If provider doesn't support deletion, revoke access and sign out
    if ('revokeAccess' in provider && typeof provider.revokeAccess === 'function') {
      const revokeFn = provider.revokeAccess as () => Promise<void>;
      await revokeFn();
    }
    await this.signOut();
  }

  async getIdToken(options?: GetIdTokenOptions): Promise<string> {
    this.validateInitialized();

    const providerId = options?.provider || this.currentProvider;
    if (!providerId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'No provider specified for ID token'
      );
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        `Provider ${providerId} not configured`
      );
    }

    // Check if provider has getIdToken method
    if ('getIdToken' in provider && typeof provider.getIdToken === 'function') {
      const getIdTokenFn = provider.getIdToken as (forceRefresh?: boolean) => Promise<string>;
      return await getIdTokenFn(options?.forceRefresh ?? false);
    }

    // Try to get ID token from stored credential. The storage layer (WebStorage/
    // CapacitorPreferencesStorage) already JSON-parses on read, so the value is the
    // parsed credential object — do NOT JSON.parse it again.
    const parsed = (await this.storage.get(
      `${providerId}_credential`
    )) as AuthCredential | null;
    if (parsed) {
      if (parsed.idToken) {
        // Check if token needs refresh
        if (
          options?.forceRefresh ||
          (parsed.expiresAt && parsed.expiresAt < Date.now())
        ) {
          // Try to refresh
          if (provider.refreshToken) {
            const result = await provider.refreshToken({
              provider: providerId,
              forceRefresh: true,
            });
            if (result.credential.idToken) {
              return result.credential.idToken;
            }
          }
        } else {
          return parsed.idToken;
        }
      }
    }

    throw new AuthError(
      AuthErrorCode.NO_AUTH_SESSION,
      `No ID token available for provider ${providerId}. Some providers (OAuth without OIDC) do not issue ID tokens.`
    );
  }

  /**
   * Persists provider-specific custom OAuth parameters.
   *
   * IMPORTANT (F-35): the underlying OAuth flow applies custom parameters that are passed directly
   * to {@link signIn} (`signIn({ provider, options: { customParameters } })`). The values stored
   * here are NOT automatically merged into a later `signIn` authorization URL — read them back and
   * pass them to `signIn` if you need them applied. The stored value is the raw parameters object
   * (the storage layer serializes it); it is not double JSON-encoded.
   */
  async setCustomParameters(
    options: SetCustomParametersOptions
  ): Promise<void> {
    this.validateInitialized();

    // Store the raw object — WebStorage/CapacitorPreferencesStorage serialize on write, so passing
    // a pre-stringified value here would double-encode it.
    await this.storage.set(
      `${options.provider}_custom_params`,
      options.parameters
    );
  }

  async revokeAccess(options?: RevokeAccessOptions): Promise<void> {
    this.validateInitialized();

    const providerId = options?.provider || this.currentProvider;
    if (!providerId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'No provider specified for access revocation'
      );
    }

    const provider = this.getProvider(providerId);

    if (!provider.revokeAccess) {
      throw new AuthError(
        AuthErrorCode.OPERATION_NOT_ALLOWED,
        `Access revocation not supported for provider ${providerId}`
      );
    }

    try {
      await provider.revokeAccess(options?.token);
    } catch (error) {
      this.logger.error(`Access revocation failed for ${providerId}`, error);
      throw AuthError.fromError(error, providerId);
    }
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        'Auth manager not initialized. Call initialize() first.'
      );
    }
  }

  private getProvider(providerId: AuthProvider): AnyAuthProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        `Provider ${providerId} not configured`
      );
    }
    return provider;
  }

  private async initializeProvider(config: AuthProviderConfig): Promise<void> {
    try {
      // Dynamically import provider implementation
      const provider = await this.createProvider(config);

      if (provider) {
        // Initialize if the provider supports it
        if (provider.initialize) {
          await provider.initialize(config.options);
        }

        // Forward auth state changes if provider supports it (BaseAuthProvider only)
        if ('addAuthStateListener' in provider && typeof provider.addAuthStateListener === 'function') {
          (provider as BaseAuthProvider).addAuthStateListener((user: AuthUser | null) => {
            if (user) {
              this.authStateEmitter.emit(user);
            }
          });
        }

        this.providers.set(config.provider, provider);
        this.logger.info(`Provider ${config.provider} initialized`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize provider ${config.provider}`,
        error
      );
      throw error;
    }
  }

  private async createProvider(
    config: AuthProviderConfig
  ): Promise<AnyAuthProvider | null> {
    return ProviderFactory.createProvider(
      config,
      this.storage,
      this.logger,
      this.storage instanceof WebStorage
        ? AuthPersistence.LOCAL
        : AuthPersistence.NONE
    );
  }

  private setupTokenRefresh(
    provider: AuthProvider,
    credential: AuthCredential
  ): void {
    // Cancel existing refresh timer
    this.cancelTokenRefresh(provider);

    if (!credential.expiresAt || !credential.refreshToken) {
      return;
    }

    const refreshTime =
      credential.expiresAt - this.tokenRefreshBuffer - Date.now();

    if (refreshTime > 0) {
      this.scheduleRefresh(provider, refreshTime);
    }
  }

  /**
   * Schedules the refresh, clamping the delay to the 32-bit `setTimeout` ceiling
   * (2,147,483,647 ms ≈ 24.8 days). A far-future `expiresAt` would otherwise overflow the timer
   * and fire almost immediately (refresh storm). When clamped, the timer reschedules the remaining
   * wait on fire instead of refreshing early (F-17).
   */
  private scheduleRefresh(provider: AuthProvider, delayMs: number): void {
    const MAX_TIMEOUT = 2_147_483_647;
    const clamped = Math.min(delayMs, MAX_TIMEOUT);
    const timer = setTimeout(() => {
      const remaining = delayMs - clamped;
      if (remaining > 0) {
        this.scheduleRefresh(provider, remaining);
        return;
      }
      void (async () => {
        try {
          await this.refreshToken({ provider });
        } catch (error) {
          this.logger.error(`Auto token refresh failed for ${provider}`, error);
        }
      })();
    }, clamped);

    this.tokenRefreshTimers.set(provider, timer);
  }

  private cancelTokenRefresh(provider: AuthProvider): void {
    const timer = this.tokenRefreshTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.tokenRefreshTimers.delete(provider);
    }
  }

  /** Clears every active refresh timer (used on a global, untargeted sign-out). */
  private cancelAllTokenRefresh(): void {
    for (const timer of this.tokenRefreshTimers.values()) {
      clearTimeout(timer);
    }
    this.tokenRefreshTimers.clear();
  }
}
