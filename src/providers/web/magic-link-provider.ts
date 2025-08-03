import { BaseAuthProvider } from '../base-provider';
import { AuthResult, AuthUser, SignInOptions } from '../../definitions';
import { AuthError } from '../../utils/auth-error';

export interface MagicLinkConfig {
  sendLinkUrl: string;
  verifyUrl?: string;
  clientId?: string;
  redirectUrl?: string;
  emailTemplate?: {
    subject?: string;
    from?: string;
    html?: string;
    text?: string;
  };
}

interface MagicLinkOptions extends SignInOptions {
  email: string;
}

export class MagicLinkProvider extends BaseAuthProvider {
  private config: MagicLinkConfig;
  private pendingVerification: Map<string, { email: string; expires: number }> = new Map();

  constructor(config: MagicLinkConfig) {
    super('magic-link');
    this.config = config;
    
    // Check for magic link callback on initialization
    this.checkForMagicLinkCallback();
  }

  async signIn(options?: MagicLinkOptions): Promise<AuthResult> {
    if (!options?.email) {
      throw new AuthError('EMAIL_REQUIRED', 'Email is required for magic link authentication');
    }

    try {
      // Send magic link to email
      const token = this.generateToken();
      const magicLink = this.generateMagicLink(token);
      
      // Store pending verification
      this.pendingVerification.set(token, {
        email: options.email,
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      // Send email via backend API
      const response = await fetch(this.config.sendLinkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          magicLink,
          clientId: this.config.clientId,
          template: this.config.emailTemplate
        })
      });

      if (!response.ok) {
        throw new AuthError('SEND_LINK_FAILED', 'Failed to send magic link');
      }

      // Return pending state
      return {
        user: null,
        credential: null,
        additionalUserInfo: {
          pending: true,
          email: options.email,
          message: 'Magic link sent. Check your email to complete sign in.'
        }
      };
    } catch (error: any) {
      throw new AuthError(
        'MAGIC_LINK_ERROR',
        error.message || 'Failed to send magic link'
      );
    }
  }

  async verifyMagicLink(token: string): Promise<AuthResult> {
    const pending = this.pendingVerification.get(token);
    
    if (!pending) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired magic link');
    }

    if (Date.now() > pending.expires) {
      this.pendingVerification.delete(token);
      throw new AuthError('TOKEN_EXPIRED', 'Magic link has expired');
    }

    try {
      // Verify token with backend if configured
      if (this.config.verifyUrl) {
        const response = await fetch(this.config.verifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            email: pending.email,
            clientId: this.config.clientId
          })
        });

        if (!response.ok) {
          throw new AuthError('VERIFICATION_FAILED', 'Failed to verify magic link');
        }

        const data = await response.json();
        
        // Create user from verified data
        const user: AuthUser = {
          uid: data.uid || this.generateUid(pending.email),
          email: pending.email,
          displayName: data.displayName || pending.email.split('@')[0],
          photoURL: data.photoURL || null,
          emailVerified: true,
          providerData: [{
          providerId: this.provider,
          uid: data.uid || email,
          displayName: data.displayName || email.split('@')[0],
          email: email,
          phoneNumber: null,
          photoURL: data.photoURL || null
        }],
          metadata: {
            creationTime: data.createdAt || new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        };

        // Clean up pending verification
        this.pendingVerification.delete(token);

        return {
          user,
          credential: {
            providerId: this.provider,
            signInMethod: 'magic-link',
            accessToken: data.accessToken || token,
            expiresAt: data.expiresAt
          },
          additionalUserInfo: {
            isNewUser: data.isNewUser || false
          }
        };
      } else {
        // Simple verification without backend
        const user: AuthUser = {
          uid: this.generateUid(pending.email),
          email: pending.email,
          displayName: pending.email.split('@')[0],
          photoURL: null,
          emailVerified: true,
          providerData: [{
          providerId: this.provider,
          uid: data.uid || email,
          displayName: data.displayName || email.split('@')[0],
          email: email,
          phoneNumber: null,
          photoURL: data.photoURL || null
        }],
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        };

        // Clean up pending verification
        this.pendingVerification.delete(token);

        return {
          user,
          credential: {
            providerId: this.provider,
            signInMethod: 'magic-link',
            accessToken: token
          },
          additionalUserInfo: {
            isNewUser: true
          }
        };
      }
    } catch (error: any) {
      throw new AuthError(
        'VERIFICATION_ERROR',
        error.message || 'Failed to verify magic link'
      );
    }
  }

  async signOut(): Promise<void> {
    // Clear any pending verifications
    this.pendingVerification.clear();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Magic link doesn't persist sessions by default
    return null;
  }

  async refreshToken(): Promise<AuthResult> {
    throw new AuthError(
      'NOT_SUPPORTED',
      'Token refresh is not supported for magic link authentication'
    );
  }

  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateMagicLink(token: string): string {
    const redirectUrl = this.config.redirectUrl || window.location.origin;
    const url = new URL(redirectUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('provider', 'magic-link');
    return url.toString();
  }

  private generateUid(email: string): string {
    return `magic-link:${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  private checkForMagicLinkCallback(): void {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');

    if (token && provider === 'magic-link') {
      // Store token for later verification
      sessionStorage.setItem('magic-link-token', token);
      
      // Clean up URL
      urlParams.delete('token');
      urlParams.delete('provider');
      const newUrl = window.location.pathname + 
        (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, document.title, newUrl);
    }
  }

  async checkStoredToken(): Promise<AuthResult | null> {
    if (typeof window === 'undefined') return null;

    const token = sessionStorage.getItem('magic-link-token');
    if (!token) return null;

    try {
      const result = await this.verifyMagicLink(token);
      sessionStorage.removeItem('magic-link-token');
      return result;
    } catch (error) {
      sessionStorage.removeItem('magic-link-token');
      throw error;
    }
  }
}

// Provider manifest for dynamic loading
export const MagicLinkProviderManifest = {
  name: 'magic-link',
  displayName: 'Email Magic Link',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mail.svg',
  description: 'Passwordless authentication via email',
  setupInstructions: `
To use Email Magic Link authentication:

1. Set up a backend endpoint to send emails:
   - Endpoint should accept POST requests with email and magic link
   - Send email with the magic link to the user

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       'magic-link': {
         sendLinkUrl: 'https://your-api.com/send-magic-link',
         verifyUrl: 'https://your-api.com/verify-magic-link', // Optional
         redirectUrl: window.location.origin + '/auth-callback',
         emailTemplate: {
           subject: 'Sign in to {{app}}',
           from: 'noreply@your-app.com'
         }
       }
     }
   });
   \`\`\`

3. Use the provider:
   \`\`\`javascript
   await auth.signIn('magic-link', { email: 'user@example.com' });
   \`\`\`

Note: This provider requires a backend service to send emails.
`
};