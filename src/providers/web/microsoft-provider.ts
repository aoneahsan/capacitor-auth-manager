import { BaseAuthProvider } from '../base-provider';
import {
  AuthResult,
  AuthErrorCode,
  MicrosoftAuthOptions,
} from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import type { SignInOptions, SignOutOptions } from '../../definitions';

export class MicrosoftAuthProviderWeb extends BaseAuthProvider {
  private msalInstance: any;
  private msalConfig: any;
  private clientId: string = '';
  private authority: string = '';
  private redirectUri: string = '';
  private scopes: string[] = [];

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
    const msal = (window as any).msal;
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
      const loginRequest = {
        scopes: this.scopes,
        ...options,
      };

      // Try popup first, fallback to redirect
      let response;
      try {
        response = await this.msalInstance.loginPopup(loginRequest);
      } catch (popupError: any) {
        if (popupError.errorCode === 'popup_window_error') {
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
    } catch (error: any) {
      this.logger.error('Microsoft sign in failed', error);

      if (error.errorCode === 'user_cancelled') {
        throw new AuthError(
          AuthErrorCode.USER_CANCELLED,
          'User cancelled the sign in',
          this.provider
        );
      }

      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `Microsoft sign in failed: ${error.message}`,
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
    } catch (error: any) {
      this.logger.error('Token refresh failed', error);

      if (error.errorCode === 'interaction_required') {
        // Need user interaction, trigger sign in
        return await this.signIn();
      }

      throw new AuthError(
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        `Token refresh failed: ${error.message}`,
        this.provider
      );
    }
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && !!(window as any).msal;
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

  private async handleAuthResponse(response: any): Promise<AuthResult> {
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
      response.account.idTokenClaims?.newUser || false
    );
  }

  private createUserFromMSALAccount(account: any): any {
    const idTokenClaims = account.idTokenClaims || {};

    return {
      uid: account.localAccountId || account.homeAccountId,
      email: idTokenClaims.email || account.username,
      emailVerified: !!idTokenClaims.email_verified,
      displayName: account.name || idTokenClaims.name,
      photoURL: idTokenClaims.picture || null,
      phoneNumber: idTokenClaims.phone_number || null,
      isAnonymous: false,
      tenantId: account.tenantId,
      providerData: [
        {
          providerId: this.provider,
          uid: account.localAccountId,
          displayName: account.name,
          email: account.username,
          phoneNumber: null,
          photoURL: idTokenClaims.picture || null,
        },
      ],
      metadata: {
        creationTime: idTokenClaims.iat
          ? new Date(idTokenClaims.iat * 1000).toISOString()
          : undefined,
        lastSignInTime: new Date().toISOString(),
      },
      customClaims: idTokenClaims,
    };
  }
}
