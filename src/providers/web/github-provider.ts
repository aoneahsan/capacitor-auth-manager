import { BaseAuthProvider } from '../base-provider';
import { AuthProvider, AuthResult, AuthError, AuthErrorCode, GitHubAuthOptions } from '../../definitions';
import type { SignInOptions, SignOutOptions } from '../../definitions';

export class GitHubAuthProviderWeb extends BaseAuthProvider {
  private clientId: string;
  private redirectUri: string;
  private scopes: string[];
  private authWindow: Window | null = null;
  private authPromise: { resolve: Function; reject: Function } | null = null;

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
    this.redirectUri = options.redirectUri || window.location.origin + '/auth/github/callback';
    this.scopes = options.scopes || ['read:user', 'user:email'];

    // Set up message listener for OAuth callback
    window.addEventListener('message', this.handleAuthMessage.bind(this));

    // Check for stored session
    await this.loadCurrentUser();

    this.isInitialized = true;
    this.logger.info('GitHub auth provider initialized');
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    this.validateInitialized();

    return new Promise((resolve, reject) => {
      this.authPromise = { resolve, reject };

      const state = this.generateState();
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
        reject(new AuthError(
          AuthErrorCode.POPUP_BLOCKED,
          'Popup window was blocked. Please allow popups for this site.',
          this.provider
        ));
        return;
      }

      // Check if popup is closed
      const checkInterval = setInterval(() => {
        if (this.authWindow?.closed) {
          clearInterval(checkInterval);
          if (this.authPromise) {
            this.authPromise = null;
            reject(new AuthError(
              AuthErrorCode.USER_CANCELLED,
              'User closed the authentication window',
              this.provider
            ));
          }
        }
      }, 1000);
    });
  }

  async signOut(options?: SignOutOptions): Promise<void> {
    this.validateInitialized();

    try {
      await this.setCurrentUser(null);
      await this.clearStoredData();

      if (options?.revokeToken) {
        // GitHub requires using their API to revoke tokens
        // This would need to be done server-side for security
        this.logger.warn('Token revocation should be handled server-side for GitHub');
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
      const user = await this.createUserFromGitHubData(userData, credential.accessToken);
      
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

  async revokeAccess(token?: string): Promise<void> {
    // GitHub token revocation requires server-side implementation
    // for security reasons (needs client secret)
    this.logger.warn('GitHub token revocation should be implemented server-side');
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
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
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
      const user = await this.createUserFromGitHubData(userData, tokenData.access_token);
      
      await this.setCurrentUser(user);

      const credential = {
        providerId: this.provider,
        signInMethod: 'oauth',
        accessToken: tokenData.access_token,
        idToken: undefined,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
        tokenType: tokenData.token_type || 'bearer',
        scope: tokenData.scope || this.scopes.join(' '),
      };

      await this.saveCredential(credential);

      const result = this.createAuthResult(user, credential, true);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    // NOTE: This should be done server-side in production to keep client secret secure
    throw new AuthError(
      AuthErrorCode.INTERNAL_ERROR,
      'GitHub token exchange must be implemented server-side. Please set up a backend endpoint to exchange the authorization code for an access token.',
      this.provider
    );
  }

  private async fetchUserData(accessToken: string): Promise<any> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
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

  private async fetchUserEmails(accessToken: string): Promise<any[]> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  }

  private async createUserFromGitHubData(userData: any, accessToken: string): Promise<any> {
    // Get primary email
    const emails = await this.fetchUserEmails(accessToken);
    const primaryEmail = emails.find(e => e.primary) || emails[0];

    return {
      uid: userData.id.toString(),
      email: primaryEmail?.email || userData.email || null,
      emailVerified: primaryEmail?.verified || false,
      displayName: userData.name || userData.login,
      photoURL: userData.avatar_url || null,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [{
        providerId: this.provider,
        uid: userData.id.toString(),
        displayName: userData.name || userData.login,
        email: primaryEmail?.email || userData.email || null,
        phoneNumber: null,
        photoURL: userData.avatar_url || null,
      }],
      metadata: {
        creationTime: userData.created_at ? new Date(userData.created_at).toISOString() : undefined,
        lastSignInTime: new Date().toISOString(),
      },
      customClaims: {
        login: userData.login,
        company: userData.company,
        location: userData.location,
        bio: userData.bio,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
      },
    };
  }
}