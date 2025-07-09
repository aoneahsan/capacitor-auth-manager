import {
  AuthProvider,
  AuthResult,
  AuthUser,
  SignInOptions,
  SignOutOptions,
  AuthCredential,
  RefreshTokenOptions,
  AuthStateChangeCallback,
  AuthErrorCode,
  LinkAccountOptions,
  UnlinkAccountOptions,
  ProviderOptions,
  AuthPersistence,
} from '../definitions';
import { AuthError } from '../utils/auth-error';
import { EventEmitter, UnsubscribeFn } from '../utils/event-emitter';
import { StorageInterface } from '../utils/storage';
import { Logger } from '../utils/logger';

export interface BaseProviderConfig {
  provider: AuthProvider;
  options: ProviderOptions;
  storage: StorageInterface;
  logger: Logger;
  persistence?: AuthPersistence;
}

export abstract class BaseAuthProvider {
  protected provider: AuthProvider;
  protected options: ProviderOptions;
  protected storage: StorageInterface;
  protected logger: Logger;
  protected authStateEmitter: EventEmitter<AuthUser | null>;
  protected currentUser: AuthUser | null = null;
  protected isInitialized = false;
  protected persistence: AuthPersistence;

  constructor(config: BaseProviderConfig) {
    this.provider = config.provider;
    this.options = config.options;
    this.storage = config.storage;
    this.logger = config.logger;
    this.persistence = config.persistence || AuthPersistence.LOCAL;
    this.authStateEmitter = new EventEmitter<AuthUser | null>();
  }

  abstract initialize(): Promise<void>;
  abstract signIn(options?: SignInOptions): Promise<AuthResult>;
  abstract signOut(options?: SignOutOptions): Promise<void>;
  abstract refreshToken(options?: RefreshTokenOptions): Promise<AuthResult>;
  abstract isSupported(): Promise<boolean>;
  abstract linkAccount(options: LinkAccountOptions): Promise<AuthResult>;
  abstract unlinkAccount(options: UnlinkAccountOptions): Promise<void>;
  abstract revokeAccess(token?: string): Promise<void>;

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.currentUser;
  }

  addAuthStateListener(callback: AuthStateChangeCallback): UnsubscribeFn {
    return this.authStateEmitter.subscribe(callback);
  }

  protected async setCurrentUser(user: AuthUser | null): Promise<void> {
    this.currentUser = user;
    
    // Persist user to storage
    const storageKey = `${this.provider}_current_user`;
    if (user) {
      await this.storage.set(storageKey, JSON.stringify(user));
    } else {
      await this.storage.remove(storageKey);
    }
    
    // Emit auth state change
    this.authStateEmitter.emit(user);
  }

  protected async loadCurrentUser(): Promise<void> {
    try {
      const storageKey = `${this.provider}_current_user`;
      const userData = await this.storage.get(storageKey);
      
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.logger.debug(`Loaded user from storage for provider ${this.provider}`);
      }
    } catch (error) {
      this.logger.error('Failed to load user from storage', error);
    }
  }

  protected async saveCredential(credential: AuthCredential): Promise<void> {
    const storageKey = `${this.provider}_credential`;
    await this.storage.set(storageKey, JSON.stringify(credential));
  }

  protected async loadCredential(): Promise<AuthCredential | null> {
    try {
      const storageKey = `${this.provider}_credential`;
      const credentialData = await this.storage.get(storageKey);
      
      if (credentialData) {
        return JSON.parse(credentialData);
      }
    } catch (error) {
      this.logger.error('Failed to load credential from storage', error);
    }
    
    return null;
  }

  protected async clearStoredData(): Promise<void> {
    const userKey = `${this.provider}_current_user`;
    const credentialKey = `${this.provider}_credential`;
    
    await Promise.all([
      this.storage.remove(userKey),
      this.storage.remove(credentialKey),
    ]);
  }

  protected validateInitialized(): void {
    if (!this.isInitialized) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Provider ${this.provider} is not initialized`,
        this.provider
      );
    }
  }

  protected createAuthResult(
    user: AuthUser,
    credential: AuthCredential,
    isNewUser = false,
    operationType: 'signIn' | 'link' | 'reauthenticate' = 'signIn'
  ): AuthResult {
    return {
      user,
      credential,
      additionalUserInfo: {
        isNewUser,
        providerId: this.provider,
      },
      operationType,
    };
  }

  protected generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected isTokenExpired(expiresAt?: number): boolean {
    if (!expiresAt) return false;
    return Date.now() >= expiresAt;
  }

  protected calculateTokenExpiry(expiresIn?: number): number {
    if (!expiresIn) {
      // Default to 1 hour
      expiresIn = 3600;
    }
    return Date.now() + (expiresIn * 1000);
  }

  dispose(): void {
    this.authStateEmitter.clear();
    this.currentUser = null;
    this.isInitialized = false;
  }
}