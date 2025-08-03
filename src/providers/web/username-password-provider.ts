import {
  AuthResult,
  AuthUser,
  SignInOptions,
  SignUpOptions,
  RefreshTokenOptions,
} from '../../definitions';
import { AuthError } from '../../utils/auth-error';
import { AuthProviderInterface } from '../../core/types';

export interface UsernamePasswordConfig {
  apiUrl: string;
  clientId?: string;
  usernameRequirements?: {
    minLength?: number;
    maxLength?: number;
    allowedCharacters?: RegExp;
    reservedUsernames?: string[];
  };
  passwordRequirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
  allowSignUp?: boolean;
}

interface UsernamePasswordSignInOptions extends SignInOptions {
  username: string;
  password: string;
}

interface UsernamePasswordSignUpOptions extends SignUpOptions {
  username: string;
  password: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export class UsernamePasswordProvider implements AuthProviderInterface {
  name = 'username-password';
  private config: UsernamePasswordConfig;
  private currentUser: AuthUser | null = null;
  private authToken: string | null = null;
  private refreshTokenValue: string | null = null;

  constructor(config: UsernamePasswordConfig) {
    this.config = {
      allowSignUp: true,
      usernameRequirements: {
        minLength: 3,
        maxLength: 20,
        allowedCharacters: /^[a-zA-Z0-9_-]+$/,
        reservedUsernames: ['admin', 'root', 'system', 'user'],
        ...config.usernameRequirements,
      },
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        ...config.passwordRequirements,
      },
      ...config,
    };
  }

  async signIn(options?: UsernamePasswordSignInOptions): Promise<AuthResult> {
    if (!options?.username || !options?.password) {
      throw new AuthError(
        'CREDENTIALS_REQUIRED',
        'Username and password are required'
      );
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: options.username,
          password: options.password,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new AuthError(
            'INVALID_CREDENTIALS',
            'Invalid username or password'
          );
        }
        throw new AuthError(
          'SIGN_IN_FAILED',
          error.message || 'Failed to sign in'
        );
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: data.email || null,
        displayName: data.displayName || options.username,
        photoURL: data.photoURL || null,
        emailVerified: data.emailVerified || false,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid,
            displayName: data.displayName || options.username,
            email: data.email || null,
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
          username: options.username,
        },
      };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'SIGN_IN_ERROR',
        error.message || 'Failed to sign in with username and password'
      );
    }
  }

  async signUp(options?: UsernamePasswordSignUpOptions): Promise<AuthResult> {
    if (!this.config.allowSignUp) {
      throw new AuthError('SIGN_UP_DISABLED', 'Sign up is not allowed');
    }

    if (!options?.username || !options?.password) {
      throw new AuthError(
        'CREDENTIALS_REQUIRED',
        'Username and password are required'
      );
    }

    // Validate username
    const usernameError = this.validateUsername(options.username);
    if (usernameError) {
      throw new AuthError('INVALID_USERNAME', usernameError);
    }

    // Validate password
    const passwordError = this.validatePassword(options.password);
    if (passwordError) {
      throw new AuthError('WEAK_PASSWORD', passwordError);
    }

    // Validate email if provided
    if (options.email && !this.isValidEmail(options.email)) {
      throw new AuthError('INVALID_EMAIL', 'Invalid email address');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: options.username,
          password: options.password,
          email: options.email,
          displayName: options.displayName,
          photoURL: options.photoURL,
          clientId: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new AuthError('USERNAME_EXISTS', 'Username already taken');
        }
        throw new AuthError(
          'SIGN_UP_FAILED',
          error.message || 'Failed to create account'
        );
      }

      const data = await response.json();

      // Create user object
      const user: AuthUser = {
        uid: data.uid,
        email: options.email || null,
        displayName: options.displayName || options.username,
        photoURL: options.photoURL || null,
        emailVerified: false,
        providerData: [
          {
            providerId: this.name,
            uid: data.uid,
            displayName: options.displayName || options.username,
            email: options.email || null,
            phoneNumber: null,
            photoURL: options.photoURL || null,
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
          username: options.username,
        },
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
      throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
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
        throw new AuthError('REFRESH_FAILED', 'Failed to refresh token');
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
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'REFRESH_ERROR',
        error.message || 'Failed to refresh token'
      );
    }
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!this.currentUser || !this.authToken) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated');
    }

    // Validate new password
    const passwordError = this.validatePassword(newPassword);
    if (passwordError) {
      throw new AuthError('WEAK_PASSWORD', passwordError);
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
            'INVALID_PASSWORD',
            'Current password is incorrect'
          );
        }
        throw new AuthError(
          'UPDATE_FAILED',
          error.message || 'Failed to update password'
        );
      }
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        'UPDATE_ERROR',
        error.message || 'Failed to update password'
      );
    }
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    // Validate username format first
    const usernameError = this.validateUsername(username);
    if (usernameError) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.config.apiUrl}/auth/check-username`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            clientId: this.config.clientId,
          }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.available || false;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateUsername(username: string): string | null {
    const requirements = this.config.usernameRequirements!;

    if (username.length < requirements.minLength!) {
      return `Username must be at least ${requirements.minLength} characters long`;
    }

    if (username.length > requirements.maxLength!) {
      return `Username must be no more than ${requirements.maxLength} characters long`;
    }

    if (
      requirements.allowedCharacters &&
      !requirements.allowedCharacters.test(username)
    ) {
      return 'Username contains invalid characters. Only letters, numbers, underscores, and hyphens are allowed';
    }

    if (
      requirements.reservedUsernames &&
      requirements.reservedUsernames.includes(username.toLowerCase())
    ) {
      return 'This username is reserved and cannot be used';
    }

    return null;
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
    // Username/Password provider doesn't require initialization
  }

  async isSupported(): Promise<boolean> {
    // Username/Password auth is supported if we have the required config
    return !!this.config.apiUrl;
  }

  async linkAccount(_options: any): Promise<AuthResult> {
    throw new AuthError(
      'NOT_SUPPORTED',
      'Account linking is not supported for username/password authentication'
    );
  }

  async unlinkAccount(_options: any): Promise<void> {
    throw new AuthError(
      'NOT_SUPPORTED',
      'Account unlinking is not supported for username/password authentication'
    );
  }

  async revokeAccess(_token?: string): Promise<void> {
    // For username/password auth, revoking access means signing out
    await this.signOut();
  }
}

// Provider manifest for dynamic loading
export const UsernamePasswordProviderManifest = {
  name: 'username-password',
  displayName: 'Username & Password',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/user.svg',
  description: 'Traditional username and password authentication',
  setupInstructions: `
To use Username/Password authentication:

1. Set up backend API endpoints:
   - /auth/signin - Sign in with username/password
   - /auth/signup - Create new account
   - /auth/signout - Sign out user
   - /auth/refresh - Refresh access token
   - /auth/update-password - Update password
   - /auth/check-username - Check username availability

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       'username-password': {
         apiUrl: 'https://your-api.com',
         usernameRequirements: {
           minLength: 3,
           maxLength: 20,
           allowedCharacters: /^[a-zA-Z0-9_-]+$/,
           reservedUsernames: ['admin', 'root', 'system']
         },
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
   await auth.signIn('username-password', {
     username: 'johndoe',
     password: 'password123'
   });
   \`\`\`

4. Sign up:
   \`\`\`javascript
   await auth.signUp({
     username: 'johndoe',
     password: 'password123',
     email: 'john@example.com', // optional
     displayName: 'John Doe' // optional
   });
   \`\`\`

5. Check username availability:
   \`\`\`javascript
   const provider = await auth.getProvider('username-password');
   const isAvailable = await provider.checkUsernameAvailability('johndoe');
   \`\`\`

Note: This provider requires a backend service to handle authentication.
`,
};
