import { BaseAuthProvider } from '../base-provider';
import { AuthResult, AuthUser, SignInOptions } from '../../definitions';
import { AuthError } from '../../utils/auth-error';

// Using the capacitor-biometric-authentication package
interface BiometricAuth {
  checkBiometry(): Promise<{ isAvailable: boolean; biometryType: string; reason?: string }>;
  authenticate(options?: { reason?: string; title?: string; subtitle?: string; fallbackTitle?: string }): Promise<void>;
}

export interface BiometricConfig {
  reason?: string;
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
  storageKey?: string;
  requireRecentAuth?: boolean;
  recentAuthTimeout?: number; // milliseconds
}

interface StoredCredentials {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  lastAuthTime: number;
}

export class BiometricProvider extends BaseAuthProvider {
  private config: BiometricConfig;
  private biometricAuth: BiometricAuth | null = null;
  private storageKey: string;

  constructor(config: BiometricConfig = {}) {
    super('biometric');
    this.config = {
      reason: 'Authenticate to access your account',
      title: 'Authentication Required',
      subtitle: 'Access your account securely',
      fallbackTitle: 'Use Passcode',
      requireRecentAuth: true,
      recentAuthTimeout: 5 * 60 * 1000, // 5 minutes
      ...config
    };
    this.storageKey = config.storageKey || 'capacitor-auth-biometric-credentials';
    
    // Try to load biometric plugin
    this.loadBiometricPlugin();
  }

  private async loadBiometricPlugin(): Promise<void> {
    try {
      // Dynamic import to avoid errors if plugin not installed
      const { BiometricAuth } = await import('capacitor-biometric-authentication');
      this.biometricAuth = BiometricAuth as any;
    } catch {
      console.warn('Biometric authentication plugin not available');
    }
  }

  async signIn(_options?: SignInOptions): Promise<AuthResult> {
    if (!this.biometricAuth) {
      throw new AuthError(
        'BIOMETRIC_NOT_AVAILABLE',
        'Biometric authentication plugin is not installed. Please install capacitor-biometric-authentication'
      );
    }

    try {
      // Check if biometry is available
      const checkResult = await this.biometricAuth.checkBiometry();
      
      if (!checkResult.isAvailable) {
        throw new AuthError(
          'BIOMETRIC_NOT_AVAILABLE',
          checkResult.reason || 'Biometric authentication is not available on this device'
        );
      }

      // Check if we have stored credentials
      const storedCredentials = await this.getStoredCredentials();
      if (!storedCredentials) {
        throw new AuthError(
          'NO_STORED_CREDENTIALS',
          'No stored credentials found. Please sign in with another method first.'
        );
      }

      // Check if recent auth is required
      if (this.config.requireRecentAuth) {
        const timeSinceLastAuth = Date.now() - storedCredentials.lastAuthTime;
        if (timeSinceLastAuth > this.config.recentAuthTimeout!) {
          throw new AuthError(
            'AUTH_EXPIRED',
            'Authentication expired. Please sign in with another method.'
          );
        }
      }

      // Perform biometric authentication
      await this.biometricAuth.authenticate({
        reason: this.config.reason,
        title: this.config.title,
        subtitle: this.config.subtitle,
        fallbackTitle: this.config.fallbackTitle
      });

      // Update last auth time
      storedCredentials.lastAuthTime = Date.now();
      await this.storeCredentials(storedCredentials);

      // Return stored user data
      return {
        user: storedCredentials.user,
        credential: {
          providerId: this.provider,
          signInMethod: 'biometric',
          accessToken: storedCredentials.accessToken,
          refreshToken: storedCredentials.refreshToken
        },
        additionalUserInfo: {
          biometryType: checkResult.biometryType
        }
      };
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      
      // Handle biometric errors
      if (error.code === 'userCancel' || error.message?.includes('cancel')) {
        throw new AuthError('USER_CANCELLED', 'Authentication cancelled by user');
      } else if (error.code === 'biometryLockout' || error.message?.includes('lockout')) {
        throw new AuthError('BIOMETRY_LOCKOUT', 'Too many failed attempts. Biometry is locked.');
      } else if (error.code === 'biometryNotEnrolled' || error.message?.includes('enrolled')) {
        throw new AuthError('NOT_ENROLLED', 'No biometric credentials are enrolled');
      }
      
      throw new AuthError(
        'BIOMETRIC_ERROR',
        error.message || 'Biometric authentication failed'
      );
    }
  }

  async signOut(): Promise<void> {
    // Clear stored credentials
    await this.clearStoredCredentials();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const stored = await this.getStoredCredentials();
    return stored?.user || null;
  }

  async refreshToken(): Promise<AuthResult> {
    // Re-authenticate with biometrics
    return this.signIn();
  }

  // Store credentials for biometric access
  async storeUserCredentials(user: AuthUser, credential?: any): Promise<void> {
    const credentials: StoredCredentials = {
      user,
      accessToken: credential?.accessToken,
      refreshToken: credential?.refreshToken,
      lastAuthTime: Date.now()
    };
    
    await this.storeCredentials(credentials);
  }

  // Check if biometric authentication is available
  async isAvailable(): Promise<{
    available: boolean;
    biometryType?: string;
    reason?: string;
  }> {
    if (!this.biometricAuth) {
      await this.loadBiometricPlugin();
      if (!this.biometricAuth) {
        return {
          available: false,
          reason: 'Biometric authentication plugin not installed'
        };
      }
    }

    try {
      const result = await this.biometricAuth.checkBiometry();
      return {
        available: result.isAvailable,
        biometryType: result.biometryType,
        reason: result.reason
      };
    } catch {
      return {
        available: false,
        reason: 'Failed to check biometry availability'
      };
    }
  }

  // Check if credentials are stored
  async hasStoredCredentials(): Promise<boolean> {
    const stored = await this.getStoredCredentials();
    if (!stored) return false;
    
    // Check if auth is still valid
    if (this.config.requireRecentAuth) {
      const timeSinceLastAuth = Date.now() - stored.lastAuthTime;
      return timeSinceLastAuth <= this.config.recentAuthTimeout!;
    }
    
    return true;
  }

  private async getStoredCredentials(): Promise<StoredCredentials | null> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      const decrypted = await this.decrypt(stored);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  private async storeCredentials(credentials: StoredCredentials): Promise<void> {
    try {
      const encrypted = await this.encrypt(JSON.stringify(credentials));
      localStorage.setItem(this.storageKey, encrypted);
    } catch {
      throw new AuthError('STORAGE_ERROR', 'Failed to store credentials');
    }
  }

  private async clearStoredCredentials(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  // Simple encryption/decryption (in production, use proper encryption)
  private async encrypt(data: string): Promise<string> {
    // In a real implementation, use Web Crypto API or similar
    return btoa(data);
  }

  private async decrypt(data: string): Promise<string> {
    // In a real implementation, use Web Crypto API or similar
    return atob(data);
  }
}

// Provider manifest for dynamic loading
export const BiometricProviderManifest = {
  name: 'biometric',
  displayName: 'Biometric Authentication',
  iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/fingerprint.svg',
  description: 'Face ID, Touch ID, and Fingerprint authentication',
  setupInstructions: `
To use Biometric authentication:

1. Install the capacitor-biometric-authentication plugin:
   \`\`\`bash
   npm install capacitor-biometric-authentication
   npx cap sync
   \`\`\`

2. Configure the provider:
   \`\`\`javascript
   auth.configure({
     providers: {
       biometric: {
         reason: 'Authenticate to access your account',
         title: 'Authentication Required',
         subtitle: 'Access your account securely',
         fallbackTitle: 'Use Passcode',
         requireRecentAuth: true,
         recentAuthTimeout: 5 * 60 * 1000 // 5 minutes
       }
     }
   });
   \`\`\`

3. Store user credentials after initial sign in:
   \`\`\`javascript
   // Sign in with another provider first
   const result = await auth.signIn('google');
   
   // Store credentials for biometric access
   const biometricProvider = await auth.getProvider('biometric');
   await biometricProvider.storeUserCredentials(result.user, result.credential);
   \`\`\`

4. Use biometric authentication:
   \`\`\`javascript
   // Check availability
   const biometric = await auth.getProvider('biometric');
   const { available, biometryType } = await biometric.isAvailable();
   
   if (available) {
     // Authenticate with biometrics
     await auth.signIn('biometric');
   }
   \`\`\`

Platform Requirements:
- iOS: Face ID or Touch ID enabled device
- Android: Fingerprint sensor or Face recognition
- Web: WebAuthn support (limited)

Note: Users must first authenticate with another method before enabling biometric authentication.
`
};