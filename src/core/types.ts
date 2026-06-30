import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions,
  RefreshTokenOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  ProviderOptions,
} from '../definitions';
import type { StorageInterface } from '../utils/storage';

export interface AuthManagerConfig {
  providers?: Record<string, ProviderOptions>;
  persistence?: 'local' | 'session' | 'memory';
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /**
   * Custom storage backend. Web tokens otherwise live in localStorage (readable by any XSS /
   * third-party script on the origin). On native, inject a secure implementation —
   * `CapacitorPreferencesStorage` (from this package) or a Keychain/Keystore-backed adapter —
   * to keep tokens out of the webview's localStorage.
   */
  storage?: StorageInterface;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  provider: string | null;
}

export type AuthStateListener = (state: AuthState) => void;

export interface AuthProviderInterface {
  name: string;
  signIn(options?: SignInOptions): Promise<AuthResult>;
  signOut(options?: SignOutOptions): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken?(options?: RefreshTokenOptions): Promise<AuthResult>;
  isSupported(): Promise<boolean>;
  initialize?(config?: ProviderOptions): Promise<void>;
  dispose?(): void;
  linkAccount?(options?: LinkAccountOptions): Promise<AuthResult>;
  unlinkAccount?(options?: UnlinkAccountOptions): Promise<void>;
  revokeAccess?(token?: string): Promise<void>;
}

export interface ProviderManifest {
  name: string;
  displayName: string;
  packageName?: string;
  importPath?: string;
  setupInstructions?: string;
  configSchema?: Record<string, unknown>;
  platforms?: ('web' | 'ios' | 'android' | 'electron')[];
}
