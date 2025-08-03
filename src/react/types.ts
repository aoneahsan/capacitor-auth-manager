import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions,
} from '../definitions';

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  provider: string | null;
  signIn: (providerOrOptions: string | SignInOptions) => Promise<AuthResult>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  refreshToken: (provider?: string) => Promise<AuthResult>;
  error: Error | null;
}

export interface UseAuthStateReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  provider: string | null;
}

export interface UseAuthProviderReturn {
  isSupported: boolean;
  isConfigured: boolean;
  signIn: () => Promise<AuthResult>;
  signOut: (options?: any) => Promise<void>;
  error: Error | null;
}
