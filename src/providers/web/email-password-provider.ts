import { BaseAuthProvider } from '../base-provider';
import { AuthResult, AuthUser, SignInOptions, SignUpOptions } from '../../definitions';
import { AuthError } from '../../utils/auth-error';

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
  private config: EmailPasswordConfig;
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: EmailPasswordConfig) {
    super('email-password');
    this.config = {
      allowSignUp: true,
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      ...config
    };
  }

  async signIn(options?: EmailPasswordSignInOptions): Promise<AuthResult> {
    if (!options?.email || !options?.password) {
      throw new AuthError('CREDENTIALS_REQUIRED', 'Email and password are required');
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
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
        }
        throw new AuthError('SIGN_IN_FAILED', error.message || 'Failed to sign in');
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        providerData: [{
          providerId: this.provider,
          uid: data.uid,
          displayName: data.displayName || data.email.split('@')[0],
          email: data.email,
          phoneNumber: null,
          photoURL: data.photoURL || null
        }],
        metadata: {
          creationTime: data.createdAt || new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };

      // Store auth state
      this.currentUser = user;
      this.authToken = data.accessToken;
      this.refreshToken = data.refreshToken;

      return {
        user,
        credential: {
          providerId: this.provider,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        },
        additionalUserInfo: {
          isNewUser: false
        }
      };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'SIGN_IN_ERROR',
        error.message || 'Failed to sign in with email and password'
      );
    }
  }

  async signUp(options?: EmailPasswordSignUpOptions): Promise<AuthResult> {
    if (!this.config.allowSignUp) {
      throw new AuthError('SIGN_UP_DISABLED', 'Sign up is not allowed');
    }

    if (!options?.email || !options?.password) {
      throw new AuthError('CREDENTIALS_REQUIRED', 'Email and password are required');
    }

    // Validate email
    if (!this.isValidEmail(options.email)) {
      throw new AuthError('INVALID_EMAIL', 'Invalid email address');
    }

    // Validate password
    const passwordError = this.validatePassword(options.password);
    if (passwordError) {
      throw new AuthError('WEAK_PASSWORD', passwordError);
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
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new AuthError('EMAIL_EXISTS', 'Email already in use');
        }
        throw new AuthError('SIGN_UP_FAILED', error.message || 'Failed to create account');
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: data.email,
        displayName: options.displayName || data.email.split('@')[0],
        photoURL: options.photoURL || null,
        emailVerified: false,
        providerData: [{
          providerId: this.provider,
          uid: data.uid,
          displayName: data.displayName || data.email.split('@')[0],
          email: data.email,
          phoneNumber: null,
          photoURL: data.photoURL || null
        }],
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };

      // Store auth state
      this.currentUser = user;
      this.authToken = data.accessToken;
      this.refreshToken = data.refreshToken;

      return {
        user,
        credential: {
          providerId: this.provider,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        },
        additionalUserInfo: {
          isNewUser: true
        }
      };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'SIGN_UP_ERROR',
        error.message || 'Failed to create account'
      );
    }
  }

  async signOut(): Promise<void> {
    if (this.authToken) {
      try {
        await fetch(`${this.config.apiUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: this.config.clientId
          })
        });
      } catch {
        // Ignore signout errors
      }
    }

    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async refreshAuthToken(): Promise<AuthResult> {
    if (!this.refreshToken) {
      throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        throw new AuthError('REFRESH_FAILED', 'Failed to refresh token');
      }

      const data = await response.json();

      // Update tokens
      this.authToken = data.accessToken;
      if (data.refreshToken) {
        this.refreshToken = data.refreshToken;
      }

      return {
        user: this.currentUser!,
        credential: {
          providerId: this.provider,
          signInMethod: 'password',
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt
        }
      };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'REFRESH_ERROR',
        error.message || 'Failed to refresh token'
      );
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated');
    }

    // Validate new password
    const passwordError = this.validatePassword(newPassword);
    if (passwordError) {
      throw new AuthError('WEAK_PASSWORD', passwordError);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/update-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError('INVALID_PASSWORD', 'Current password is incorrect');
        }
        throw new AuthError('UPDATE_FAILED', error.message || 'Failed to update password');
      }
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'UPDATE_ERROR',
        error.message || 'Failed to update password'
      );
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      throw new AuthError('INVALID_EMAIL', 'Invalid email address');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError('RESET_FAILED', error.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'RESET_ERROR',
        error.message || 'Failed to send password reset email'
      );
    }
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated');
    }

    if (this.currentUser.emailVerified) {
      throw new AuthError('ALREADY_VERIFIED', 'Email already verified');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new AuthError('VERIFICATION_FAILED', error.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'VERIFICATION_ERROR',
        error.message || 'Failed to send verification email'
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

    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }

    return null;
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
`
};