import { BaseAuthProvider } from '../base-provider.js';
import {
  AuthResult,
  AuthErrorCode,
  AuthUser,
  GitHubAuthOptions,
} from '../../definitions.js';
import { AuthError } from '../../utils/auth-error.js';
import type { SignInOptions, SignOutOptions } from '../../definitions.js';

/** Subset of GitHub's `/user` response this provider reads. */
interface GitHubUserData {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  company?: string | null;
  location?: string | null;
  bio?: string | null;
  public_repos?: number;
  followers?: number;
  following?: number;
}

/** Subset of GitHub's `/user/emails` response this provider reads. */
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/** Token JSON returned by the backend token-exchange proxy (GitHub's token response shape). */
interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/** Narrowed token response after validation — `access_token` is guaranteed present. */
type GitHubValidatedToken = GitHubTokenResponse & { access_token: string };

export class GitHubAuthProviderWeb extends BaseAuthProvider {
  private clientId: string = '';
  private redirectUri: string = '';
  private scopes: string[] = [];
  private tokenExchangeProxy?: string;
  private authWindow: Window | null = null;
  private authPromise: {
    resolve: (value: AuthResult) => void;
    reject: (reason: AuthError) => void;
  } | null = null;
  /** Bound 'message' handler reference so it can be removed in dispose(). */
  private boundAuthMessageHandler: ((event: MessageEvent) => void) | null =
    null;
  /** Active popup-closed polling interval, tracked so it is cleared on every exit path. */
  private popupCheckInterval: ReturnType<typeof setInterval> | null = null;
  /** CSRF state from the most recent sign-in, forwarded to the proxy for re-verification. */
  private lastState: string | null = null;

  async initialize(): Promise<void> {
    const options = this.options as GitHubAuthOptions;

    if (!options.clientId) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIG,
        'GitHub client ID is required',
        this.provider
      );
    }

    this.clientId = options.clientId;
    this.redirectUri =
      options.redirectUri || window.location.origin + '/auth/github/callback';
    this.scopes = options.scopes || ['read:user', 'user:email'];
    this.tokenExchangeProxy =
      options.tokenExchangeProxy || options.tokenEndpoint;

    // Set up message listener for OAuth callback. Keep the bound reference so the exact
    // same function can be removed in dispose() (a fresh `.bind()` would not match).
    this.boundAuthMessageHandler = this.handleAuthMessage.bind(this);
    window.addEventListener('message', this.boundAuthMessageHandler);

    // Check for stored session
    await this.loadCurrentUser();

    this.isInitialized = true;
    this.logger.info('GitHub auth provider initialized');
  }

  async signIn(_options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      this.authPromise = { resolve, reject };

      const state = this.generateState();
      this.lastState = state;
      const authUrl = this.buildAuthUrl(state);

      // Open GitHub OAuth in a popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      this.authWindow = window.open(
        authUrl,
        'github-auth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      );

      if (!this.authWindow) {
        this.authPromise = null;
        reject(
          new AuthError(
            AuthErrorCode.POPUP_BLOCKED,
            'Popup window was blocked. Please allow popups for this site.',
            this.provider
          )
        );
        return;
      }

      // Check if popup is closed. Track the interval so the success path
      // (handleAuthMessage) and dispose() can also clear it — otherwise it leaks.
      this.clearPopupCheckInterval();
      this.popupCheckInterval = setInterval(() => {
        if (this.authWindow?.closed) {
          this.clearPopupCheckInterval();
          if (this.authPromise) {
            this.authPromise = null;
            reject(
              new AuthError(
                AuthErrorCode.USER_CANCELLED,
                'User closed the authentication window',
                this.provider
              )
            );
          }
        }
      }, 1000);
    });
  }

  private clearPopupCheckInterval(): void {
    if (this.popupCheckInterval !== null) {
      clearInterval(this.popupCheckInterval);
      this.popupCheckInterval = null;
    }
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      await this.setCurrentUser(null);
      await this.clearStoredData();

      if (options?.revokeToken) {
        // GitHub requires using their API to revoke tokens
        // This would need to be done server-side for security
        this.logger.warn(
          'Token revocation should be handled server-side for GitHub'
        );
      }

      if (options?.redirectUrl) {
        window.location.href = options.redirectUrl;
      }
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.SIGN_OUT_FAILED,
        `GitHub sign out failed: ${error}`,
        this.provider
      );
    }
  }

  async refreshToken(): Promise<AuthResult> {
    this.validateInitialized();

    // GitHub access tokens don't expire, but we can validate the current session
    const credential = await this.loadCredential();

    if (!credential?.accessToken) {
      throw new AuthError(
        AuthErrorCode.NO_AUTH_SESSION,
        'No active GitHub session',
        this.provider
      );
    }

    try {
      // Validate token by fetching user data
      const userData = await this.fetchUserData(credential.accessToken);
      const user = await this.createUserFromGitHubData(
        userData,
        credential.accessToken
      );

      await this.setCurrentUser(user);

      return this.createAuthResult(user, credential, false);
    } catch (error) {
      // Token is invalid, need to re-authenticate
      this.logger.error('Token validation failed, re-authenticating', error);
      return await this.signIn();
    }
  }

  async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && 'open' in window;
  }

  async linkAccount(): Promise<AuthResult> {
    // GitHub doesn't support account linking
    // Re-authenticate to ensure current credentials
    return await this.signIn();
  }

  async unlinkAccount(): Promise<void> {
    await this.signOut();
  }

  async revokeAccess(_token?: string): Promise<void> {
    // GitHub token revocation requires server-side implementation
    // for security reasons (needs client secret)
    this.logger.warn(
      'GitHub token revocation should be implemented server-side'
    );
    await this.signOut({ revokeToken: true });
  }

  private buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: state,
      allow_signup: 'true',
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  private generateState(): string {
    return btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
    );
  }

  private async handleAuthMessage(event: MessageEvent): Promise<void> {
    // Validate origin
    if (!event.origin.startsWith(window.location.origin)) {
      return;
    }

    // Check if this is our auth message
    if (event.data?.type !== 'github-auth-callback') {
      return;
    }

    // The callback arrived — stop polling for a closed popup (success path cleanup).
    this.clearPopupCheckInterval();

    if (this.authWindow) {
      this.authWindow.close();
      this.authWindow = null;
    }

    if (!this.authPromise) {
      return;
    }

    const { resolve, reject } = this.authPromise;
    this.authPromise = null;

    try {
      if (event.data.error) {
        throw new AuthError(
          AuthErrorCode.SIGN_IN_FAILED,
          event.data.error,
          this.provider
        );
      }

      if (!event.data.code) {
        throw new AuthError(
          AuthErrorCode.SIGN_IN_FAILED,
          'No authorization code received',
          this.provider
        );
      }

      // Exchange code for token (this should be done server-side in production)
      const tokenData = await this.exchangeCodeForToken(event.data.code);

      // Get user data
      const userData = await this.fetchUserData(tokenData.access_token);
      const user = await this.createUserFromGitHubData(
        userData,
        tokenData.access_token
      );

      await this.setCurrentUser(user);

      const credential = {
        providerId: this.provider,
        signInMethod: 'oauth',
        accessToken: tokenData.access_token,
        idToken: undefined,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in
          ? Date.now() + tokenData.expires_in * 1000
          : undefined,
        tokenType: tokenData.token_type || 'bearer',
        scope: tokenData.scope || this.scopes.join(' '),
      };

      await this.saveCredential(credential);

      const result = this.createAuthResult(user, credential, true);
      resolve(result);
    } catch (error) {
      reject(AuthError.fromError(error, this.provider));
    }
  }

  private async exchangeCodeForToken(
    code: string
  ): Promise<GitHubValidatedToken> {
    // GitHub does NOT permit browser-side code→token exchange (it needs the client secret
    // and blocks CORS), so the exchange must run on a developer-supplied backend proxy.
    if (!this.tokenExchangeProxy) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIG,
        'GitHub sign-in requires a backend token-exchange proxy. Set `tokenExchangeProxy` ' +
          '(or `tokenEndpoint`) in the GitHub provider config to a server endpoint that ' +
          'exchanges the authorization code for an access token. See the GitHub provider ' +
          'setup guide / docs/providers for an example.',
        this.provider
      );
    }

    let response: Response;
    try {
      response = await fetch(this.tokenExchangeProxy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: this.redirectUri,
          state: this.lastState,
        }),
      });
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Failed to reach the GitHub token-exchange proxy',
        this.provider,
        error as Record<string, unknown>
      );
    }

    const data = (await response
      .json()
      .catch(() => null)) as GitHubTokenResponse | null;

    if (!response.ok || !data || !data.access_token) {
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        `GitHub token exchange failed${
          data?.error_description
            ? `: ${data.error_description}`
            : data?.error
              ? `: ${data.error}`
              : ''
        }`,
        this.provider
      );
    }

    return { ...data, access_token: data.access_token };
  }

  private async fetchUserData(accessToken: string): Promise<GitHubUserData> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new AuthError(
        AuthErrorCode.INTERNAL_ERROR,
        `Failed to fetch user data: ${response.statusText}`,
        this.provider
      );
    }

    return await response.json();
  }

  private async fetchUserEmails(accessToken: string): Promise<GitHubEmail[]> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  private async createUserFromGitHubData(
    userData: GitHubUserData,
    accessToken: string
  ): Promise<AuthUser> {
    // Get primary email
    const emails = await this.fetchUserEmails(accessToken);
    const primaryEmail = emails.find((e) => e.primary) || emails[0];

    return {
      uid: userData.id.toString(),
      email: primaryEmail?.email || userData.email || null,
      emailVerified: primaryEmail?.verified || false,
      displayName: userData.name || userData.login,
      photoURL: userData.avatar_url || null,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: this.provider,
          uid: userData.id.toString(),
          displayName: userData.name || userData.login,
          email: primaryEmail?.email || userData.email || null,
          phoneNumber: null,
          photoURL: userData.avatar_url || null,
        },
      ],
      metadata: {
        creationTime: userData.created_at
          ? new Date(userData.created_at).toISOString()
          : undefined,
        lastSignInTime: new Date().toISOString(),
      },
      customClaims: {
        login: userData.login,
        company: userData.company ?? null,
        location: userData.location ?? null,
        bio: userData.bio ?? null,
        public_repos: userData.public_repos ?? null,
        followers: userData.followers ?? null,
        following: userData.following ?? null,
      },
    };
  }

  dispose(): void {
    // Remove the global 'message' listener added in initialize() so it doesn't leak across
    // repeated init/dispose cycles, and stop any active popup-polling interval.
    if (this.boundAuthMessageHandler) {
      window.removeEventListener('message', this.boundAuthMessageHandler);
      this.boundAuthMessageHandler = null;
    }
    this.clearPopupCheckInterval();
    if (this.authWindow) {
      try {
        this.authWindow.close();
      } catch {
        // window already closed / cross-origin — safe to ignore
      }
      this.authWindow = null;
    }
    this.authPromise = null;
    super.dispose();
  }
}
