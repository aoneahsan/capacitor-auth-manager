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

export interface SMSConfig {
  sendCodeUrl: string;
  verifyCodeUrl: string;
  clientId?: string;
  countryCode?: string;
  codeLength?: number;
  resendDelay?: number;
}

interface SMSOptions extends SignInOptions {
  phoneNumber: string;
  code?: string;
}

export class SMSProvider extends BaseAuthProvider {
  get name(): string {
    return 'sms';
  }
  private config: SMSConfig;
  // Pending verifications are persisted (SSR-guarded localStorage) so they survive a reload /
  // page change between sending and verifying the code. Only non-secret metadata is stored —
  // never the SMS code itself (see PendingVerificationStore + F-11).
  private pendingVerifications = new PendingVerificationStore('sms');
  private readonly MAX_ATTEMPTS = 3;

  constructor(input: BaseProviderConfig | SMSConfig) {
    super(resolveProviderConfig(AuthProvider.SMS, input));
    this.config = {
      countryCode: '+1',
      codeLength: 6,
      resendDelay: 60000, // 1 minute
      ...(this.options as SMSConfig),
    };
  }

  async signIn(options?: SMSOptions): Promise<AuthResult> {
    if (!options?.phoneNumber) {
      throw new AuthError(
        AuthErrorCode.PHONE_REQUIRED,
        'Phone number is required for SMS authentication'
      );
    }

    // If code is provided, verify it
    if (options.code) {
      return this.verifyCode(options.phoneNumber, options.code);
    }

    // Otherwise, send code
    return this.sendCode(options.phoneNumber);
  }

  private async sendCode(phoneNumber: string): Promise<AuthResult> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Check if we can resend
      const existing = this.pendingVerifications.get(formattedPhone);
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

      // Send SMS code via backend
      const response = await fetch(this.config.sendCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          clientId: this.config.clientId,
          codeLength: this.config.codeLength,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError(
          AuthErrorCode.SEND_CODE_FAILED,
          error.message || 'Failed to send SMS code'
        );
      }

      const data = await response.json();

      // Store pending verification (persisted; metadata only, never the code).
      this.pendingVerifications.set(formattedPhone, {
        identifier: formattedPhone,
        sessionId: data.sessionId,
        expires: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0,
        lastResent: Date.now(),
      });

      // Return partial auth result for pending state
      // SMS requires two-step process, so we return a temporary user
      const tempUser: AuthUser = {
        uid: `sms-pending:${data.sessionId}`,
        email: null,
        displayName: this.maskPhoneNumber(formattedPhone),
        photoURL: null,
        phoneNumber: formattedPhone,
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
          signInMethod: 'sms',
          accessToken: data.sessionId,
        },
        additionalUserInfo: {
          isNewUser: false,
          providerId: this.name,
          profile: {
            phoneNumber: formattedPhone,
            sessionId: data.sessionId,
            message: `SMS code sent to ${this.maskPhoneNumber(formattedPhone)}`,
            pending: true,
          },
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SEND_CODE_FAILED,
        (error as ErrorLike).message || 'Failed to send SMS code'
      );
    }
  }

  private async verifyCode(
    phoneNumber: string,
    code: string
  ): Promise<AuthResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const pending = this.pendingVerifications.get(formattedPhone);

    if (!pending) {
      throw new AuthError(
        AuthErrorCode.NO_PENDING_VERIFICATION,
        'No pending SMS verification found'
      );
    }

    if (Date.now() > pending.expires) {
      this.pendingVerifications.delete(formattedPhone);
      throw new AuthError(AuthErrorCode.CODE_EXPIRED, 'SMS code has expired');
    }

    if (pending.attempts >= this.MAX_ATTEMPTS) {
      this.pendingVerifications.delete(formattedPhone);
      throw new AuthError(
        AuthErrorCode.TOO_MANY_ATTEMPTS,
        'Too many failed attempts'
      );
    }

    try {
      // Increment attempts and persist the bump (so the count survives a reload mid-flow).
      pending.attempts++;
      this.pendingVerifications.set(formattedPhone, pending);

      // Verify code with backend
      const response = await fetch(this.config.verifyCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          code,
          sessionId: pending.sessionId,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(AuthErrorCode.INVALID_CODE, 'Invalid SMS code');
        }
        throw new AuthError(
          AuthErrorCode.VERIFICATION_FAILED,
          error.message || 'Failed to verify SMS code'
        );
      }

      const data = await response.json();

      // Create user from verified data
      const user: AuthUser = {
        uid: data.uid || this.generateUid(formattedPhone),
        email: data.email || null,
        displayName: data.displayName || formattedPhone,
        photoURL: data.photoURL || null,
        phoneNumber: formattedPhone,
        emailVerified: false,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid || phoneNumber,
            displayName: phoneNumber,
            email: null,
            phoneNumber: phoneNumber,
            photoURL: null,
          },
        ],
        metadata: {
          creationTime: data.createdAt || new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Clean up pending verification
      this.pendingVerifications.delete(formattedPhone);

      return {
        user,
        credential: {
          providerId: this.name,
          signInMethod: 'sms',
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
        (error as ErrorLike).message || 'Failed to verify SMS code'
      );
    }
  }

  async signOut(): Promise<void> {
    // Clear any pending verifications
    this.pendingVerifications.clear();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // SMS auth doesn't persist sessions by default
    return null;
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    // SMS code authentication is single-use and has no refresh flow; the user must request
    // a new verification code rather than refresh a token.
    throw new AuthError(
      AuthErrorCode.OPERATION_NOT_ALLOWED,
      'SMS authentication does not support token refresh; request a new code instead.'
    );
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if not present
    if (!phoneNumber.startsWith('+')) {
      if (cleaned.length === 10) {
        // Assume US number without country code
        cleaned = '1' + cleaned;
      }
      cleaned = this.config.countryCode!.replace('+', '') + cleaned;
    }

    return '+' + cleaned;
  }

  private maskPhoneNumber(phoneNumber: string): string {
    // Show only last 4 digits
    const digits = phoneNumber.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  private generateUid(phoneNumber: string): string {
    return `sms:${phoneNumber.replace(/\D/g, '')}`;
  }

  // Public method to resend code
  async resendCode(phoneNumber: string): Promise<AuthResult> {
    return this.sendCode(phoneNumber);
  }

  // Public method to check if can resend
  canResendCode(phoneNumber: string): {
    canResend: boolean;
    waitTime?: number;
  } {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const pending = this.pendingVerifications.get(formattedPhone);

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

  async initialize(): Promise<void> {
    // SMS provider doesn't require initialization
  }

  async isSupported(): Promise<boolean> {
    // SMS auth is supported if we have the required config
    return !!(this.config.sendCodeUrl && this.config.verifyCodeUrl);
  }

  // linkAccount + unlinkAccount inherit BaseAuthProvider's OPERATION_NOT_ALLOWED defaults (F-44).

  async revokeAccess(_token?: string): Promise<void> {
    // SMS auth doesn't have persistent access to revoke; clear any pending verification.
    this.pendingVerifications.clear();
  }
}

// Provider manifest for dynamic loading
export const SMSProviderManifest = {
  name: 'sms',
  displayName: 'SMS Authentication',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/sms.svg',
  description: 'Phone number authentication via SMS',
  setupInstructions: `
To use SMS authentication:

1. Set up backend endpoints:
   - Send code endpoint: POST request to send SMS
   - Verify code endpoint: POST request to verify SMS code

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       sms: {
         sendCodeUrl: 'https://your-api.com/sms/send',
         verifyCodeUrl: 'https://your-api.com/sms/verify',
         countryCode: '+1', // Default country code
         codeLength: 6,     // SMS code length
         resendDelay: 60000 // Minimum time between resends (ms)
       }
     }
   });
   \`\`\`

3. Send SMS code:
   \`\`\`javascript
   const result = await auth.signIn('sms', { phoneNumber: '+1234567890' });
   // Returns pending state with sessionId
   \`\`\`

4. Verify SMS code:
   \`\`\`javascript
   const result = await auth.signIn('sms', { 
     phoneNumber: '+1234567890',
     code: '123456'
   });
   \`\`\`

Note: This provider requires a backend service to send SMS messages.
You'll need to integrate with an SMS service like Twilio, AWS SNS, etc.
`,
};
