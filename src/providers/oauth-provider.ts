import {
  AuthResult,
  SignInOptions,
  AuthErrorCode,
  AuthCredential,
  RefreshTokenOptions,
} from '../definitions';
import { BaseAuthProvider } from './base-provider';
import { AuthError } from '../utils/auth-error';

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint?: string;
  userInfoEndpoint?: string;
  scopes?: string[];
  responseType?: string;
  grantType?: string;
  additionalParams?: Record<string, string>;
}

export abstract class OAuthProvider extends BaseAuthProvider {
  protected abstract getOAuthConfig(): OAuthConfig;
  protected abstract parseUserFromTokenResponse(response: any): Promise<any>;

  protected async performOAuthFlow(options?: SignInOptions): Promise<AuthResult> {
    const config = this.getOAuthConfig();
    
    try {
      // Generate state and nonce for security
      const state = this.generateSecureRandomString();
      const nonce = this.generateSecureRandomString();
      
      // Store state and nonce for validation
      await this.storage.set(`${this.provider}_oauth_state`, state);
      await this.storage.set(`${this.provider}_oauth_nonce`, nonce);
      
      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(config, state, nonce, options);
      
      // Perform the OAuth flow (platform-specific implementation)
      const authResponse = await this.openAuthorizationUrl(authUrl);
      
      // Validate response
      await this.validateOAuthResponse(authResponse, state, nonce);
      
      // Exchange authorization code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        authResponse.code,
        config
      );
      
      // Parse user information
      const userInfo = await this.parseUserFromTokenResponse(tokenResponse);
      
      // Create AuthUser and AuthCredential
      const user = this.createAuthUser(userInfo, tokenResponse);
      const credential = this.createOAuthCredential(tokenResponse);
      
      // Save user and credential
      await this.setCurrentUser(user);
      await this.saveCredential(credential);
      
      return this.createAuthResult(user, credential, userInfo.isNewUser);
    } catch (error) {
      this.logger.error(`OAuth flow failed for ${this.provider}`, error);
      throw AuthError.fromError(error, this.provider);
    } finally {
      // Clean up temporary storage
      await this.storage.remove(`${this.provider}_oauth_state`);
      await this.storage.remove(`${this.provider}_oauth_nonce`);
    }
  }

  protected buildAuthorizationUrl(
    config: OAuthConfig,
    state: string,
    nonce: string,
    options?: SignInOptions
  ): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType || 'code',
      state,
      nonce,
      ...config.additionalParams,
    });
    
    // Add scopes
    const scopes = options?.options?.scopes || config.scopes || [];
    if (scopes.length > 0) {
      params.set('scope', scopes.join(' '));
    }
    
    // Add custom parameters
    if (options?.options?.customParameters) {
      Object.entries(options.options.customParameters).forEach(([key, value]) => {
        params.set(key, value);
      });
    }
    
    // Add login hint if provided
    if (options?.options?.loginHint) {
      params.set('login_hint', options.options.loginHint);
    }
    
    // Add prompt if provided
    if (options?.options?.prompt) {
      params.set('prompt', options.options.prompt);
    }
    
    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  protected abstract openAuthorizationUrl(url: string): Promise<any>;

  protected async validateOAuthResponse(
    response: any,
    expectedState: string,
    _expectedNonce: string
  ): Promise<void> {
    if (response.error) {
      throw new AuthError(
        this.mapOAuthError(response.error),
        response.error_description || response.error,
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
    
    // Nonce validation is done after ID token is received
  }

  protected async exchangeCodeForTokens(
    code: string,
    config: OAuthConfig
  ): Promise<any> {
    const params = new URLSearchParams({
      grant_type: config.grantType || 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
    });
    
    if (config.clientSecret) {
      params.set('client_secret', config.clientSecret);
    }
    
    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new AuthError(
          this.mapOAuthError(data.error),
          data.error_description || 'Token exchange failed',
          this.provider,
          data
        );
      }
      
      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Failed to exchange authorization code for tokens',
        this.provider,
        error
      );
    }
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    this.validateInitialized();
    
    const credential = await this.loadCredential();
    if (!credential || !credential.refreshToken) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'No refresh token available',
        this.provider
      );
    }
    
    const config = this.getOAuthConfig();
    
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credential.refreshToken,
        client_id: config.clientId,
      });
      
      if (config.clientSecret) {
        params.set('client_secret', config.clientSecret);
      }
      
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new AuthError(
          this.mapOAuthError(data.error),
          data.error_description || 'Token refresh failed',
          this.provider,
          data
        );
      }
      
      // Update credential with new tokens
      const newCredential = this.createOAuthCredential(data);
      await this.saveCredential(newCredential);
      
      // Update user if needed
      if (this.currentUser) {
        this.currentUser.refreshToken = newCredential.refreshToken;
        await this.setCurrentUser(this.currentUser);
      }
      
      return this.createAuthResult(this.currentUser!, newCredential);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Failed to refresh token',
        this.provider,
        error
      );
    }
  }

  async revokeAccess(token?: string): Promise<void> {
    const config = this.getOAuthConfig();
    
    if (!config.revokeEndpoint) {
      this.logger.warn(`Revoke endpoint not configured for ${this.provider}`);
      return;
    }
    
    try {
      const credential = await this.loadCredential();
      const tokenToRevoke = token || credential?.accessToken;
      
      if (!tokenToRevoke) {
        throw new AuthError(
          AuthErrorCode.INVALID_CREDENTIALS,
          'No token to revoke',
          this.provider
        );
      }
      
      const params = new URLSearchParams({
        token: tokenToRevoke,
        client_id: config.clientId,
      });
      
      if (config.clientSecret) {
        params.set('client_secret', config.clientSecret);
      }
      
      await fetch(config.revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      // Clear stored data regardless of response
      await this.clearStoredData();
      await this.setCurrentUser(null);
    } catch (error) {
      this.logger.error('Failed to revoke token', error);
      // Still clear local data even if revocation fails
      await this.clearStoredData();
      await this.setCurrentUser(null);
    }
  }

  protected createOAuthCredential(tokenResponse: any): AuthCredential {
    return {
      providerId: this.provider,
      signInMethod: 'oauth',
      accessToken: tokenResponse.access_token,
      idToken: tokenResponse.id_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_in 
        ? this.calculateTokenExpiry(tokenResponse.expires_in)
        : undefined,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
    };
  }

  protected createAuthUser(userInfo: any, tokenResponse: any): any {
    return {
      uid: userInfo.id || userInfo.sub || this.generateUniqueId(),
      email: userInfo.email,
      emailVerified: userInfo.email_verified || false,
      displayName: userInfo.name || userInfo.displayName,
      photoURL: userInfo.picture || userInfo.photoURL,
      phoneNumber: userInfo.phone_number,
      isAnonymous: false,
      tenantId: null,
      providerData: [{
        providerId: this.provider,
        uid: userInfo.id || userInfo.sub,
        displayName: userInfo.name,
        email: userInfo.email,
        phoneNumber: userInfo.phone_number,
        photoURL: userInfo.picture,
      }],
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      refreshToken: tokenResponse.refresh_token,
    };
  }

  protected mapOAuthError(error: string): AuthErrorCode {
    const errorMap: Record<string, AuthErrorCode> = {
      'invalid_request': AuthErrorCode.INVALID_REQUEST,
      'unauthorized_client': AuthErrorCode.APP_NOT_AUTHORIZED,
      'access_denied': AuthErrorCode.ACCESS_DENIED,
      'unsupported_response_type': AuthErrorCode.UNSUPPORTED_GRANT_TYPE,
      'invalid_scope': AuthErrorCode.INVALID_SCOPE,
      'server_error': AuthErrorCode.SERVER_ERROR,
      'temporarily_unavailable': AuthErrorCode.TEMPORARILY_UNAVAILABLE,
      'invalid_grant': AuthErrorCode.INVALID_GRANT,
      'invalid_client': AuthErrorCode.CLIENT_NOT_FOUND,
      'interaction_required': AuthErrorCode.INTERACTION_REQUIRED,
      'login_required': AuthErrorCode.LOGIN_REQUIRED,
      'consent_required': AuthErrorCode.CONSENT_REQUIRED,
    };
    
    return errorMap[error] || AuthErrorCode.INTERNAL_ERROR;
  }

  protected generateSecureRandomString(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }
}