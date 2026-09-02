// Main export - the singleton auth instance
export { auth } from './core/auth-manager.js';

// Core types and utilities
export type {
  AuthManagerConfig,
  AuthState,
  AuthStateListener,
  AuthProviderInterface,
  ProviderManifest,
} from './core/types.js';

// Re-export shared types from definitions (these are used by both old and new API)
export {
  AuthUser,
  UserInfo,
  UserMetadata,
  AuthResult,
  AuthCredential,
  AdditionalUserInfo,
  SignInOptions,
  SignOutOptions,
  AuthProvider,
  AuthErrorCode,
  AuthPersistence,
  ProviderOptions,
  RefreshTokenOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  AuthStateChangeCallback,
  GetIdTokenOptions,
  UpdateProfileOptions,
  BiometricAuthOptions,
  BiometricType,
  AppleAuthScope,
  PasswordStrengthRequirements,
  UsernameRequirements,
  AuthCredentials,
} from './definitions.js';

export { PlatformDetector } from './core/platform.js';
export type { Platform, PlatformInfo } from './core/platform.js';

// Storage backends. Inject a secure implementation on native via
// auth.configure({ storage: new CapacitorPreferencesStorage() }) or your own StorageInterface.
export { WebStorage, CapacitorPreferencesStorage } from './utils/storage.js';
export type { StorageInterface } from './utils/storage.js';

// Error handling
export { AuthError, isAuthError } from './utils/auth-error.js';

// Logger — the shared default instance internals use, plus the class. Adjust verbosity with
// `defaultLogger.setLevel('debug')` or build-time `VITE_LOG_LEVEL` / `LOG_LEVEL`.
export { Logger, defaultLogger } from './utils/logger.js';
export type { LogLevel, LoggerConfig } from './utils/logger.js';

// For backward compatibility with Capacitor plugin interface
export { CapacitorAuthManager } from './capacitor-plugin.js';
export type { CapacitorAuthManagerPlugin } from './definitions.js';
