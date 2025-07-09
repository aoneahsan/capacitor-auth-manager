import {
  AuthProvider,
  AppleAuthOptions,
  AppleAuthScope,
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
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: (config?: any) => Promise<any>;
      };
    };
  }
}

export class AppleAuthProviderWeb extends OAuthProvider {
  private initPromise: Promise<void> | null = null;

  constructor(config: BaseProviderConfig) {
    super(config);
  }

  protected getOAuthConfig(): OAuthConfig {
    const options = this.options as AppleAuthOptions;
    
    return {
      clientId: options.clientId,
      redirectUri: options.redirectUri,
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      scopes: this.mapAppleScopes(options.scopes),
      responseType: options.responseType || 'code id_token',
      additionalParams: {
        response_mode: options.responseMode || 'form_post',
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
    const options = this.options as AppleAuthOptions;

    try {
      // Load Apple JS SDK
      await this.loadAppleSDK();

      // Initialize Apple ID auth
      window.AppleID!.auth.init({
        clientId: options.clientId,
        scope: this.mapAppleScopes(options.scopes).join(' '),
        redirectURI: options.redirectUri,
        state: options.state,
        nonce: options.nonce,
        usePopup: options.usePopup !== false, // Default to true
      });

      // Load previously authenticated user
      await this.loadCurrentUser();

      this.isInitialized = true;
      this.logger.info('Apple Auth provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Apple Auth', error);
      throw AuthError.fromError(error, this.provider);
    }
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    try {
      const appleOptions = this.options as AppleAuthOptions;
      
      // Generate state and nonce for security
      const state = options?.options?.state || this.generateSecureRandomString();
      const nonce = options?.options?.nonce || this.generateSecureRandomString();
      
      // Store state and nonce for validation
      await this.storage.set(`${this.provider}_oauth_state`, state);
      await this.storage.set(`${this.provider}_oauth_nonce`, nonce);

      // Configure sign-in options
      const signInConfig: any = {
        clientId: appleOptions.clientId,
        scope: this.mapAppleScopes(
          options?.options?.scopes as AppleAuthScope[] || appleOptions.scopes
        ).join(' '),
        redirectURI: appleOptions.redirectUri,
        state,
        nonce,
        usePopup: appleOptions.usePopup !== false,
      };

      // Perform sign in
      const response = await window.AppleID!.auth.signIn(signInConfig);

      // Validate response
      await this.validateAppleResponse(response, state, nonce);

      // Parse user information from response
      const user = this.createAppleAuthUser(response);
      const credential = this.createAppleCredential(response);

      // Save user and credential
      await this.setCurrentUser(user);
      await this.saveCredential(credential);

      return this.createAuthResult(user, credential, response.user ? true : false);
    } catch (error) {
      this.logger.error('Apple sign in failed', error);
      
      if (error && typeof error === 'object' && 'error' in error) {
        throw new AuthError(
          this.mapAppleError((error as any).error),
          (error as any).error,
          this.provider
        );
      }
      
      throw AuthError.fromError(error, this.provider);
    } finally {
      // Clean up temporary storage
      await this.storage.remove(`${this.provider}_oauth_state`);
      await this.storage.remove(`${this.provider}_oauth_nonce`);
    }
  }

  async signOut(_options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      // Apple doesn't provide a sign-out method in their JS SDK
      // Just clear local data
      await this.clearStoredData();
      await this.setCurrentUser(null);

      this.logger.info('Signed out from Apple');
    } catch (error) {
      this.logger.error('Failed to sign out from Apple', error);
      throw AuthError.fromError(error, this.provider);
    }
  }

  async isSupported(): Promise<boolean> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    // Check if we're on HTTPS (required for Apple Sign In)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return false;
    }

    return true;
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
    // This method is not used in Apple JS SDK flow
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Direct OAuth flow not supported for Apple. Use signIn method instead.',
      this.provider
    );
  }

  protected async parseUserFromTokenResponse(response: any): Promise<any> {
    // Apple provides user info directly in the authorization response
    return response.user || {};
  }

  private async loadAppleSDK(): Promise<void> {
    if (window.AppleID?.auth) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.AppleID?.auth) {
          resolve();
        } else {
          reject(new Error('Apple ID SDK failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Apple ID SDK'));
      };
      
      document.head.appendChild(script);
    });
  }

  private mapAppleScopes(scopes?: AppleAuthScope[]): string[] {
    if (!scopes || scopes.length === 0) {
      return [];
    }

    return scopes.map(scope => {
      switch (scope) {
        case AppleAuthScope.EMAIL:
          return 'email';
        case AppleAuthScope.NAME:
          return 'name';
        default:
          return scope;
      }
    });
  }

  private async validateAppleResponse(
    response: any,
    expectedState: string,
    _expectedNonce: string
  ): Promise<void> {
    if (response.error) {
      throw new AuthError(
        this.mapAppleError(response.error),
        response.error,
        this.provider
      );
    }

    if (response.state !== expectedState) {
      throw new AuthError(
        AuthErrorCode.INVALID_STATE,
        'OAuth state mismatch',
        this.provider
      );
    }

    // ID token validation with nonce would be done here
    // For production, you should validate the ID token on your backend
  }

  private createAppleAuthUser(response: any): any {
    const user = response.user || {};
    const idToken = response.authorization?.id_token;
    
    // Parse ID token claims (in production, do this on backend)
    let claims: any = {};
    if (idToken) {
      try {
        const payload = idToken.split('.')[1];
        claims = JSON.parse(atob(payload));
      } catch (error) {
        this.logger.error('Failed to parse ID token', error);
      }
    }

    return {
      uid: claims.sub || response.authorization?.code || this.generateUniqueId(),
      email: user.email || claims.email || null,
      emailVerified: claims.email_verified || false,
      displayName: user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : null,
      photoURL: null, // Apple doesn't provide profile photos
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [{
        providerId: AuthProvider.APPLE,
        uid: claims.sub || response.authorization?.code,
        displayName: user.name ? `${user.name.firstName || ''} ${user.name.lastName || ''}`.trim() : null,
        email: user.email || claims.email || null,
        phoneNumber: null,
        photoURL: null,
      }],
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      refreshToken: response.authorization?.refresh_token,
    };
  }

  private createAppleCredential(response: any): any {
    return {
      providerId: AuthProvider.APPLE,
      signInMethod: 'oauth',
      accessToken: response.authorization?.access_token,
      idToken: response.authorization?.id_token,
      refreshToken: response.authorization?.refresh_token,
      expiresAt: response.authorization?.expires_in 
        ? this.calculateTokenExpiry(response.authorization.expires_in)
        : undefined,
      tokenType: 'Bearer',
      scope: response.authorization?.scope,
      rawNonce: response.nonce,
    };
  }

  private mapAppleError(error: string): AuthErrorCode {
    const errorMap: Record<string, AuthErrorCode> = {
      'user_cancelled_authorize': AuthErrorCode.USER_CANCELLED,
      'popup_closed_by_user': AuthErrorCode.POPUP_CLOSED_BY_USER,
      'popup_blocked': AuthErrorCode.POPUP_BLOCKED,
      'invalid_request': AuthErrorCode.INVALID_REQUEST,
      'invalid_client': AuthErrorCode.CLIENT_NOT_FOUND,
      'invalid_scope': AuthErrorCode.INVALID_SCOPE,
      'unauthorized_client': AuthErrorCode.APP_NOT_AUTHORIZED,
      'access_denied': AuthErrorCode.ACCESS_DENIED,
      'unsupported_response_type': AuthErrorCode.UNSUPPORTED_GRANT_TYPE,
      'server_error': AuthErrorCode.SERVER_ERROR,
      'temporarily_unavailable': AuthErrorCode.TEMPORARILY_UNAVAILABLE,
    };

    return errorMap[error] || AuthErrorCode.INTERNAL_ERROR;
  }
}