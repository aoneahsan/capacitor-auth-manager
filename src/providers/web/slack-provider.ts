import {
  AuthProvider,
  AuthResult,
  AuthErrorCode,
  SignInOptions,
  SignOutOptions,
  LinkAccountOptions,
  UnlinkAccountOptions,
} from '../../definitions.js';
import { BaseProviderConfig } from '../base-provider.js';
import {
  OAuthProvider,
  OAuthConfig,
  OAuthTokenResponse,
  OAuthUserInfo,
} from '../oauth-provider.js';
import { AuthError } from '../../utils/auth-error.js';

export interface SlackAuthOptions {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  teamId?: string;
}

/** Subset of Slack's `openid.connect.userInfo` response we consume. */
interface SlackUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export class SlackProvider extends OAuthProvider {
  provider = AuthProvider.SLACK;
  private clientId = '';
  private redirectUri = '';
  private scopes: string[] = [];
  private teamId?: string;
  private authWindow: Window | null = null;

  constructor(config: BaseProviderConfig) {
    super(config);
    const options = config.options as SlackAuthOptions;
    this.clientId = options.clientId || '';
    this.redirectUri = options.redirectUri || '';
    this.scopes = options.scopes || ['openid', 'profile', 'email'];
    this.teamId = options.teamId;
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async signIn(options?: SignInOptions): Promise<AuthResult> {
    return this.performOAuthFlow(options);
  }

  // Uses base OAuthProvider.refreshToken() which handles refresh tokens if available.
  // Note: Slack's OAuth 2.0 for public web apps typically doesn't issue refresh tokens.
  // If no refresh token is available, the base class will throw "No refresh token available".

  protected getOAuthConfig(): OAuthConfig {
    return {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      authorizationEndpoint: 'https://slack.com/oauth/v2/authorize',
      tokenEndpoint: 'https://slack.com/api/oauth.v2.access',
      scopes: this.scopes,
      additionalParams: this.teamId ? { team: this.teamId } : {},
    };
  }

  protected async parseUserFromTokenResponse(
    response: OAuthTokenResponse
  ): Promise<OAuthUserInfo> {
    const accessToken = response.access_token;
    if (!accessToken) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Slack token response did not include an access token; cannot fetch the user profile.',
        this.provider
      );
    }

    // Fetch the real profile via Slack's OpenID Connect userInfo endpoint.
    // https://api.slack.com/methods/openid.connect.userInfo
    let res: Response;
    try {
      res = await fetch('https://slack.com/api/openid.connect.userInfo', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        'Failed to reach Slack userInfo endpoint',
        this.provider,
        error as Record<string, unknown>
      );
    }

    // Slack returns HTTP 200 with `{ ok: false, error }` on API-level failures.
    const data = (await res.json().catch(() => null)) as
      | (SlackUserInfoResponse & { ok?: boolean; error?: string })
      | null;

    if (!res.ok || !data || data.ok === false || !data.sub) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        `Failed to fetch Slack user profile${
          data?.error ? `: ${data.error}` : ''
        }`,
        this.provider
      );
    }

    return {
      id: data.sub,
      sub: data.sub,
      email: data.email,
      email_verified: data.email_verified ?? false,
      name: data.name,
      picture: data.picture,
      isNewUser: false,
    };
  }

  protected async openAuthorizationUrl(
    url: string
  ): Promise<{ code?: string; state?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      // Open OAuth window
      this.authWindow = window.open(url, 'SlackAuth', 'width=500,height=600');

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

            this.authWindow.close();
            this.authWindow = null;

            resolve({
              code: code || undefined,
              state: state || undefined,
              error: error || undefined,
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
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Account linking is not supported for Slack provider'
    );
  }

  async unlinkAccount(_options: UnlinkAccountOptions): Promise<void> {
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Account unlinking is not supported for Slack provider'
    );
  }

  async revokeAccess(token?: string): Promise<void> {
    await super.revokeAccess(token);
  }

  async signOut(_options?: SignOutOptions): Promise<void> {
    await this.clearStoredData();
    await this.setCurrentUser(null);
  }
}

// Provider manifest for dynamic loading
export const SlackProviderManifest = {
  name: 'slack',
  displayName: 'Slack',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
  description: 'Sign in with Slack workspace',
  setupInstructions: `
To use Slack authentication:

1. Create a Slack App:
   - Go to https://api.slack.com/apps
   - Click "Create New App" > "From scratch"
   - Name your app and select workspace

2. Configure OAuth & Permissions:
   - Add redirect URL: https://your-app.com/auth/slack/callback
   - Add required scopes:
     - openid
     - profile
     - email

3. Get your credentials:
   - Go to "Basic Information"
   - Copy Client ID and Client Secret

4. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       slack: {
         clientId: 'YOUR_CLIENT_ID',
         redirectUri: 'https://your-app.com/auth/slack/callback',
         scopes: ['openid', 'profile', 'email'],
         teamId: 'OPTIONAL_TEAM_ID' // Restrict to specific workspace
       }
     }
   });
   \`\`\`

5. Use the provider:
   \`\`\`javascript
   await auth.signIn('slack');
   \`\`\`

Note: Slack OAuth requires a backend service to exchange the authorization code for access tokens.
`,
};
