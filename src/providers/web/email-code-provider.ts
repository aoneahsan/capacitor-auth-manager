import {
  AuthResult,
  AuthUser,
  AuthErrorCode,
  SignInOptions,
  RefreshTokenOptions,
  AuthProvider,
} from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import {
  BaseAuthProvider,
  BaseProviderConfig,
  resolveProviderConfig,
} from '../base-provider';
import { PendingVerificationStore } from '../../utils/pending-verification-store';

/** A thrown value that may carry a `message` (used to surface backend/network error text). */
interface ErrorLike {
  message?: string;
}

export interface EmailCodeConfig {
  sendCodeUrl: string;
  verifyCodeUrl: string;
  clientId?: string;
  codeLength?: number;
  resendDelay?: number;
  codeExpiration?: number;
}

interface EmailCodeOptions extends SignInOptions {
  email: string;
  code?: string;
}

export class EmailCodeProvider extends BaseAuthProvider {
  get name(): string {
    return 'email-code';
  }
  private config: EmailCodeConfig;
  // Pending verifications are persisted (SSR-guarded localStorage) so they survive a reload /
  // page change between sending and verifying the code. Only non-secret metadata is stored —
  // never the verification code itself (see PendingVerificationStore + F-11).
  private pendingVerifications = new PendingVerificationStore('email-code');
  private readonly MAX_ATTEMPTS = 3;

  constructor(input: BaseProviderConfig | EmailCodeConfig) {
    super(resolveProviderConfig(AuthProvider.EMAIL_CODE, input));
    this.config = {
      codeLength: 6,
      resendDelay: 60000, // 1 minute
      codeExpiration: 10 * 60 * 1000, // 10 minutes
      ...(this.options as EmailCodeConfig),
    };
  }

  async signIn(options?: EmailCodeOptions): Promise<AuthResult> {
    if (!options?.email) {
      throw new AuthError(
        AuthErrorCode.EMAIL_REQUIRED,
        'Email is required for email code authentication'
      );
    }

    // Validate email format
    if (!this.isValidEmail(options.email)) {
      throw new AuthError(
        AuthErrorCode.INVALID_EMAIL,
        'Please enter a valid email address'
      );
    }

    // If code is provided, verify it
    if (options.code) {
      return this.verifyCode(options.email, options.code);
    }

    // Otherwise, send code
    return this.sendCode(options.email);
  }

  private async sendCode(email: string): Promise<AuthResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if we can resend
      const existing = this.pendingVerifications.get(normalizedEmail);
      if (existing && existing.lastResent) {
        const timeSinceLastResend = Date.now() - existing.lastResent;
        if (timeSinceLastResend < this.config.resendDelay!) {
          const waitTime = Math.ceil(
            (this.config.resendDelay! - timeSinceLastResend) / 1000
          );
          throw new AuthError(
            AuthErrorCode.RESEND_DELAY,
            `Please wait ${waitTime} seconds before requesting a new code`
          );
        }
      }

      // Send email code via backend
      const response = await fetch(this.config.sendCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          clientId: this.config.clientId,
          codeLength: this.config.codeLength,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError(
          AuthErrorCode.SEND_CODE_FAILED,
          error.message || 'Failed to send verification code'
        );
      }

      const data = await response.json();

      // Store pending verification (persisted; metadata only, never the code).
      this.pendingVerifications.set(normalizedEmail, {
        identifier: normalizedEmail,
        sessionId: data.sessionId,
        expires: Date.now() + this.config.codeExpiration!,
        attempts: 0,
        lastResent: Date.now(),
      });

      // Return partial auth result for pending state
      const tempUser: AuthUser = {
        uid: `email-code-pending:${data.sessionId}`,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0],
        photoURL: null,
        phoneNumber: null,
        emailVerified: false,
        providerData: [],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      return {
        user: tempUser,
        credential: {
          providerId: this.name,
          signInMethod: 'email-code',
          accessToken: data.sessionId,
        },
        additionalUserInfo: {
          isNewUser: false,
          providerId: this.name,
          profile: {
            email: normalizedEmail,
            sessionId: data.sessionId,
            message: `Verification code sent to ${this.maskEmail(normalizedEmail)}`,
            pending: true,
          },
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SEND_CODE_FAILED,
        (error as ErrorLike).message || 'Failed to send verification code'
      );
    }
  }

  private async verifyCode(email: string, code: string): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const pending = this.pendingVerifications.get(normalizedEmail);

    if (!pending) {
      throw new AuthError(
        AuthErrorCode.NO_PENDING_VERIFICATION,
        'No pending email verification found. Please request a new code.'
      );
    }

    if (Date.now() > pending.expires) {
      this.pendingVerifications.delete(normalizedEmail);
      throw new AuthError(
        AuthErrorCode.CODE_EXPIRED,
        'Verification code has expired'
      );
    }

    if (pending.attempts >= this.MAX_ATTEMPTS) {
      this.pendingVerifications.delete(normalizedEmail);
      throw new AuthError(
        AuthErrorCode.TOO_MANY_ATTEMPTS,
        'Too many failed attempts. Please request a new code.'
      );
    }

    try {
      // Increment attempts and persist the bump (so the count survives a reload mid-flow).
      pending.attempts++;
      this.pendingVerifications.set(normalizedEmail, pending);

      // Verify code with backend
      const response = await fetch(this.config.verifyCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
          sessionId: pending.sessionId,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(
            AuthErrorCode.INVALID_CODE,
            'Invalid verification code'
          );
        }
        throw new AuthError(
          AuthErrorCode.VERIFICATION_FAILED,
          error.message || 'Failed to verify code'
        );
      }

      const data = await response.json();

      // Create user from verified data
      const user: AuthUser = {
        uid: data.uid || this.generateUid(normalizedEmail),
        email: normalizedEmail,
        displayName: data.displayName || normalizedEmail.split('@')[0],
        photoURL: data.photoURL || null,
        phoneNumber: data.phoneNumber || null,
        emailVerified: true,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid || normalizedEmail,
            displayName: data.displayName || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            phoneNumber: null,
            photoURL: data.photoURL || null,
          },
        ],
        metadata: {
          creationTime: data.createdAt || new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Clean up pending verification
      this.pendingVerifications.delete(normalizedEmail);

      return {
        user,
        credential: {
          providerId: this.name,
          signInMethod: 'email-code',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
        additionalUserInfo: {
          isNewUser: data.isNewUser || false,
          providerId: this.name,
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.VERIFICATION_FAILED,
        (error as ErrorLike).message || 'Failed to verify code'
      );
    }
  }

  async signOut(): Promise<void> {
    this.pendingVerifications.clear();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    // Email code authentication is single-use and has no refresh flow; the user must request
    // a new verification code rather than refresh a token.
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'Email code authentication does not support token refresh; request a new code instead.'
    );
  }

  async initialize(): Promise<void> {
    // Email code provider doesn't require initialization
  }

  async isSupported(): Promise<boolean> {
    return !!(this.config.sendCodeUrl && this.config.verifyCodeUrl);
  }

  // linkAccount + unlinkAccount inherit BaseAuthProvider's OPERATION_NOT_ALLOWED defaults (F-44).

  async revokeAccess(_token?: string): Promise<void> {
    this.pendingVerifications.clear();
  }

  // Public method to resend code
  async resendCode(email: string): Promise<AuthResult> {
    return this.sendCode(email);
  }

  // Public method to check if can resend
  canResendCode(email: string): { canResend: boolean; waitTime?: number } {
    const normalizedEmail = email.toLowerCase().trim();
    const pending = this.pendingVerifications.get(normalizedEmail);

    if (!pending || !pending.lastResent) {
      return { canResend: true };
    }

    const timeSinceLastResend = Date.now() - pending.lastResent;
    if (timeSinceLastResend < this.config.resendDelay!) {
      return {
        canResend: false,
        waitTime: Math.ceil(
          (this.config.resendDelay! - timeSinceLastResend) / 1000
        ),
      };
    }

    return { canResend: true };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  private generateUid(email: string): string {
    return `email-code:${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }
}

// Provider manifest for dynamic loading
export const EmailCodeProviderManifest = {
  name: 'email-code',
  displayName: 'Email Verification Code',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mail.svg',
  description: 'Passwordless authentication via email verification code',
  setupInstructions: `
To use Email Code authentication:

1. Set up backend endpoints:
   - Send code endpoint: POST request to send verification email
   - Verify code endpoint: POST request to verify the code

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       email_code: {
         sendCodeUrl: 'https://your-api.com/email/send-code',
         verifyCodeUrl: 'https://your-api.com/email/verify-code',
         codeLength: 6,     // Code length
         resendDelay: 60000 // Minimum time between resends (ms)
       }
     }
   });
   \`\`\`

3. Send verification code:
   \`\`\`javascript
   const result = await auth.signIn('email_code', { email: 'user@example.com' });
   // Returns pending state with sessionId
   \`\`\`

4. Verify code:
   \`\`\`javascript
   const result = await auth.signIn('email_code', {
     email: 'user@example.com',
     code: '123456'
   });
   \`\`\`

Note: This provider requires a backend service to send emails.
`,
};
