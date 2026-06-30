import { BaseAuthProvider } from '../base-provider';
import {
  AuthResult,
  AuthErrorCode,
  AuthUser,
  MicrosoftAuthOptions,
} from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import type { SignInOptions, SignOutOptions } from '../../definitions';

/**
 * Minimal structural types for the slice of MSAL (`@azure/msal-browser`, loaded on `window.msal`)
 * this provider uses. Only the used members are typed; the `window` boundary is cast ONCE in
 * {@link getMsal} (mirrors the typed-CDN-boundary pattern in `google-provider.ts`).
 */
interface MsalAccountCompat {
  localAccountId?: string;
  homeAccountId?: string;
  username?: string;
  name?: string;
  tenantId?: string;
  idTokenClaims?: Record<string, unknown>;
}

interface MsalAuthResultCompat {
  account: MsalAccountCompat;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresOn?: Date | null;
  tokenType?: string;
  scopes: string[];
}

interface MsalPublicClientCompat {
  initialize(): Promise<void>;
  handleRedirectPromise(): Promise<MsalAuthResultCompat | null>;
  getAllAccounts(): MsalAccountCompat[];
  loginPopup(request: unknown): Promise<MsalAuthResultCompat>;
  loginRedirect(request: unknown): Promise<void>;
  logoutRedirect(request: unknown): Promise<void>;
  logoutPopup(request: unknown): Promise<void>;
  acquireTokenSilent(request: unknown): Promise<MsalAuthResultCompat>;
}

interface MsalNamespaceCompat {
  PublicClientApplication: new (config: unknown) => MsalPublicClientCompat;
}

/** A thrown value that may carry an MSAL `errorCode`/`message`. */
interface MsalErrorLike {
  errorCode?: string;
  message?: string;
}

export class MicrosoftAuthProviderWeb extends BaseAuthProvider {
  private msalInstance!: MsalPublicClientCompat;
  private msalConfig: Record<string, unknown> = {};
  private clientId: string = '';
  private authority: string = '';
  private redirectUri: string = '';
  private scopes: string[] = [];

  /** Reads the host-page MSAL SDK, casting the `window` boundary exactly once. */
  private getMsal(): MsalNamespaceCompat | undefined {
    return (window as unknown as { msal?: MsalNamespaceCompat }).msal;
  }

  async initialize(): Promise<void> {
    const options = this.options as MicrosoftAuthOptions;

    if (!options.clientId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIG,
        'Microsoft client ID is required',
        this.provider
      );
    }

    this.clientId = options.clientId;
    this.authority =
      options.authority || 'https://login.microsoftonline.com/common';
    this.redirectUri = options.redirectUri || window.location.origin;
    this.scopes = options.scopes || ['openid', 'profile', 'email'];

    // Check if MSAL is available
    const msal = this.getMsal();
    if (!msal) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_NOT_INITIALIZED,
        'Microsoft Authentication Library (MSAL) is not loaded. Please include the MSAL script in your HTML.',
        this.provider
      );
    }

    // Configure MSAL
    this.msalConfig = {
      auth: {
        clientId: this.clientId,
        authority: this.authority,
        redirectUri: this.redirectUri,
        navigateToLoginRequestUrl: true,
      },
      cache: {
        cacheLocation:
          this.persistence === 'session' ? 'sessionStorage' : 'localStorage',
        storeAuthStateInCookie: false,
      },
      system: {
        loggerOptions: {
          loggerCallback: (_level: number, message: string) => {
            this.logger.debug(`MSAL: ${message}`);
          },
        },
      },
    };

    try {
      this.msalInstance = new msal.PublicClientApplication(this.msalConfig);
      await this.msalInstance.initialize();

      // Handle redirect response
      const response = await this.msalInstance.handleRedirectPromise();
      if (response && response.account) {
        await this.handleAuthResponse(response);
      }

      // Check for existing session
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        const user = this.createUserFromMSALAccount(account);
        await this.setCurrentUser(user);
      }

      this.isInitialized = true;
      this.logger.info('Microsoft auth provider initialized');
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.PROVIDER_INIT_FAILED,
        `Failed to initialize Microsoft auth: ${error}`,
        this.provider
      );
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    try {
      // Build the MSAL login request EXPLICITLY from the standard options shape — spreading
      // raw `options` here would leak junk (provider, credentials, …) into MSAL and ignore
      // per-sign-in scopes. Honour per-call scopes/loginHint/prompt, fall back to configured
      // scopes, and omit undefined keys.
      const loginRequest: {
        scopes: string[];
        loginHint?: string;
        prompt?: string;
      } = {
        scopes: options?.options?.scopes ?? this.scopes,
      };
      if (options?.options?.loginHint !== undefined) {
        loginRequest.loginHint = options.options.loginHint;
      }
      if (options?.options?.prompt !== undefined) {
        loginRequest.prompt = options.options.prompt;
      }

      // Try popup first, fallback to redirect
      let response: MsalAuthResultCompat;
      try {
        response = await this.msalInstance.loginPopup(loginRequest);
      } catch (popupError) {
        if ((popupError as MsalErrorLike).errorCode === 'popup_window_error') {
          // Popup blocked, use redirect
          await this.msalInstance.loginRedirect(loginRequest);
          // This will navigate away, so we won't reach here
          throw new AuthError(
            AuthErrorCode.INTERNAL_ERROR,
            'Redirecting to Microsoft login...',
            this.provider
          );
        }
        throw popupError;
      }

      return await this.handleAuthResponse(response);
    } catch (error) {
      this.logger.error('Microsoft sign in failed', error);
      const err = error as MsalErrorLike;

      if (err.errorCode === 'user_cancelled') {
        throw new AuthError(
          AuthErrorCode.USER_CANCELLED,
          'User cancelled the sign in',
          this.provider
        );
      }

      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Microsoft sign in failed: ${err.message}`,
        this.provider
      );
    }
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      const account = this.msalInstance.getAllAccounts()[0];

      if (account) {
        const logoutRequest = {
          account,
          postLogoutRedirectUri: options?.redirectUrl || this.redirectUri,
        };

        if (options?.revokeToken) {
          // Use redirect logout to revoke tokens
          await this.msalInstance.logoutRedirect(logoutRequest);
        } else {
          // Just clear local session
          await this.msalInstance.logoutPopup(logoutRequest);
        }
      }

      await this.setCurrentUser(null);
      await this.clearStoredData();
    } catch (error) {
      this.logger.error('Microsoft sign out failed', error);
      throw new AuthError(
        AuthErrorCode.SIGN_OUT_FAILED,
        `Microsoft sign out failed: ${error}`,
        this.provider
      );
    }
  }

  async refreshToken(): Promise<AuthResult> {
    this.validateInitialized();

    try {
      const account = this.msalInstance.getAllAccounts()[0];
      if (!account) {
        throw new AuthError(
          AuthErrorCode.NO_AUTH_SESSION,
          'No active Microsoft session',
          this.provider
        );
      }

      const silentRequest = {
        account,
        scopes: this.scopes,
        forceRefresh: true,
      };

      const response =
        await this.msalInstance.acquireTokenSilent(silentRequest);
      return await this.handleAuthResponse(response);
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      const err = error as MsalErrorLike;

      if (err.errorCode === 'interaction_required') {
        // Need user interaction, trigger sign in
        return await this.signIn();
      }

      throw new AuthError(
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        `Token refresh failed: ${err.message}`,
        this.provider
      );
    }
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && !!this.getMsal();
  }

  async linkAccount(): Promise<AuthResult> {
    // Microsoft doesn't support account linking in the same way
    // Just trigger a new sign in
    return await this.signIn();
  }

  async unlinkAccount(): Promise<void> {
    // Sign out to unlink
    await this.signOut();
  }

  async revokeAccess(): Promise<void> {
    // Microsoft requires redirect to revoke tokens
    await this.signOut({ revokeToken: true });
  }

  private async handleAuthResponse(
    response: MsalAuthResultCompat
  ): Promise<AuthResult> {
    const user = this.createUserFromMSALAccount(response.account);
    await this.setCurrentUser(user);

    const credential = {
      providerId: this.provider,
      signInMethod: 'oauth',
      accessToken: response.accessToken,
      idToken: response.idToken,
      refreshToken: response.refreshToken || undefined,
      expiresAt: response.expiresOn ? response.expiresOn.getTime() : undefined,
      tokenType: response.tokenType,
      scope: response.scopes.join(' '),
    };

    await this.saveCredential(credential);

    return this.createAuthResult(
      user,
      credential,
      Boolean(response.account.idTokenClaims?.newUser)
    );
  }

  private createUserFromMSALAccount(account: MsalAccountCompat): AuthUser {
    const idTokenClaims = account.idTokenClaims || {};
    const claim = (key: string): string | undefined => {
      const value = idTokenClaims[key];
      return typeof value === 'string' ? value : undefined;
    };
    const iat = idTokenClaims.iat;

    return {
      uid: account.localAccountId || account.homeAccountId || '',
      email: claim('email') || account.username || null,
      emailVerified: !!idTokenClaims.email_verified,
      displayName: account.name || claim('name') || null,
      photoURL: claim('picture') || null,
      phoneNumber: claim('phone_number') || null,
      isAnonymous: false,
      tenantId: account.tenantId || null,
      providerData: [
        {
          providerId: this.provider,
          uid: account.localAccountId || '',
          displayName: account.name || null,
          email: account.username || null,
          phoneNumber: null,
          photoURL: claim('picture') || null,
        },
      ],
      metadata: {
        creationTime:
          typeof iat === 'number'
            ? new Date(iat * 1000).toISOString()
            : undefined,
        lastSignInTime: new Date().toISOString(),
      },
      customClaims: idTokenClaims as Record<
        string,
        string | number | boolean | null
      >,
    };
  }
}
