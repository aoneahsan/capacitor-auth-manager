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
} from '../definitions.js';
import { AuthError } from '../utils/auth-error.js';
import { EventEmitter, UnsubscribeFn } from '../utils/event-emitter.js';
import { StorageInterface, WebStorage } from '../utils/storage.js';
import { Logger, defaultLogger } from '../utils/logger.js';
import { AuthProviderInterface } from '../core/types.js';

export interface BaseProviderConfig {
  provider: AuthProvider;
  options: ProviderOptions;
  storage: StorageInterface;
  logger: Logger;
  persistence?: AuthPersistence;
}

/**
 * Normalize a provider constructor argument into a full {@link BaseProviderConfig}.
 *
 * The standalone providers are public (exported from `capacitor-auth-manager/providers/web`) and
 * get constructed two ways: the factory/registry pass a full {@link BaseProviderConfig}, while
 * tests and direct consumers pass the provider's own bare options object. This helper accepts
 * either — a bare object is wrapped with an in-memory storage (`AuthPersistence.NONE`) plus the
 * shared {@link defaultLogger}. Callers that pass a full config keep their injected storage/logger.
 */
export function resolveProviderConfig(
  provider: AuthProvider,
  input?: unknown
): BaseProviderConfig {
  if (
    typeof input === 'object' &&
    input !== null &&
    'storage' in input &&
    'logger' in input &&
    'options' in input
  ) {
    return input as BaseProviderConfig;
  }
  return {
    provider,
    options: (input ?? {}) as ProviderOptions,
    storage: new WebStorage(AuthPersistence.NONE),
    logger: defaultLogger,
  };
}

export abstract class BaseAuthProvider implements AuthProviderInterface {
  protected provider: AuthProvider;
  protected options: ProviderOptions;
  protected storage: StorageInterface;
  protected logger: Logger;
  protected authStateEmitter: EventEmitter<AuthUser | null>;
  protected currentUser: AuthUser | null = null;
  protected isInitialized = false;
  protected persistence: AuthPersistence;

  get name(): string {
    return this.provider;
  }

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

  // Capability methods with concrete defaults: providers that support these operations override
  // them; the rest inherit a uniform "not allowed" signal so capability detection is consistent
  // across every provider (see AuthProviderInterface, where they are optional). Marking them
  // abstract previously forced every subclass to re-implement them just to throw.
  async linkAccount(_options: LinkAccountOptions): Promise<AuthResult> {
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      `Account linking is not supported by provider ${this.provider}`,
      this.provider
    );
  }

  async unlinkAccount(_options: UnlinkAccountOptions): Promise<void> {
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      `Account unlinking is not supported by provider ${this.provider}`,
      this.provider
    );
  }

  async revokeAccess(_token?: string): Promise<void> {
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      `Access revocation is not supported by provider ${this.provider}`,
      this.provider
    );
  }

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
      await this.storage.set(storageKey, user);
    } else {
      await this.storage.remove(storageKey);
    }

    // Emit auth state change
    this.authStateEmitter.emit(user);
  }

  protected async loadCurrentUser(): Promise<void> {
    try {
      const storageKey = `${this.provider}_current_user`;
      const userData = await this.storage.get<AuthUser>(storageKey);

      if (userData) {
        this.currentUser = userData;
        this.logger.debug(
          `Loaded user from storage for provider ${this.provider}`
        );
      }
    } catch (error) {
      this.logger.error('Failed to load user from storage', error);
    }
  }

  protected async saveCredential(credential: AuthCredential): Promise<void> {
    const storageKey = `${this.provider}_credential`;
    await this.storage.set(storageKey, credential);
  }

  protected async loadCredential(): Promise<AuthCredential | null> {
    try {
      const storageKey = `${this.provider}_credential`;
      const credentialData = await this.storage.get<AuthCredential>(storageKey);

      if (credentialData) {
        return credentialData;
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
    // Cryptographically-strong identifier (uid fallback when a provider returns no stable sub).
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    }
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return `${Date.now()}-${hex}`;
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
    return Date.now() + expiresIn * 1000;
  }

  dispose(): void {
    this.authStateEmitter.clear();
    this.currentUser = null;
    this.isInitialized = false;
  }
}
