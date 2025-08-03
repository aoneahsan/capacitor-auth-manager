import {
  AuthProvider,
  AuthResult,
  SignInOptions,
  SignOutOptions,
  RefreshTokenOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
} from '../../definitions';
import { BaseProviderConfig } from '../base-provider';
import {
  OAuthProvider,
  OAuthConfig,
  OAuthTokenResponse,
  OAuthUserInfo,
} from '../oauth-provider';
import { AuthError } from '../../utils/auth-error';

export interface LinkedInAuthOptions {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

export class LinkedInProvider extends OAuthProvider {
  provider = AuthProvider.LINKEDIN;
  private clientId = '';
  private redirectUri = '';
  private scopes: string[] = [];
  private authWindow: Window | null = null;

  constructor(config: BaseProviderConfig) {
    super(config);
    const options = config.options as LinkedInAuthOptions;
    this.clientId = options.clientId || '';
    this.redirectUri = options.redirectUri || '';
    this.scopes = options.scopes || ['openid', 'profile', 'email'];
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    return this.performOAuthFlow(options);
  }

  async signOut(_options?: SignOutOptions): Promise<void> {
    await this.clearStoredData();
    await this.setCurrentUser(null);
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    throw new AuthError(
      'NOT_IMPLEMENTED',
      'Token refresh not implemented for LinkedIn provider'
    );
  }

  protected getOAuthConfig(): OAuthConfig {
    return {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: this.scopes,
    };
  }

  protected async parseUserFromTokenResponse(
    _response: OAuthTokenResponse
  ): Promise<OAuthUserInfo> {
    // In a real implementation, you would parse the user info from the token response
    // or make an additional API call to get user details
    return {
      id: 'linkedin_user_123',
      email: 'user@linkedin.com',
      name: 'LinkedIn User',
      picture: 'https://ui-avatars.com/api/?name=LinkedIn+User',
      email_verified: true,
      isNewUser: false,
    };
  }

  protected async openAuthorizationUrl(
    url: string
  ): Promise<{ code?: string; state?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      // Open OAuth window
      this.authWindow = window.open(
        url,
        'LinkedInAuth',
        'width=500,height=600'
      );

      if (!this.authWindow) {
        reject(new Error('Failed to open authentication window'));
        return;
      }

      // Listen for OAuth callback
      const checkInterval = setInterval(() => {
        try {
          if (this.authWindow?.closed) {
            clearInterval(checkInterval);
            reject(new Error('Authentication cancelled'));
            return;
          }

          if (this.authWindow?.location.href.startsWith(this.redirectUri)) {
            clearInterval(checkInterval);

            const url = new URL(this.authWindow.location.href);
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            const error = url.searchParams.get('error');
            const errorDescription = url.searchParams.get('error_description');

            this.authWindow.close();
            this.authWindow = null;

            resolve({
              code: code || undefined,
              state: state || undefined,
              error: error ? `${error} - ${errorDescription}` : undefined,
            });
          }
        } catch {
          // Cross-origin error, ignore
        }
      }, 1000);
    });
  }

  async isSupported(): Promise<boolean> {
    return true;
  }

  async linkAccount(_options: LinkAccountOptions): Promise<AuthResult> {
    throw new AuthError(
      'NOT_SUPPORTED',
      'Account linking is not supported for LinkedIn provider'
    );
  }

  async unlinkAccount(_options: UnlinkAccountOptions): Promise<void> {
    throw new AuthError(
      'NOT_SUPPORTED',
      'Account unlinking is not supported for LinkedIn provider'
    );
  }

  async revokeAccess(token?: string): Promise<void> {
    await super.revokeAccess(token);
  }
}

// Provider manifest for dynamic loading
export const LinkedInProviderManifest = {
  name: 'linkedin',
  displayName: 'LinkedIn',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
  description: 'Sign in with LinkedIn',
  setupInstructions: `
To use LinkedIn authentication:

1. Create a LinkedIn App:
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in required information
   - Verify your app

2. Configure OAuth 2.0:
   - Go to the "Auth" tab
   - Add authorized redirect URLs:
     - https://your-app.com/auth/linkedin/callback
   - Note your Client ID and Client Secret

3. Configure scopes:
   - Under "OAuth 2.0 scopes", select:
     - openid
     - profile
     - email

4. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       linkedin: {
         clientId: 'YOUR_CLIENT_ID',
         redirectUri: 'https://your-app.com/auth/linkedin/callback',
         scopes: ['openid', 'profile', 'email']
       }
     }
   });
   \`\`\`

5. Use the provider:
   \`\`\`javascript
   await auth.signIn('linkedin');
   \`\`\`

Note: LinkedIn OAuth requires a backend service to exchange the authorization code for access tokens.
The redirect URI must be HTTPS in production (LinkedIn requirement).
`,
};
