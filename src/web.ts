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
  AuthProvider,
  AuthProviderConfig,
} from './definitions';

import { AuthErrorCode, AuthPersistence } from './definitions';

import { AuthError } from './utils/auth-error';
import { EventEmitter } from './utils/event-emitter';
import { WebStorage, StorageInterface } from './utils/storage';
import { Logger } from './utils/logger';
import { BaseAuthProvider } from './providers/base-provider';
import { ProviderFactory } from './providers/provider-factory';

export class CapacitorAuthManagerWeb
  extends WebPlugin
  implements CapacitorAuthManagerPlugin {
  
  private providers: Map<AuthProvider, BaseAuthProvider> = new Map();
  private storage: StorageInterface;
  private logger: Logger;
  private authStateEmitter: EventEmitter<AuthUser | null>;
  private isInitialized = false;
  private currentProvider: AuthProvider | null = null;
  private tokenRefreshTimers: Map<AuthProvider, NodeJS.Timeout> = new Map();
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
      if (this.autoRefreshToken && result.credential.refreshToken) {
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
        
        // Cancel token refresh
        this.cancelTokenRefresh(this.currentProvider);
        
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
    
    // Try to get user from any provider
    for (const provider of this.providers.values()) {
      const user = await provider.getCurrentUser();
      if (user) {
        return user;
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
    
    try {
      const result = await provider.refreshToken(options);
      
      // Setup new token refresh
      if (this.autoRefreshToken && result.credential.refreshToken) {
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
      }
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
      provider.dispose();
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
        reason: isSupported ? undefined : 'Provider not supported on this platform',
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
    
    try {
      return await provider.linkAccount(options);
    } catch (error) {
      this.logger.error(`Account linking failed for ${options.provider}`, error);
      throw AuthError.fromError(error, options.provider);
    }
  }

  async unlinkAccount(options: UnlinkAccountOptions): Promise<void> {
    this.validateInitialized();
    
    const provider = this.getProvider(options.provider);
    
    try {
      await provider.unlinkAccount(options);
    } catch (error) {
      this.logger.error(`Account unlinking failed for ${options.provider}`, error);
      throw AuthError.fromError(error, options.provider);
    }
  }

  async sendPasswordResetEmail(_options: PasswordResetOptions): Promise<void> {
    this.validateInitialized();
    
    // This would typically be implemented by specific providers
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Password reset not implemented for current provider'
    );
  }

  async sendEmailVerification(_options?: EmailVerificationOptions): Promise<void> {
    this.validateInitialized();
    
    // This would typically be implemented by specific providers
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Email verification not implemented for current provider'
    );
  }

  async sendSmsCode(_options: SendSmsCodeOptions): Promise<void> {
    this.validateInitialized();
    
    // This would typically be implemented by SMS provider
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'SMS authentication not implemented'
    );
  }

  async verifySmsCode(_options: VerifySmsCodeOptions): Promise<AuthResult> {
    this.validateInitialized();
    
    // This would typically be implemented by SMS provider
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'SMS authentication not implemented'
    );
  }

  async sendEmailCode(_options: SendEmailCodeOptions): Promise<void> {
    this.validateInitialized();
    
    // This would typically be implemented by email code provider
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Email code authentication not implemented'
    );
  }

  async verifyEmailCode(_options: VerifyEmailCodeOptions): Promise<AuthResult> {
    this.validateInitialized();
    
    // This would typically be implemented by email code provider
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Email code authentication not implemented'
    );
  }

  async updateProfile(_options: UpdateProfileOptions): Promise<AuthUser> {
    this.validateInitialized();
    
    if (!this.currentProvider) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'No authenticated user found'
      );
    }
    
    // This would typically be implemented by specific providers
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Profile update not implemented for current provider'
    );
  }

  async deleteAccount(_options?: DeleteAccountOptions): Promise<void> {
    this.validateInitialized();
    
    if (!this.currentProvider) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'No authenticated user found'
      );
    }
    
    // This would typically be implemented by specific providers
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Account deletion not implemented for current provider'
    );
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
    
    // This would typically be implemented by specific providers
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'ID token retrieval not implemented for current provider'
    );
  }

  async setCustomParameters(options: SetCustomParametersOptions): Promise<void> {
    this.validateInitialized();
    
    // Store custom parameters for the provider
    await this.storage.set(
      `${options.provider}_custom_params`,
      JSON.stringify(options.parameters)
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

  private getProvider(providerId: AuthProvider): BaseAuthProvider {
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
        await provider.initialize();
        
        // Forward auth state changes
        provider.addAuthStateListener((user) => {
          if (user) {
            this.authStateEmitter.emit(user);
          }
        });
        
        this.providers.set(config.provider, provider);
        this.logger.info(`Provider ${config.provider} initialized`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize provider ${config.provider}`, error);
      throw error;
    }
  }

  private async createProvider(config: AuthProviderConfig): Promise<BaseAuthProvider | null> {
    return ProviderFactory.createProvider(
      config,
      this.storage,
      this.logger,
      this.storage instanceof WebStorage ? AuthPersistence.LOCAL : AuthPersistence.NONE
    );
  }

  private setupTokenRefresh(provider: AuthProvider, credential: any): void {
    // Cancel existing refresh timer
    this.cancelTokenRefresh(provider);
    
    if (!credential.expiresAt || !credential.refreshToken) {
      return;
    }
    
    const refreshTime = credential.expiresAt - this.tokenRefreshBuffer - Date.now();
    
    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.refreshToken({ provider });
        } catch (error) {
          this.logger.error(`Auto token refresh failed for ${provider}`, error);
        }
      }, refreshTime);
      
      this.tokenRefreshTimers.set(provider, timer);
    }
  }

  private cancelTokenRefresh(provider: AuthProvider): void {
    const timer = this.tokenRefreshTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.tokenRefreshTimers.delete(provider);
    }
  }
}