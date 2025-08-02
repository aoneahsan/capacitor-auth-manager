import type { AuthUser, AuthResult } from '../definitions';

export interface AuthManagerConfig {
  providers?: Record<string, any>;
  persistence?: 'local' | 'session' | 'memory';
  autoRefreshToken?: boolean;
  tokenRefreshBuffer?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
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
  signIn(options?: any): Promise<AuthResult>;
  signOut(options?: any): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken?(options?: any): Promise<AuthResult>;
  isSupported(): Promise<boolean>;
  initialize?(config: any): Promise<void>;
  dispose?(): void;
}

export interface ProviderManifest {
  name: string;
  displayName: string;
  packageName?: string;
  importPath?: string;
  setupInstructions?: string;
  configSchema?: Record<string, any>;
  platforms?: ('web' | 'ios' | 'android' | 'electron')[];
}