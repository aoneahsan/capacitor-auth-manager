import {
  AuthResult,
  AuthUser,
  AuthErrorCode,
  SignInOptions,
  RefreshTokenOptions,
  AuthProvider,
} from '../../definitions.js';
import { AuthError } from '../../utils/auth-error.js';
import { getErrorMessage } from '../../utils/error-message.js';
import {
  BaseAuthProvider,
  BaseProviderConfig,
  resolveProviderConfig,
} from '../base-provider.js';

export interface PhonePasswordConfig {
  signInUrl: string;
  signUpUrl: string;
  verifyPhoneUrl?: string;
  sendVerificationUrl?: string;
  refreshTokenUrl?: string;
  resetPasswordUrl?: string;
  clientId?: string;
  countryCode?: string;
  requirePhoneVerification?: boolean;
  passwordStrength?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
}

interface PhonePasswordCredentials {
  phoneNumber: string;
  password: string;
  code?: string; // For phone verification
}

interface PhonePasswordOptions extends SignInOptions {
  credentials?: PhonePasswordCredentials;
  isSignUp?: boolean;
}

interface PendingVerification {
  phoneNumber: string;
  sessionId: string;
  expires: number;
}

interface PhonePasswordAuthPayload {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  isNewUser?: boolean;
  createdAt?: string;
}

export class PhonePasswordProvider extends BaseAuthProvider {
  get name(): string {
    return 'phone-password';
  }
  private config: PhonePasswordConfig;
  private pendingVerifications: Map<string, PendingVerification> = new Map();
  // currentUser is the inherited (in-memory) field from BaseAuthProvider; assigned directly here
  // so phone/password sessions stay in-memory exactly as before (no new storage persistence).
  private storedAccessToken: string | null = null;
  private storedRefreshToken: string | null = null;

  constructor(input: BaseProviderConfig | PhonePasswordConfig) {
    super(resolveProviderConfig(AuthProvider.PHONE_PASSWORD, input));
    this.config = {
      countryCode: '+1',
      requirePhoneVerification: false,
      passwordStrength: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      ...(this.options as PhonePasswordConfig),
    };
  }

  async signIn(options?: PhonePasswordOptions): Promise<AuthResult> {
    const credentials = options?.credentials;

    if (!credentials?.phoneNumber || !credentials?.password) {
      throw new AuthError(
        AuthErrorCode.CREDENTIALS_REQUIRED,
        'Phone number and password are required'
      );
    }

    const formattedPhone = this.formatPhoneNumber(credentials.phoneNumber);

    // Handle sign up flow
    if (options?.isSignUp) {
      return this.signUp(formattedPhone, credentials.password);
    }

    // Handle phone verification if code is provided
    if (credentials.code && this.config.requirePhoneVerification) {
      return this.verifyPhone(formattedPhone, credentials.code, credentials.password);
    }

    // Standard sign in
    return this.performSignIn(formattedPhone, credentials.password);
  }

  private async performSignIn(
    phoneNumber: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const response = await fetch(this.config.signInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          password,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid phone number or password'
          );
        }
        if (response.status === 403) {
          throw new AuthError(
            AuthErrorCode.PHONE_NOT_VERIFIED,
            'Please verify your phone number first'
          );
        }
        throw new AuthError(
          AuthErrorCode.SIGN_IN_FAILED,
          error.message || 'Sign in failed'
        );
      }

      const data = await response.json();
      return this.buildAuthResult(data, phoneNumber);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SIGN_IN_FAILED,
        getErrorMessage(error) || 'Sign in failed'
      );
    }
  }

  private async signUp(
    phoneNumber: string,
    password: string
  ): Promise<AuthResult> {
    // Validate password strength
    this.validatePassword(password);

    try {
      const response = await fetch(this.config.signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          password,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new AuthError(
            AuthErrorCode.PHONE_NUMBER_ALREADY_EXISTS,
            'An account with this phone number already exists'
          );
        }
        throw new AuthError(
          AuthErrorCode.SIGN_UP_FAILED,
          error.message || 'Sign up failed'
        );
      }

      const data = await response.json();

      // If phone verification is required, send verification code
      if (this.config.requirePhoneVerification && this.config.sendVerificationUrl) {
        await this.sendVerificationCode(phoneNumber);

        return {
          user: {
            uid: `phone-pending:${data.sessionId || phoneNumber}`,
            email: null,
            displayName: this.maskPhoneNumber(phoneNumber),
            photoURL: null,
            phoneNumber,
            emailVerified: false,
            providerData: [],
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString(),
            },
          },
          credential: {
            providerId: this.name,
            signInMethod: 'phone-password',
            accessToken: data.sessionId,
          },
          additionalUserInfo: {
            isNewUser: true,
            providerId: this.name,
            profile: {
              phoneNumber,
              message: 'Phone verification required. Check your SMS.',
              pending: true,
            },
          },
        };
      }

      return this.buildAuthResult(data, phoneNumber, true);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SIGN_UP_FAILED,
        getErrorMessage(error) || 'Sign up failed'
      );
    }
  }

  private async sendVerificationCode(phoneNumber: string): Promise<void> {
    if (!this.config.sendVerificationUrl) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'Phone verification URL not configured'
      );
    }

    const response = await fetch(this.config.sendVerificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        clientId: this.config.clientId,
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

    this.pendingVerifications.set(phoneNumber, {
      phoneNumber,
      sessionId: data.sessionId,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
  }

  private async verifyPhone(
    phoneNumber: string,
    code: string,
    password: string
  ): Promise<AuthResult> {
    if (!this.config.verifyPhoneUrl) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'Phone verification URL not configured'
      );
    }

    const pending = this.pendingVerifications.get(phoneNumber);
    if (!pending) {
      throw new AuthError(
        AuthErrorCode.NO_PENDING_VERIFICATION,
        'No pending phone verification found'
      );
    }

    if (Date.now() > pending.expires) {
      this.pendingVerifications.delete(phoneNumber);
      throw new AuthError(
        AuthErrorCode.CODE_EXPIRED,
        'Verification code has expired'
      );
    }

    try {
      const response = await fetch(this.config.verifyPhoneUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code,
          password,
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
          error.message || 'Phone verification failed'
        );
      }

      const data = await response.json();
      this.pendingVerifications.delete(phoneNumber);

      return this.buildAuthResult(data, phoneNumber);
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.VERIFICATION_FAILED,
        getErrorMessage(error) || 'Phone verification failed'
      );
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.storedAccessToken = null;
    this.storedRefreshToken = null;
    this.pendingVerifications.clear();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    if (!this.storedRefreshToken || !this.config.refreshTokenUrl) {
      throw new AuthError(
        AuthErrorCode.NO_REFRESH_TOKEN,
        'No refresh token available or refresh URL not configured'
      );
    }

    try {
      const response = await fetch(this.config.refreshTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.storedRefreshToken,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        throw new AuthError(
          AuthErrorCode.TOKEN_REFRESH_FAILED,
          'Token refresh failed'
        );
      }

      const data = await response.json();

      this.storedAccessToken = data.accessToken;
      if (data.refreshToken) {
        this.storedRefreshToken = data.refreshToken;
      }

      if (!this.currentUser) {
        throw new AuthError(AuthErrorCode.NO_AUTH_SESSION, 'No current user');
      }

      return {
        user: this.currentUser,
        credential: {
          providerId: this.name,
          signInMethod: 'phone-password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || this.storedRefreshToken,
          expiresAt: data.expiresAt,
        },
        additionalUserInfo: {
          isNewUser: false,
          providerId: this.name,
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        getErrorMessage(error) || 'Token refresh failed'
      );
    }
  }

  async initialize(): Promise<void> {
    // Phone password provider doesn't require initialization
  }

  async isSupported(): Promise<boolean> {
    return !!(this.config.signInUrl && this.config.signUpUrl);
  }

  // linkAccount + unlinkAccount inherit BaseAuthProvider's OPERATION_NOT_ALLOWED defaults (F-44).

  async revokeAccess(_token?: string): Promise<void> {
    await this.signOut();
  }

  getAccessToken(): string | null {
    return this.storedAccessToken;
  }

  async sendPasswordReset(phoneNumber: string): Promise<void> {
    if (!this.config.resetPasswordUrl) {
      throw new AuthError(
        AuthErrorCode.MISSING_CONFIGURATION,
        'Password reset URL not configured'
      );
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const response = await fetch(this.config.resetPasswordUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        clientId: this.config.clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AuthError(
        AuthErrorCode.SERVER_ERROR,
        error.message || 'Failed to send password reset'
      );
    }
  }

  // Renamed from createAuthResult to avoid colliding with BaseAuthProvider.createAuthResult,
  // which has a different signature (this builds a phone-specific result from a backend payload).
  private buildAuthResult(
    data: PhonePasswordAuthPayload,
    phoneNumber: string,
    isNewUser = false
  ): AuthResult {
    const user: AuthUser = {
      uid: data.uid || this.generateUid(phoneNumber),
      email: data.email || null,
      displayName: data.displayName || phoneNumber,
      photoURL: data.photoURL || null,
      phoneNumber,
      emailVerified: false,
      providerData: [
        {
          providerId: this.name,
          uid: data.uid || phoneNumber,
          displayName: data.displayName || phoneNumber,
          email: data.email || null,
          phoneNumber,
          photoURL: data.photoURL || null,
        },
      ],
      metadata: {
        creationTime: data.createdAt || new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };

    this.currentUser = user;
    this.storedAccessToken = data.accessToken ?? null;
    this.storedRefreshToken = data.refreshToken ?? null;

    return {
      user,
      credential: {
        providerId: this.name,
        signInMethod: 'phone-password',
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
      additionalUserInfo: {
        isNewUser: data.isNewUser || isNewUser,
        providerId: this.name,
      },
    };
  }

  private validatePassword(password: string): void {
    const { passwordStrength } = this.config;
    if (!passwordStrength) return;

    const errors: string[] = [];

    if (passwordStrength.minLength && password.length < passwordStrength.minLength) {
      errors.push(`at least ${passwordStrength.minLength} characters`);
    }

    if (passwordStrength.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('an uppercase letter');
    }

    if (passwordStrength.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('a lowercase letter');
    }

    if (passwordStrength.requireNumbers && !/\d/.test(password)) {
      errors.push('a number');
    }

    if (passwordStrength.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('a special character');
    }

    if (errors.length > 0) {
      throw new AuthError(
        AuthErrorCode.WEAK_PASSWORD,
        `Password must contain ${errors.join(', ')}`
      );
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (!phoneNumber.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned;
      }
      cleaned = this.config.countryCode!.replace('+', '') + cleaned;
    }

    return '+' + cleaned;
  }

  private maskPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  private generateUid(phoneNumber: string): string {
    return `phone-password:${phoneNumber.replace(/\D/g, '')}`;
  }
}

// Provider manifest for dynamic loading
export const PhonePasswordProviderManifest = {
  name: 'phone-password',
  displayName: 'Phone & Password',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/phone.svg',
  description: 'Phone number and password authentication',
  setupInstructions: `
To use Phone/Password authentication:

1. Set up backend endpoints:
   - Sign in endpoint: POST /auth/phone/signin
   - Sign up endpoint: POST /auth/phone/signup
   - Verify phone endpoint: POST /auth/phone/verify (optional)
   - Refresh token endpoint: POST /auth/token/refresh (optional)
   - Reset password endpoint: POST /auth/phone/reset (optional)

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       phone_password: {
         signInUrl: 'https://your-api.com/auth/phone/signin',
         signUpUrl: 'https://your-api.com/auth/phone/signup',
         verifyPhoneUrl: 'https://your-api.com/auth/phone/verify',
         sendVerificationUrl: 'https://your-api.com/auth/phone/send-code',
         refreshTokenUrl: 'https://your-api.com/auth/token/refresh',
         countryCode: '+1',
         requirePhoneVerification: true,
         passwordStrength: {
           minLength: 8,
           requireUppercase: true,
           requireLowercase: true,
           requireNumbers: true
         }
       }
     }
   });
   \`\`\`

3. Sign in:
   \`\`\`javascript
   const result = await auth.signIn('phone_password', {
     credentials: {
       phoneNumber: '+1234567890',
       password: 'securePassword123'
     }
   });
   \`\`\`

4. Sign up:
   \`\`\`javascript
   const result = await auth.signIn('phone_password', {
     credentials: {
       phoneNumber: '+1234567890',
       password: 'securePassword123'
     },
     isSignUp: true
   });
   \`\`\`
`,
};
