import { EventEmitter } from '../utils/event-emitter';
import { Logger } from '../utils/logger';
import { WebStorage, StorageInterface } from '../utils/storage';
import { AuthError } from '../utils/auth-error';
import { ProviderRegistry } from './provider-registry';
import type {
  AuthManagerConfig,
  AuthState,
  AuthStateListener
} from './types';
import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions
} from '../definitions';
import { AuthProvider } from '../definitions';

class AuthManagerCore {
  private state: AuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    provider: null
  };

  private stateEmitter = new EventEmitter<AuthState>();
  private storage: StorageInterface;
  private logger: Logger;
  private config: AuthManagerConfig = {};
  private isInitialized = false;
  private tokenRefreshTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.storage = new WebStorage('local' as any);
    this.logger = new Logger({
      enableLogging: false,
      logLevel: 'info',
      prefix: 'AuthManager'
    });

    // Auto-initialize on first use
    if (typeof window !== 'undefined') {
      this.initialize().catch(err => {
        this.logger.error('Auto-initialization failed:', err);
      });
    }
  }

  async initialize(config?: AuthManagerConfig): Promise<void> {
    if (this.isInitialized && !config) {
      return;
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

    // Configure persistence
    if (this.config.persistence) {
      this.storage = new WebStorage(this.config.persistence as any);
    }

    // Restore auth state
    await this.restoreAuthState();

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
    if (config.persistence) {
      this.storage = new WebStorage(config.persistence as any);
    }
  }

  async signIn(providerOrOptions: string | SignInOptions): Promise<AuthResult> {
    await this.ensureInitialized();

    let providerName: string;
    let signInOptions: any = {};
    
    if (typeof providerOrOptions === 'string') {
      providerName = providerOrOptions;
    } else {
      // Convert AuthProvider enum to string if needed
      providerName = typeof providerOrOptions.provider === 'string' 
        ? providerOrOptions.provider 
        : AuthProvider[providerOrOptions.provider];
      signInOptions = {
        credentials: providerOrOptions.credentials,
        options: providerOrOptions.options
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
      const provider = await ProviderRegistry.getProvider(providerName, providerConfig);

      // Sign in
      this.logger.info(`Signing in with ${providerName}`);
      const result = await provider.signIn({
        ...signInOptions.options,
        credentials: signInOptions.credentials
      });

      // Update state
      this.updateState({
        user: result.user,
        isAuthenticated: true,
        provider: providerName,
        isLoading: false
      });

      // Store auth state
      await this.storage.set('auth_state', {
        user: result.user,
        provider: providerName,
        credential: result.credential
      });

      // Setup token refresh
      if (this.config.autoRefreshToken && result.credential.refreshToken) {
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
      const providerInstance = await ProviderRegistry.getProvider(provider, providerConfig);

      // Sign out
      await providerInstance.signOut(options);

      // Clear token refresh
      this.clearTokenRefresh(provider);

      // Clear state
      this.updateState({
        user: null,
        isAuthenticated: false,
        provider: null,
        isLoading: false
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
      const providerInstance = await ProviderRegistry.getProvider(targetProvider, providerConfig);

      if (!providerInstance.refreshToken) {
        throw new AuthError(
          'auth/operation-not-supported',
          `Provider '${targetProvider}' does not support token refresh`
        );
      }

      const result = await providerInstance.refreshToken();

      // Update user
      this.updateState({ user: result.user });

      // Setup new token refresh
      if (this.config.autoRefreshToken && result.credential.refreshToken) {
        this.setupTokenRefresh(targetProvider, result.credential);
      }

      return result;
    } catch (error) {
      this.logger.error(`Token refresh failed for ${targetProvider}`, error);
      throw AuthError.fromError(error);
    }
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

  private updateState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.stateEmitter.emit(this.state);
  }

  private async restoreAuthState(): Promise<void> {
    try {
      const stored = await this.storage.get('auth_state');
      if (stored?.user && stored?.provider) {
        // Verify the session is still valid
        const providerConfig = this.config.providers?.[stored.provider];
        if (providerConfig) {
          try {
            const provider = await ProviderRegistry.getProvider(stored.provider, providerConfig);
            const currentUser = await provider.getCurrentUser();
            
            if (currentUser) {
              this.updateState({
                user: currentUser,
                isAuthenticated: true,
                provider: stored.provider
              });

              // Setup token refresh if needed
              if (stored.credential?.refreshToken && this.config.autoRefreshToken) {
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

  private setupTokenRefresh(provider: string, credential: any): void {
    this.clearTokenRefresh(provider);

    if (!credential.expiresAt || !credential.refreshToken) {
      return;
    }

    const buffer = this.config.tokenRefreshBuffer || 300000; // 5 minutes
    const refreshTime = credential.expiresAt - buffer - Date.now();

    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.refreshToken(provider);
        } catch (error) {
          this.logger.error(`Auto token refresh failed for ${provider}`, error);
        }
      }, refreshTime);

      this.tokenRefreshTimers.set(provider, timer);
    }
  }

  private clearTokenRefresh(provider: string): void {
    const timer = this.tokenRefreshTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.tokenRefreshTimers.delete(provider);
    }
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

// Create singleton instance
export const auth = new AuthManagerCore();

// Export types
export type { AuthManagerCore };