import {
  AuthResult,
  AuthUser,
  AuthErrorCode,
  SignInOptions,
  SignUpOptions,
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

export interface EmailPasswordConfig {
  apiUrl: string;
  clientId?: string;
  passwordRequirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
  allowSignUp?: boolean;
}

interface EmailPasswordSignInOptions extends SignInOptions {
  email: string;
  password: string;
}

interface EmailPasswordSignUpOptions extends SignUpOptions {
  email: string;
  password: string;
  displayName?: string;
  photoURL?: string;
}

export class EmailPasswordProvider extends BaseAuthProvider {
  get name(): string {
    return 'email-password';
  }
  private config: EmailPasswordConfig;
  // currentUser is the inherited (in-memory) field from BaseAuthProvider; assigned directly here
  // so email/password sessions stay in-memory exactly as before (no new storage persistence).
  private authToken: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor(input: BaseProviderConfig | EmailPasswordConfig) {
    super(resolveProviderConfig(AuthProvider.EMAIL_PASSWORD, input));
    this.config = {
      allowSignUp: true,
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      ...(this.options as EmailPasswordConfig),
    };
  }

  async signIn(options?: EmailPasswordSignInOptions): Promise<AuthResult> {
    if (!options?.email || !options?.password) {
      throw new AuthError(
        AuthErrorCode.CREDENTIALS_REQUIRED,
        'Email and password are required'
      );
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(
            AuthErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password'
          );
        }
        throw new AuthError(
          AuthErrorCode.SIGN_IN_FAILED,
          error.message || 'Failed to sign in'
        );
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid,
            displayName: data.displayName || data.email.split('@')[0],
            email: data.email,
            phoneNumber: null,
            photoURL: data.photoURL || null,
          },
        ],
        metadata: {
          creationTime: data.createdAt || new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Store auth state
      this.currentUser = user;
      this.authToken = data.accessToken;
      this.refreshTokenValue = data.refreshToken;

      return {
        user,
        credential: {
          providerId: this.name,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
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
        AuthErrorCode.SIGN_IN_FAILED,
        getErrorMessage(error) || 'Failed to sign in with email and password'
      );
    }
  }

  async signUp(options?: EmailPasswordSignUpOptions): Promise<AuthResult> {
    if (!this.config.allowSignUp) {
      throw new AuthError(
        AuthErrorCode.SIGN_UP_DISABLED,
        'Sign up is not allowed'
      );
    }

    if (!options?.email || !options?.password) {
      throw new AuthError(
        AuthErrorCode.CREDENTIALS_REQUIRED,
        'Email and password are required'
      );
    }

    // Validate email
    if (!this.isValidEmail(options.email)) {
      throw new AuthError(AuthErrorCode.INVALID_EMAIL, 'Invalid email address');
    }

    // Validate password
    const passwordError = this.validatePassword(options.password);
    if (passwordError) {
      throw new AuthError(AuthErrorCode.WEAK_PASSWORD, passwordError);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: options.email,
          password: options.password,
          displayName: options.displayName,
          photoURL: options.photoURL,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new AuthError(
            AuthErrorCode.EMAIL_ALREADY_IN_USE,
            'Email already in use'
          );
        }
        throw new AuthError(
          AuthErrorCode.SIGN_UP_FAILED,
          error.message || 'Failed to create account'
        );
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: data.email,
        displayName: options.displayName || data.email.split('@')[0],
        photoURL: options.photoURL || null,
        emailVerified: false,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid,
            displayName: data.displayName || data.email.split('@')[0],
            email: data.email,
            phoneNumber: null,
            photoURL: data.photoURL || null,
          },
        ],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Store auth state
      this.currentUser = user;
      this.authToken = data.accessToken;
      this.refreshTokenValue = data.refreshToken;

      return {
        user,
        credential: {
          providerId: this.name,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
        additionalUserInfo: {
          isNewUser: true,
          providerId: this.name,
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SIGN_UP_FAILED,
        getErrorMessage(error) || 'Failed to create account'
      );
    }
  }

  async signOut(): Promise<void> {
    if (this.authToken) {
      try {
        await fetch(`${this.config.apiUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: this.config.clientId,
          }),
        });
      } catch {
        // Ignore signout errors
      }
    }

    this.currentUser = null;
    this.authToken = null;
    this.refreshTokenValue = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async refreshToken(_options?: RefreshTokenOptions): Promise<AuthResult> {
    if (!this.refreshTokenValue) {
      throw new AuthError(
        AuthErrorCode.NO_REFRESH_TOKEN,
        'No refresh token available'
      );
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshTokenValue,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        throw new AuthError(
          AuthErrorCode.TOKEN_REFRESH_FAILED,
          'Failed to refresh token'
        );
      }

      const data = await response.json();

      // Update tokens
      this.authToken = data.accessToken;
      if (data.refreshToken) {
        this.refreshTokenValue = data.refreshToken;
      }

      return {
        user: this.currentUser!,
        credential: {
          providerId: this.name,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.TOKEN_REFRESH_FAILED,
        getErrorMessage(error) || 'Failed to refresh token'
      );
    }
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new AuthError(
        AuthErrorCode.NOT_AUTHENTICATED,
        'User not authenticated'
      );
    }

    // Validate new password
    const passwordError = this.validatePassword(newPassword);
    if (passwordError) {
      throw new AuthError(AuthErrorCode.WEAK_PASSWORD, passwordError);
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/auth/update-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            clientId: this.config.clientId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(
            AuthErrorCode.WRONG_PASSWORD,
            'Current password is incorrect'
          );
        }
        throw new AuthError(
          AuthErrorCode.SERVER_ERROR,
          error.message || 'Failed to update password'
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SERVER_ERROR,
        getErrorMessage(error) || 'Failed to update password'
      );
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      throw new AuthError(AuthErrorCode.INVALID_EMAIL, 'Invalid email address');
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            clientId: this.config.clientId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError(
          AuthErrorCode.SERVER_ERROR,
          error.message || 'Failed to send reset email'
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.SERVER_ERROR,
        getErrorMessage(error) || 'Failed to send password reset email'
      );
    }
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new AuthError(
        AuthErrorCode.NOT_AUTHENTICATED,
        'User not authenticated'
      );
    }

    if (this.currentUser.emailVerified) {
      throw new AuthError(
        AuthErrorCode.EMAIL_ALREADY_VERIFIED,
        'Email already verified'
      );
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError(
          AuthErrorCode.VERIFICATION_FAILED,
          error.message || 'Failed to send verification email'
        );
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        AuthErrorCode.VERIFICATION_FAILED,
        getErrorMessage(error) || 'Failed to send verification email'
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): string | null {
    const requirements = this.config.passwordRequirements!;

    if (password.length < requirements.minLength!) {
      return `Password must be at least ${requirements.minLength} characters long`;
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (
      requirements.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  async initialize(): Promise<void> {
    // Email/Password provider doesn't require initialization
  }

  async isSupported(): Promise<boolean> {
    // Email/Password auth is supported if we have the required config
    return !!this.config.apiUrl;
  }

  // linkAccount + unlinkAccount inherit BaseAuthProvider's OPERATION_NOT_ALLOWED defaults (F-44).

  async revokeAccess(_token?: string): Promise<void> {
    // For email/password auth, revoking access means signing out
    await this.signOut();
  }
}

// Provider manifest for dynamic loading
export const EmailPasswordProviderManifest = {
  name: 'email-password',
  displayName: 'Email & Password',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/email.svg',
  description: 'Traditional email and password authentication',
  setupInstructions: `
To use Email/Password authentication:

1. Set up backend API endpoints:
   - /auth/signin - Sign in with email/password
   - /auth/signup - Create new account
   - /auth/signout - Sign out user
   - /auth/refresh - Refresh access token
   - /auth/update-password - Update password
   - /auth/reset-password - Send password reset email
   - /auth/verify-email - Send email verification

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       'email-password': {
         apiUrl: 'https://your-api.com',
         passwordRequirements: {
           minLength: 8,
           requireUppercase: true,
           requireLowercase: true,
           requireNumbers: true,
           requireSpecialChars: false
         },
         allowSignUp: true
       }
     }
   });
   \`\`\`

3. Sign in:
   \`\`\`javascript
   await auth.signIn('email-password', {
     email: 'user@example.com',
     password: 'password123'
   });
   \`\`\`

4. Sign up:
   \`\`\`javascript
   await auth.signUp({
     email: 'user@example.com',
     password: 'password123',
     displayName: 'John Doe'
   });
   \`\`\`

Note: This provider requires a backend service to handle authentication.
`,
};
