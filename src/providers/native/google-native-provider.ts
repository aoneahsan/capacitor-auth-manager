import {
  AuthProvider,
  AuthResult,
  AuthUser,
  SignInOptions,
  SignOutOptions,
  RefreshTokenOptions,
  GoogleAuthOptions,
} from '../../definitions.js';
import {
  BaseAuthProvider,
  resolveProviderConfig,
} from '../base-provider.js';
import { AuthError } from '../../utils/auth-error.js';
import { CapacitorAuthManager } from '../../capacitor-plugin.js';

/**
 * Native Google provider — the implementation the registry loads on **iOS / Android**.
 *
 * It is a thin bridge to the `CapacitorAuthManager` Capacitor plugin, whose native code runs the
 * platform Google SDK (iOS: GoogleSignIn; Android: Credential Manager + Google Identity) and returns
 * a **Firebase-agnostic** credential — `{ idToken, accessToken?, serverAuthCode?, user }`. The same
 * `auth.signIn(AuthProvider.GOOGLE)` call routes here on a device and to `GoogleAuthProviderWeb` in
 * the browser, so app code is identical across platforms. Consumers feed `result.credential.idToken`
 * into their own `signInWithCredential(GoogleAuthProvider.credential(idToken))` (or anything else).
 *
 * This module is only ever dynamically imported on native platforms (see ProviderRegistry's
 * platform-aware Google loader), so its top-level `@capacitor/core` import never reaches a web bundle.
 */
export class GoogleNativeProvider extends BaseAuthProvider {
  constructor(config?: unknown) {
    super(resolveProviderConfig(AuthProvider.GOOGLE, config));
  }

  get name(): string {
    return AuthProvider.GOOGLE;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    try {
      // Hand the Google config (clientId / serverClientId / iosClientId / scopes) to the native side
      // once; subsequent signIn() calls only pass per-request SignInProviderOptions.
      await CapacitorAuthManager.initialize({
        providers: [
          {
            provider: AuthProvider.GOOGLE,
            options: this.options as GoogleAuthOptions,
          },
        ],
      });
      await this.loadCurrentUser();
      this.isInitialized = true;
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    try {
      // AuthManagerCore spreads the per-call `options` to the top level before calling us, so read
      // both shapes: a nested `options` object (direct plugin-style callers) or the flattened one.
      const source = (options ?? {}) as SignInOptions & Record<string, unknown>;
      const { credentials, options: nested } = source;
      const flat = Object.fromEntries(
        Object.entries(source).filter(
          ([key]) => !['provider', 'credentials', 'options'].includes(key)
        )
      );
      const perCall = { ...flat, ...(nested ?? {}) } as SignInOptions['options'];
      const result = await CapacitorAuthManager.signIn({
        provider: AuthProvider.GOOGLE,
        credentials,
        options: perCall,
      });
      await this.setCurrentUser(result.user);
      return result;
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    }
  }

  async signOut(_options?: SignOutOptions): Promise<void> {
    try {
      await CapacitorAuthManager.signOut({ provider: AuthProvider.GOOGLE });
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    } finally {
      await this.setCurrentUser(null);
    }
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    try {
      const result = await CapacitorAuthManager.refreshToken({
        provider: AuthProvider.GOOGLE,
      });
      if (result.user) {
        await this.setCurrentUser(result.user);
      }
      return result;
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const raw = (await CapacitorAuthManager.getCurrentUser()) as
        | Partial<AuthUser>
        | null
        | undefined;
      // A Capacitor call cannot resolve `null`; the native side answers `{}` when nobody is signed
      // in. Treat anything without a string `uid` as "no user" — otherwise the empty object was
      // taken as a user and the app restored an authenticated state with no account behind it.
      const user =
        raw && typeof raw.uid === 'string' && raw.uid.length > 0
          ? (raw as AuthUser)
          : null;
      this.currentUser = user;
      return user;
    } catch {
      // Fall back to the last known user if the bridge call fails (e.g. plugin not yet ready).
      return this.currentUser;
    }
  }

  async revokeAccess(_token?: string): Promise<void> {
    try {
      await CapacitorAuthManager.revokeAccess({ provider: AuthProvider.GOOGLE });
    } catch (error) {
      throw AuthError.fromError(error, AuthProvider.GOOGLE);
    } finally {
      await this.setCurrentUser(null);
    }
  }

  async isSupported(): Promise<boolean> {
    // Only loaded on native platforms (the registry routes web/electron to GoogleAuthProviderWeb).
    return true;
  }
}
