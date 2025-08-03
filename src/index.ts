// Main export - the singleton auth instance
export { auth } from './core/auth-manager';

// Core types and utilities
export type {
  AuthManagerConfig,
  AuthState,
  AuthStateListener,
  AuthProviderInterface,
  ProviderManifest,
} from './core/types';

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
} from './definitions';

export { PlatformDetector } from './core/platform';
export type { Platform, PlatformInfo } from './core/platform';

// Error handling
export { AuthError, isAuthError } from './utils/auth-error';

// For backward compatibility with Capacitor plugin interface
export { CapacitorAuthManager } from './capacitor-plugin';
export type { CapacitorAuthManagerPlugin } from './definitions';
