import {
  AuthResult,
  AuthUser,
  AuthCredential,
  AuthErrorCode,
  SignInOptions,
  UnlinkAccountOptions,
  AuthProvider,
} from '../../definitions.js';
import { AuthError } from '../../utils/auth-error.js';
import { getErrorMessage } from '../../utils/error-message.js';
import {
  BaseAuthProvider,
  BaseProviderConfig,
  resolveProviderConfig,
} from '../base-provider.js';
import { defaultLogger } from '../../utils/logger.js';

// Using the capacitor-biometric-authentication package
interface BiometricAuth {
  checkBiometry(): Promise<{
    isAvailable: boolean;
    biometryType: string;
    reason?: string;
  }>;
  authenticate(options?: {
    reason?: string;
    title?: string;
    subtitle?: string;
    fallbackTitle?: string;
  }): Promise<void>;
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
  get name(): string {
    return 'biometric';
  }
  private config: BiometricConfig;
  private biometricAuth: BiometricAuth | null = null;
  private storageKey: string;
  private cryptoKeyPromise: Promise<CryptoKey> | null = null;

  constructor(input: BaseProviderConfig | BiometricConfig = {}) {
    super(resolveProviderConfig(AuthProvider.BIOMETRIC, input));
    const config = this.options as BiometricConfig;
    this.config = {
      reason: 'Authenticate to access your account',
      title: 'Authentication Required',
      subtitle: 'Access your account securely',
      fallbackTitle: 'Use Passcode',
      requireRecentAuth: true,
      recentAuthTimeout: 5 * 60 * 1000, // 5 minutes
      ...config,
    };
    this.storageKey =
      config.storageKey || 'capacitor-auth-biometric-credentials';

    // Try to load biometric plugin
    this.loadBiometricPlugin();
  }

  private async loadBiometricPlugin(): Promise<void> {
    try {
      // Dynamic import to avoid errors if plugin not installed
      const { BiometricAuth } = await import(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- optional peer dep; module may be absent at build time
        'capacitor-biometric-authentication' as any
      );
      this.biometricAuth = BiometricAuth as BiometricAuth;
    } catch {
      defaultLogger.warn('Biometric authentication plugin not available');
    }
  }

  async signIn(_options?: SignInOptions): Promise<AuthResult> {
    if (!this.biometricAuth) {
      throw new AuthError(
        AuthErrorCode.BIOMETRIC_NOT_AVAILABLE,
        'Biometric authentication plugin is not installed. Please install capacitor-biometric-authentication'
      );
    }

    try {
      // Check if biometry is available
      const checkResult = await this.biometricAuth.checkBiometry();

      if (!checkResult.isAvailable) {
        throw new AuthError(
          AuthErrorCode.BIOMETRIC_NOT_AVAILABLE,
          checkResult.reason ||
            'Biometric authentication is not available on this device'
        );
      }

      // Check if we have stored credentials
      const storedCredentials = await this.getStoredCredentials();
      if (!storedCredentials) {
        throw new AuthError(
          AuthErrorCode.NO_STORED_CREDENTIALS,
          'No stored credentials found. Please sign in with another method first.'
        );
      }

      // Check if recent auth is required
      if (this.config.requireRecentAuth) {
        const timeSinceLastAuth = Date.now() - storedCredentials.lastAuthTime;
        if (timeSinceLastAuth > this.config.recentAuthTimeout!) {
          throw new AuthError(
            AuthErrorCode.REQUIRES_RECENT_LOGIN,
            'Authentication expired. Please sign in with another method.'
          );
        }
      }

      // Perform biometric authentication
      await this.biometricAuth.authenticate({
        reason: this.config.reason,
        title: this.config.title,
        subtitle: this.config.subtitle,
        fallbackTitle: this.config.fallbackTitle,
      });

      // Update last auth time
      storedCredentials.lastAuthTime = Date.now();
      await this.storeCredentials(storedCredentials);

      // Return stored user data
      return {
        user: storedCredentials.user,
        credential: {
          providerId: this.name,
          signInMethod: 'biometric',
          accessToken: storedCredentials.accessToken,
          refreshToken: storedCredentials.refreshToken,
        },
        additionalUserInfo: {
          isNewUser: false,
          providerId: this.name,
          profile: {
            biometryType: checkResult.biometryType,
          },
        },
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;

      // Handle biometric errors
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: unknown }).code
          : undefined;
      const errorMessage = getErrorMessage(error);

      if (errorCode === 'userCancel' || errorMessage?.includes('cancel')) {
        throw new AuthError(
          AuthErrorCode.USER_CANCELLED,
          'Authentication cancelled by user'
        );
      } else if (
        errorCode === 'biometryLockout' ||
        errorMessage?.includes('lockout')
      ) {
        throw new AuthError(
          AuthErrorCode.BIOMETRIC_LOCKOUT,
          'Too many failed attempts. Biometry is locked.'
        );
      } else if (
        errorCode === 'biometryNotEnrolled' ||
        errorMessage?.includes('enrolled')
      ) {
        throw new AuthError(
          AuthErrorCode.BIOMETRIC_NOT_ENROLLED,
          'No biometric credentials are enrolled'
        );
      }

      throw new AuthError(
        AuthErrorCode.BIOMETRIC_AUTHENTICATION_FAILED,
        errorMessage || 'Biometric authentication failed'
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
  async storeUserCredentials(
    user: AuthUser,
    credential?: AuthCredential
  ): Promise<void> {
    const credentials: StoredCredentials = {
      user,
      accessToken: credential?.accessToken,
      refreshToken: credential?.refreshToken,
      lastAuthTime: Date.now(),
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
          reason: 'Biometric authentication plugin not installed',
        };
      }
    }

    try {
      const result = await this.biometricAuth.checkBiometry();
      return {
        available: result.isAvailable,
        biometryType: result.biometryType,
        reason: result.reason,
      };
    } catch {
      return {
        available: false,
        reason: 'Failed to check biometry availability',
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
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const decrypted = await this.decrypt(stored);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  private async storeCredentials(
    credentials: StoredCredentials
  ): Promise<void> {
    if (typeof localStorage === 'undefined') {
      throw new AuthError(
        AuthErrorCode.BIOMETRIC_NOT_AVAILABLE,
        'Biometric credential storage is unavailable in this environment'
      );
    }
    try {
      const encrypted = await this.encrypt(JSON.stringify(credentials));
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.STORAGE_ERROR,
        'Failed to store credentials',
        undefined,
        { cause: String(error) }
      );
    }
  }

  private async clearStoredCredentials(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Persistent, non-extractable AES-GCM key kept in IndexedDB so it cannot be read back out by
   * script — stored biometric credentials are therefore not recoverable by simply reading
   * localStorage (unlike the previous base64 encoding).
   */
  private getEncryptionKey(): Promise<CryptoKey> {
    if (!this.cryptoKeyPromise) {
      this.cryptoKeyPromise = (async () => {
        const existing = await this.loadKeyFromIndexedDb();
        if (existing) return existing;
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
        await this.saveKeyToIndexedDb(key);
        return key;
      })();
    }
    return this.cryptoKeyPromise;
  }

  private openKeyDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('capacitor-auth-keys', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('keys');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadKeyFromIndexedDb(): Promise<CryptoKey | null> {
    if (typeof indexedDB === 'undefined') return null;
    try {
      const db = await this.openKeyDb();
      return await new Promise<CryptoKey | null>((resolve) => {
        const tx = db.transaction('keys', 'readonly');
        const req = tx.objectStore('keys').get(this.storageKey);
        req.onsuccess = () => resolve((req.result as CryptoKey) ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async saveKeyToIndexedDb(key: CryptoKey): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
      const db = await this.openKeyDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction('keys', 'readwrite');
        tx.objectStore('keys').put(key, this.storageKey);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Best-effort: a fresh key is generated next time if persistence fails.
    }
  }

  /**
   * Encrypts with AES-GCM (Web Crypto). Falls back to base64 ONLY when Web Crypto / IndexedDB
   * are unavailable (insecure context); the `b64:`/`aes:` prefix tells decrypt() the format.
   */
  private async encrypt(data: string): Promise<string> {
    if (
      typeof crypto === 'undefined' ||
      !crypto.subtle ||
      typeof indexedDB === 'undefined'
    ) {
      return `b64:${btoa(data)}`;
    }
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );
    const packed = new Uint8Array(iv.length + ciphertext.byteLength);
    packed.set(iv, 0);
    packed.set(new Uint8Array(ciphertext), iv.length);
    let binary = '';
    for (let i = 0; i < packed.length; i++) {
      binary += String.fromCharCode(packed[i]);
    }
    return `aes:${btoa(binary)}`;
  }

  private async decrypt(data: string): Promise<string> {
    if (data.startsWith('aes:')) {
      const key = await this.getEncryptionKey();
      const binary = atob(data.slice(4));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const iv = bytes.slice(0, 12);
      const ciphertext = bytes.slice(12);
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      return new TextDecoder().decode(plaintext);
    }
    // Legacy (older versions) or insecure-context fallback: base64-encoded payload.
    const payload = data.startsWith('b64:') ? data.slice(4) : data;
    return atob(payload);
  }

  async initialize(): Promise<void> {
    // Biometric provider is initialized in constructor
    // Provider is initialized
  }

  async isSupported(): Promise<boolean> {
    // Check if biometric authentication is available
    const result = await this.isAvailable();
    return result.available;
  }

  // linkAccount inherits BaseAuthProvider's OPERATION_NOT_ALLOWED default (F-44).

  async unlinkAccount(_options?: UnlinkAccountOptions): Promise<void> {
    // Unlinking biometric auth means clearing stored credentials
    await this.clearStoredCredentials();
  }

  async revokeAccess(_token?: string): Promise<void> {
    // For biometric auth, revoking access means clearing stored credentials
    await this.clearStoredCredentials();
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
`,
};
