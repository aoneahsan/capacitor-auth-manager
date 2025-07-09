import {
  AuthProvider,
  GoogleAuthOptions,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
  AuthResult,
  AuthErrorCode,
} from '../../definitions';
import { OAuthProvider, OAuthConfig } from '../oauth-provider';
import { BaseProviderConfig } from '../base-provider';
import { AuthError } from '../../utils/auth-error';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export class GoogleAuthProviderWeb extends OAuthProvider {
  private initPromise: Promise<void> | null = null;

  constructor(config: BaseProviderConfig) {
    super(config);
  }

  protected getOAuthConfig(): OAuthConfig {
    const options = this.options as GoogleAuthOptions;
    
    return {
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      redirectUri: window.location.origin,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
      scopes: options.scopes || ['openid', 'email', 'profile'],
      responseType: 'code',
      additionalParams: {
        access_type: options.offlineAccess ? 'offline' : 'online',
        include_granted_scopes: options.includeGrantedScopes ? 'true' : 'false',
      },
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async _initialize(): Promise<void> {
    const options = this.options as GoogleAuthOptions;

    try {
      // Load Google Identity Services library
      await this.loadGoogleIdentityServices();

      // Initialize Google client
      window.google.accounts.oauth2.initCodeClient({
        client_id: options.clientId,
        scope: (options.scopes || ['openid', 'email', 'profile']).join(' '),
        ux_mode: 'popup',
        callback: (_response: any) => {
          // This callback will be overridden per sign-in
        },
      });

      // Load previously authenticated user
      await this.loadCurrentUser();

      this.isInitialized = true;
      this.logger.info('Google Auth provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Auth', error);
      throw AuthError.fromError(error, this.provider);
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      try {
        const googleOptions = this.options as GoogleAuthOptions;
        
        // Configure sign-in options
        const signInConfig: any = {
          client_id: googleOptions.clientId,
          scope: (options?.options?.scopes || googleOptions.scopes || ['openid', 'email', 'profile']).join(' '),
          callback: async (response: any) => {
            if (response.error) {
              reject(new AuthError(
                this.mapGoogleError(response.error),
                response.error_description || response.error,
                this.provider
              ));
              return;
            }

            try {
              // Exchange authorization code for tokens
              const tokenResponse = await this.exchangeCodeForTokens(
                response.code,
                this.getOAuthConfig()
              );

              // Get user info
              const userInfo = await this.getUserInfo(tokenResponse.access_token);
              
              // Create AuthUser and AuthCredential
              const user = this.createAuthUser(userInfo, tokenResponse);
              const credential = this.createOAuthCredential(tokenResponse);
              
              // Save user and credential
              await this.setCurrentUser(user);
              await this.saveCredential(credential);
              
              resolve(this.createAuthResult(user, credential, false));
            } catch (error) {
              reject(AuthError.fromError(error, this.provider));
            }
          },
        };

        // Add login hint if provided
        if (options?.options?.loginHint || googleOptions.loginHint) {
          signInConfig.login_hint = options?.options?.loginHint || googleOptions.loginHint;
        }

        // Add hosted domain if provided
        if (googleOptions.hostedDomain) {
          signInConfig.hd = googleOptions.hostedDomain;
        }

        // Create new client with callback
        const client = window.google.accounts.oauth2.initCodeClient(signInConfig);
        
        // Request authorization code
        client.requestCode();
      } catch (error) {
        reject(AuthError.fromError(error, this.provider));
      }
    });
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      // Revoke token if requested
      if (options?.revokeToken) {
        const credential = await this.loadCredential();
        if (credential?.accessToken) {
          await this.revokeAccess(credential.accessToken);
        }
      }

      // Clear stored data
      await this.clearStoredData();
      await this.setCurrentUser(null);

      // Disconnect Google account if available
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      this.logger.info('Signed out from Google');
    } catch (error) {
      this.logger.error('Failed to sign out from Google', error);
      throw AuthError.fromError(error, this.provider);
    }
  }

  async isSupported(): Promise<boolean> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    // Check if we can load Google Identity Services
    try {
      await this.loadGoogleIdentityServices();
      return true;
    } catch {
      return false;
    }
  }

  async linkAccount(options: LinkAccountOptions): Promise<AuthResult> {
    // For web, linking is the same as signing in
    return this.signIn(options);
  }

  async unlinkAccount(_options: UnlinkAccountOptions): Promise<void> {
    // For web, unlinking is the same as signing out
    await this.signOut();
  }

  protected async openAuthorizationUrl(_url: string): Promise<any> {
    // This method is not used in Google Identity Services flow
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Direct OAuth flow not supported for Google. Use signIn method instead.',
      this.provider
    );
  }

  protected async parseUserFromTokenResponse(response: any): Promise<any> {
    // Get user info from the userinfo endpoint
    if (response.access_token) {
      return this.getUserInfo(response.access_token);
    }

    throw new AuthError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'No access token in response',
      this.provider
    );
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new AuthError(
          AuthErrorCode.NETWORK_ERROR,
          'Failed to fetch user info',
          this.provider
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Failed to fetch user info',
        this.provider,
        error
      );
    }
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          reject(new Error('Google Identity Services failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  private mapGoogleError(error: string): AuthErrorCode {
    const errorMap: Record<string, AuthErrorCode> = {
      'access_denied': AuthErrorCode.ACCESS_DENIED,
      'unauthorized_client': AuthErrorCode.APP_NOT_AUTHORIZED,
      'invalid_request': AuthErrorCode.INVALID_REQUEST,
      'invalid_scope': AuthErrorCode.INVALID_SCOPE,
      'server_error': AuthErrorCode.SERVER_ERROR,
      'temporarily_unavailable': AuthErrorCode.TEMPORARILY_UNAVAILABLE,
      'popup_closed_by_user': AuthErrorCode.POPUP_CLOSED_BY_USER,
      'popup_blocked': AuthErrorCode.POPUP_BLOCKED,
    };

    return errorMap[error] || AuthErrorCode.INTERNAL_ERROR;
  }

  protected createAuthUser(userInfo: any, tokenResponse: any): any {
    return {
      uid: userInfo.sub,
      email: userInfo.email,
      emailVerified: userInfo.email_verified || false,
      displayName: userInfo.name,
      photoURL: userInfo.picture,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [{
        providerId: AuthProvider.GOOGLE,
        uid: userInfo.sub,
        displayName: userInfo.name,
        email: userInfo.email,
        phoneNumber: null,
        photoURL: userInfo.picture,
      }],
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      refreshToken: tokenResponse.refresh_token,
    };
  }
}