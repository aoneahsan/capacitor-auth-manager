import type {
  AuthUser,
  AuthResult,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  GetIdTokenOptions,
  UpdateProfileOptions,
  DeleteAccountOptions,
} from '../definitions.js';

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  provider: string | null;
  signIn: (providerOrOptions: string | SignInOptions) => Promise<AuthResult>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  refreshToken: (provider?: string) => Promise<AuthResult>;
  linkAccount: (options: LinkAccountOptions) => Promise<AuthResult>;
  unlinkAccount: (options: UnlinkAccountOptions) => Promise<void>;
  revokeAccess: (token?: string, provider?: string) => Promise<void>;
  getIdToken: (options?: GetIdTokenOptions) => Promise<string>;
  updateProfile: (options: UpdateProfileOptions) => Promise<AuthUser>;
  deleteAccount: (options?: DeleteAccountOptions) => Promise<void>;
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
  signOut: (options?: SignOutOptions) => Promise<void>;
  error: Error | null;
}
