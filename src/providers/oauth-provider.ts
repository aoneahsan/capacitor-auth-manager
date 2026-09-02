import {
  AuthResult,
  SignInOptions,
  AuthErrorCode,
  AuthCredential,
  RefreshTokenOptions,
  AuthUser,
} from '../definitions.js';
import { BaseAuthProvider } from './base-provider.js';
import { AuthError } from '../utils/auth-error.js';

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  [key: string]: string | number | undefined;
}

export interface OAuthUserInfo {
  id?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  displayName?: string;
  picture?: string;
  photoURL?: string;
  phone_number?: string;
  isNewUser?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface OAuthConfig {
  clientId: string;
  /**
   * @deprecated Do NOT set a client secret in browser-facing config — it ships in the JS
   * bundle and is fully recoverable by end users. Use a backend token-exchange proxy
   * (point `tokenEndpoint` at your server). Retained only for native/server-side use.
   */
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
  /** Enable PKCE (RFC 7636) for the authorization-code flow. Defaults to true. */
  pkceEnabled?: boolean;
}

export abstract class OAuthProvider extends BaseAuthProvider {
  protected abstract getOAuthConfig(): OAuthConfig;
  protected abstract parseUserFromTokenResponse(
    response: OAuthTokenResponse
  ): Promise<OAuthUserInfo>;

  protected async performOAuthFlow(
    options?: SignInOptions
  ): Promise<AuthResult> {
    const config = this.getOAuthConfig();

    try {
      // Generate state and nonce for security
      const state = this.generateSecureRandomString();
      const nonce = this.generateSecureRandomString();

      // PKCE (RFC 7636) — default on; requires Web Crypto 'subtle' (HTTPS / localhost).
      let codeVerifier: string | undefined;
      let codeChallenge: string | undefined;
      if (config.pkceEnabled !== false) {
        if (typeof crypto !== 'undefined' && crypto.subtle) {
          codeVerifier = this.generateCodeVerifier();
          codeChallenge = await this.generateCodeChallenge(codeVerifier);
        } else {
          this.logger.warn(
            `PKCE skipped for ${this.provider}: Web Crypto 'subtle' is unavailable (insecure context). Serve over HTTPS to enable PKCE.`
          );
        }
      }

      // Store state, nonce, and PKCE verifier for validation
      await this.storage.set(`${this.provider}_oauth_state`, state);
      await this.storage.set(`${this.provider}_oauth_nonce`, nonce);
      if (codeVerifier) {
        await this.storage.set(`${this.provider}_oauth_verifier`, codeVerifier);
      }

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(
        config,
        state,
        nonce,
        options,
        codeChallenge
      );

      // Perform the OAuth flow (platform-specific implementation)
      const authResponse = await this.openAuthorizationUrl(authUrl);

      // Validate response
      await this.validateOAuthResponse(authResponse, state, nonce);

      // Exchange authorization code for tokens
      if (!authResponse.code) {
        throw new AuthError(
          AuthErrorCode.INVALID_GRANT,
          'No authorization code received',
          this.provider
        );
      }
      const tokenResponse = await this.exchangeCodeForTokens(
        authResponse.code,
        config,
        codeVerifier
      );

      // Validate the ID token's nonce + expiry (replay protection). NOTE: the signature is
      // NOT verified client-side — always re-validate ID tokens on your backend.
      this.validateIdToken(tokenResponse.id_token, nonce);

      // Parse user information
      const userInfo = await this.parseUserFromTokenResponse(tokenResponse);

      // Create AuthUser and AuthCredential
      const user = this.createAuthUser(userInfo, tokenResponse);
      const credential = this.createOAuthCredential(tokenResponse);

      // Save user and credential
      await this.setCurrentUser(user);
      await this.saveCredential(credential);

      return this.createAuthResult(
        user,
        credential,
        userInfo.isNewUser || false
      );
    } catch (error) {
      this.logger.error(`OAuth flow failed for ${this.provider}`, error);
      throw AuthError.fromError(error, this.provider);
    } finally {
      // Clean up temporary storage
      await this.storage.remove(`${this.provider}_oauth_state`);
      await this.storage.remove(`${this.provider}_oauth_nonce`);
      await this.storage.remove(`${this.provider}_oauth_verifier`);
    }
  }

  protected buildAuthorizationUrl(
    config: OAuthConfig,
    state: string,
    nonce: string,
    options?: SignInOptions,
    codeChallenge?: string
  ): string {
    const params = new URLSearchParams();

    // Developer-supplied params FIRST, so the security-critical params set below cannot be
    // overridden by additionalParams / customParameters.
    if (config.additionalParams) {
      for (const [key, value] of Object.entries(config.additionalParams)) {
        params.set(key, value);
      }
    }
    if (options?.options?.customParameters) {
      for (const [key, value] of Object.entries(
        options.options.customParameters
      )) {
        params.set(key, value);
      }
    }

    // Scopes
    const scopes = options?.options?.scopes || config.scopes || [];
    if (scopes.length > 0) {
      params.set('scope', scopes.join(' '));
    }

    // Login hint / prompt
    if (options?.options?.loginHint) {
      params.set('login_hint', options.options.loginHint);
    }
    if (options?.options?.prompt) {
      params.set('prompt', options.options.prompt);
    }

    // Security-critical parameters — set LAST so custom params cannot override them.
    params.set('client_id', config.clientId);
    params.set('redirect_uri', config.redirectUri);
    params.set('response_type', config.responseType || 'code');
    params.set('state', state);
    params.set('nonce', nonce);
    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    this.assertSecureEndpoint(config.authorizationEndpoint);
    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  protected abstract openAuthorizationUrl(
    url: string
  ): Promise<{ code?: string; state?: string; error?: string }>;

  protected async validateOAuthResponse(
    response: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    },
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
    config: OAuthConfig,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: config.grantType || 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
    });

    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    if (config.clientSecret) {
      this.warnClientSecretInBrowser();
      params.set('client_secret', config.clientSecret);
    }

    this.assertSecureEndpoint(config.tokenEndpoint);

    try {
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as OAuthTokenResponse;

      if (!response.ok) {
        const errorData = data as unknown as {
          error: string;
          error_description?: string;
        };
        throw new AuthError(
          this.mapOAuthError(errorData.error),
          errorData.error_description || 'Token exchange failed',
          this.provider,
          errorData as Record<string, unknown>
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
        error as Record<string, unknown>
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
        this.warnClientSecretInBrowser();
        params.set('client_secret', config.clientSecret);
      }

      this.assertSecureEndpoint(config.tokenEndpoint);

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as OAuthTokenResponse;

      if (!response.ok) {
        const errorData = data as unknown as {
          error: string;
          error_description?: string;
        };
        throw new AuthError(
          this.mapOAuthError(errorData.error),
          errorData.error_description || 'Token refresh failed',
          this.provider,
          errorData as Record<string, unknown>
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
        error as Record<string, unknown>
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
        this.warnClientSecretInBrowser();
        params.set('client_secret', config.clientSecret);
      }

      this.assertSecureEndpoint(config.revokeEndpoint);

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

  protected createOAuthCredential(
    tokenResponse: OAuthTokenResponse
  ): AuthCredential {
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

  protected createAuthUser(
    userInfo: OAuthUserInfo,
    tokenResponse: OAuthTokenResponse
  ): AuthUser {
    return {
      uid: userInfo.id || userInfo.sub || this.generateUniqueId(),
      email: userInfo.email || null,
      emailVerified: userInfo.email_verified || false,
      displayName: userInfo.name || userInfo.displayName || null,
      photoURL: userInfo.picture || userInfo.photoURL || null,
      phoneNumber: userInfo.phone_number || null,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: this.provider,
          uid: userInfo.id || userInfo.sub || '',
          displayName: userInfo.name || null,
          email: userInfo.email || null,
          phoneNumber: userInfo.phone_number || null,
          photoURL: userInfo.picture || null,
        },
      ],
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
      refreshToken: tokenResponse.refresh_token,
    };
  }

  protected mapOAuthError(error: string): AuthErrorCode {
    const errorMap: Record<string, AuthErrorCode> = {
      invalid_request: AuthErrorCode.INVALID_REQUEST,
      unauthorized_client: AuthErrorCode.APP_NOT_AUTHORIZED,
      access_denied: AuthErrorCode.ACCESS_DENIED,
      unsupported_response_type: AuthErrorCode.UNSUPPORTED_GRANT_TYPE,
      invalid_scope: AuthErrorCode.INVALID_SCOPE,
      server_error: AuthErrorCode.SERVER_ERROR,
      temporarily_unavailable: AuthErrorCode.TEMPORARILY_UNAVAILABLE,
      invalid_grant: AuthErrorCode.INVALID_GRANT,
      invalid_client: AuthErrorCode.CLIENT_NOT_FOUND,
      interaction_required: AuthErrorCode.INTERACTION_REQUIRED,
      login_required: AuthErrorCode.LOGIN_REQUIRED,
      consent_required: AuthErrorCode.CONSENT_REQUIRED,
    };

    return errorMap[error] || AuthErrorCode.INTERNAL_ERROR;
  }

  protected generateSecureRandomString(length = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    return result;
  }

  /** RFC 7636 PKCE code verifier: 64 chars from the unreserved set [A-Za-z0-9]. */
  protected generateCodeVerifier(): string {
    return this.generateSecureRandomString(64);
  }

  /** Derives the S256 PKCE code challenge: base64url(SHA-256(verifier)). */
  protected async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  protected base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /** Decodes a JWT payload without verifying the signature. Returns null if malformed. */
  protected decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = payload.length % 4;
      if (pad) {
        payload += '='.repeat(4 - pad);
      }
      return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Validates the ID token's nonce (replay protection) and expiry. The signature is NOT
   * verified client-side — always re-validate ID tokens on your backend before trusting them.
   */
  protected validateIdToken(
    idToken: string | undefined,
    expectedNonce: string
  ): void {
    if (!idToken) {
      return;
    }
    const payload = this.decodeJwtPayload(idToken);
    if (!payload) {
      return;
    }
    if (payload.nonce !== undefined && payload.nonce !== expectedNonce) {
      throw new AuthError(
        AuthErrorCode.INVALID_NONCE,
        'OIDC nonce mismatch in ID token',
        this.provider
      );
    }
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      throw new AuthError(
        AuthErrorCode.TOKEN_EXPIRED,
        'ID token is expired',
        this.provider
      );
    }
  }

  protected warnClientSecretInBrowser(): void {
    this.logger.warn(
      `${this.provider}: a client secret was supplied to a browser-facing provider. Secrets ` +
        `placed in client config ship in the JS bundle and are recoverable by end users. Use a ` +
        `backend token-exchange proxy (set tokenEndpoint to your server) instead.`
    );
  }

  protected assertSecureEndpoint(url: string): void {
    try {
      const parsed = new URL(url);
      const isLocalhost =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (parsed.protocol !== 'https:' && !isLocalhost) {
        this.logger.warn(
          `${this.provider}: endpoint ${url} is not HTTPS — credentials/tokens may be sent in cleartext.`
        );
      }
    } catch {
      // Malformed URL: let the subsequent fetch surface the error.
    }
  }
}
