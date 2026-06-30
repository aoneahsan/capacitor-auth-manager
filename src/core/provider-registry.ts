import type { AuthProviderInterface, ProviderManifest } from './types';
import { PlatformDetector } from './platform';
import { AuthProvider, AuthPersistence, AuthErrorCode } from '../definitions';
import type { ProviderOptions } from '../definitions';
import { AuthError } from '../utils/auth-error';
import { WebStorage } from '../utils/storage';
import type { StorageInterface } from '../utils/storage';
import { Logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-message';
import { BUILT_IN_PROVIDER_MANIFESTS } from './provider-manifests';

export interface ProviderLoader {
  (): Promise<
    | { default: new (config?: unknown) => AuthProviderInterface }
    | { default: unknown }
  >;
}

/**
 * Dependencies the registry injects into BaseAuthProvider-derived providers so they
 * share the AuthManager's storage + logger (the same instances credentials are read from).
 */
export interface ProviderDeps {
  storage: StorageInterface;
  logger: Logger;
  persistence?: AuthPersistence;
}

export class ProviderRegistry {
  private static providers = new Map<string, AuthProviderInterface>();
  private static loaders = new Map<string, ProviderLoader>();
  private static manifests = new Map<string, ProviderManifest>();

  /** Providers constructed with their raw options object (not a BaseProviderConfig wrapper). */
  private static readonly STANDALONE_PROVIDERS = new Set<string>([
    'magic-link',
    'sms',
    'email-password',
    'username-password',
    'biometric',
    'phone-password',
    'email-code',
  ]);

  /** Maps AuthProvider enum values (some underscored) to the registered hyphenated loader keys. */
  private static readonly NAME_ALIASES: Record<string, string> = {
    email_magic_link: 'magic-link',
    username_password: 'username-password',
    phone_password: 'phone-password',
    email_code: 'email-code',
  };

  /**
   * Every provider this package knows about (canonical loader keys). Used to distinguish a
   * recognized-but-not-yet-enabled provider (→ PROVIDER_NOT_ENABLED) from a genuinely unknown one
   * (→ UNSUPPORTED_PROVIDER). As of 2.4.1 only `google` has a registered loader; the rest are
   * re-enabled one at a time (see docs/features/google-provider-production-v3).
   */
  private static readonly RECOGNIZED_PROVIDERS = new Set<string>([
    'google',
    'apple',
    'microsoft',
    'facebook',
    'github',
    'slack',
    'linkedin',
    'firebase',
    'magic-link',
    'sms',
    'email-password',
    'phone-password',
    'username-password',
    'email-code',
    'biometric',
  ]);

  static {
    // Register built-in provider manifests (data lives in provider-manifests.ts — F-40).
    for (const manifest of BUILT_IN_PROVIDER_MANIFESTS) {
      this.registerManifest(manifest);
    }

    // --- Provider loaders -----------------------------------------------------------------
    // WIP: providers are enabled ONE AT A TIME (see docs/features/google-provider-production-v3).
    // As of 2.4.1 only Google is enabled. The Google loader is PLATFORM-AWARE: native (iOS/Android)
    // routes to the native Google SDK through the Capacitor plugin bridge; web/electron uses Google
    // Identity Services in the browser — same `auth.signIn(AuthProvider.GOOGLE)` call on every platform.
    this.registerLoader('google', () => {
      const { platform } = PlatformDetector.getPlatform();
      return platform === 'ios' || platform === 'android'
        ? import('../providers/native/google-native-provider').then((m) => ({
            default: m.GoogleNativeProvider,
          }))
        : import('../providers/web/google-provider').then((m) => ({
            default: m.GoogleAuthProviderWeb,
          }));
    });

    // The remaining providers (apple, microsoft, facebook, github, slack, linkedin, firebase,
    // magic-link, sms, email-password, phone-password, username-password, email-code, biometric)
    // are intentionally NOT registered yet. Their web implementations still live under
    // src/providers/web/ but are excluded from the published build (tsconfig.build.json). Re-enable
    // each by restoring its loader here (and removing its tsconfig.build exclude) once it has been
    // hardened and verified on device. signIn() for any of them throws PROVIDER_NOT_ENABLED below.
  }

  static registerManifest(manifest: ProviderManifest): void {
    this.manifests.set(manifest.name, manifest);
  }

  static registerLoader(name: string, loader: ProviderLoader): void {
    this.loaders.set(name, loader);
  }

  static getManifest(name: string): ProviderManifest | undefined {
    return this.manifests.get(name);
  }

  static canonicalName(name: string): string {
    return this.NAME_ALIASES[name] ?? name;
  }

  static async getProvider(
    name: string,
    options?: ProviderOptions,
    deps?: ProviderDeps
  ): Promise<AuthProviderInterface> {
    const key = this.canonicalName(name);

    // Check if already loaded
    const existing = this.providers.get(key);
    if (existing) {
      return existing;
    }

    // Check if loader exists. As of 2.4.1 only Google has a registered loader; a recognized provider
    // without one is "not enabled yet" (distinct from an unknown provider) so consumers can branch on
    // AuthErrorCode.PROVIDER_NOT_ENABLED.
    const loader = this.loaders.get(key);
    if (!loader) {
      if (this.RECOGNIZED_PROVIDERS.has(key)) {
        throw new AuthError(
          AuthErrorCode.PROVIDER_NOT_ENABLED,
          `Provider '${name}' is not enabled yet. capacitor-auth-manager currently ships a hardened ` +
            `Google provider; the remaining providers are being re-enabled one at a time. ` +
            `Use AuthProvider.GOOGLE for now, and track progress at ` +
            `https://github.com/aoneahsan/capacitor-auth-manager.`
        );
      }
      throw new AuthError(
        AuthErrorCode.UNSUPPORTED_PROVIDER,
        `Unknown provider: ${name}`
      );
    }

    // Check platform support
    const manifest = this.manifests.get(key);
    if (manifest?.platforms) {
      const platform = PlatformDetector.getPlatform();
      if (
        !manifest.platforms.includes(
          platform.platform as 'web' | 'ios' | 'android' | 'electron'
        )
      ) {
        throw new Error(
          `Provider '${name}' is not supported on ${platform.platform}`
        );
      }
    }

    try {
      // Load the provider class. Every loader resolves to `{ default: <ProviderConstructor> }`
      // (see registerLoader calls above); narrow `default` to that constructor shape so the
      // `new ProviderClass(...)` below type-checks without resorting to `any`.
      const module = await loader();
      const ProviderClass = module.default as new (
        config?: unknown
      ) => AuthProviderInterface;

      // Build the constructor argument. BaseAuthProvider subclasses need a full
      // BaseProviderConfig ({ provider, options, storage, logger, persistence });
      // standalone providers take their options object directly.
      const storage = deps?.storage ?? new WebStorage(AuthPersistence.LOCAL);
      const logger =
        deps?.logger ??
        new Logger({
          enableLogging: false,
          logLevel: 'warn',
          prefix: 'AuthManager',
        });
      const constructorArg = this.STANDALONE_PROVIDERS.has(key)
        ? (options ?? {})
        : {
            provider: key as AuthProvider,
            options: (options ?? {}) as ProviderOptions,
            storage,
            logger,
            persistence: deps?.persistence,
          };

      // Create instance
      const provider = new ProviderClass(constructorArg);

      // Initialize if supported (BaseAuthProvider.initialize takes no arguments)
      if (provider.initialize) {
        await provider.initialize();
      }

      // Cache the provider under its canonical key
      this.providers.set(key, provider);

      return provider;
    } catch (error) {
      // Check if it's a missing dependency error
      const message = getErrorMessage(error);
      if (
        message?.includes('Cannot find module') ||
        message?.includes('Failed to resolve module')
      ) {
        const manifest = this.manifests.get(this.canonicalName(name));
        if (manifest?.packageName) {
          throw new Error(
            `Missing dependency for ${manifest.displayName} provider.\n\n` +
              `Install the required package:\n` +
              `npm install ${manifest.packageName}\n\n` +
              `Then try again.`
          );
        }
      }
      throw error;
    }
  }

  static clearProvider(name: string): void {
    const key = this.canonicalName(name);
    const provider = this.providers.get(key);
    if (provider?.dispose) {
      provider.dispose();
    }
    this.providers.delete(key);
  }

  static clearAll(): void {
    for (const [, provider] of this.providers) {
      if (provider.dispose) {
        provider.dispose();
      }
    }
    this.providers.clear();
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.manifests.keys());
  }

  static getSupportedProviders(): Promise<string[]> {
    const platform = PlatformDetector.getPlatform();
    const supported: string[] = [];

    for (const [name, manifest] of this.manifests) {
      if (
        !manifest.platforms ||
        manifest.platforms.includes(
          platform.platform as 'web' | 'ios' | 'android' | 'electron'
        )
      ) {
        supported.push(name);
      }
    }

    return Promise.resolve(supported);
  }
}
