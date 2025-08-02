import type { AuthProviderInterface, ProviderManifest } from './types';
import { PlatformDetector } from './platform';

export interface ProviderLoader {
  (): Promise<{ default: new (config: any) => AuthProviderInterface } | { default: any }>;
}

export class ProviderRegistry {
  private static providers = new Map<string, AuthProviderInterface>();
  private static loaders = new Map<string, ProviderLoader>();
  private static manifests = new Map<string, ProviderManifest>();

  static {
    // Register built-in provider manifests
    this.registerManifest({
      name: 'google',
      displayName: 'Google',
      packageName: '@google/gsi',
      setupInstructions: `
To use Google authentication, you need to:

1. Install the Google Sign-In SDK:
   npm install @google/gsi

2. Configure your Google OAuth client:
   - Go to https://console.cloud.google.com/
   - Create or select a project
   - Enable Google Sign-In API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins

3. Configure the provider:
   auth.configure({
     providers: {
       google: {
         clientId: 'YOUR_CLIENT_ID'
       }
     }
   })
`,
      platforms: ['web', 'ios', 'android'],
      configSchema: {
        clientId: { type: 'string', required: true },
        scopes: { type: 'array', items: 'string' },
        hostedDomain: { type: 'string' }
      }
    });

    this.registerManifest({
      name: 'apple',
      displayName: 'Apple',
      setupInstructions: `
To use Apple authentication:

1. Configure Sign in with Apple:
   - Go to https://developer.apple.com/
   - Configure your app for Sign in with Apple
   - Create a Services ID for web
   - Configure return URLs

2. Configure the provider:
   auth.configure({
     providers: {
       apple: {
         clientId: 'YOUR_SERVICE_ID',
         redirectUri: 'YOUR_REDIRECT_URI'
       }
     }
   })
`,
      platforms: ['web', 'ios'],
      configSchema: {
        clientId: { type: 'string', required: true },
        redirectUri: { type: 'string', required: true },
        scopes: { type: 'array', items: 'string' }
      }
    });

    this.registerManifest({
      name: 'firebase',
      displayName: 'Firebase Auth',
      packageName: 'firebase',
      setupInstructions: `
To use Firebase authentication:

1. Install Firebase SDK:
   npm install firebase

2. Configure Firebase:
   - Go to https://console.firebase.google.com/
   - Create or select a project
   - Add your app (Web/iOS/Android)
   - Copy the configuration

3. Configure the provider:
   auth.configure({
     providers: {
       firebase: {
         apiKey: 'YOUR_API_KEY',
         authDomain: 'YOUR_AUTH_DOMAIN',
         projectId: 'YOUR_PROJECT_ID',
         // ... other Firebase config
       }
     }
   })
`,
      platforms: ['web', 'ios', 'android'],
      configSchema: {
        apiKey: { type: 'string', required: true },
        authDomain: { type: 'string', required: true },
        projectId: { type: 'string', required: true }
      }
    });

    // Register provider loaders
    this.registerLoader('google', () => import('../providers/web/google-provider').then(m => ({ default: m.GoogleAuthProviderWeb })));
    this.registerLoader('apple', () => import('../providers/web/apple-provider').then(m => ({ default: m.AppleAuthProviderWeb })));
    // More loaders will be added as providers are implemented
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

  static async getProvider(name: string, config?: any): Promise<AuthProviderInterface> {
    // Check if already loaded
    const existing = this.providers.get(name);
    if (existing) {
      return existing;
    }

    // Check if loader exists
    const loader = this.loaders.get(name);
    if (!loader) {
      const manifest = this.manifests.get(name);
      if (manifest) {
        throw new Error(
          `Provider '${name}' is not loaded.\n\n${manifest.setupInstructions || `Please configure the ${manifest.displayName} provider.`}`
        );
      }
      throw new Error(`Unknown provider: ${name}`);
    }

    // Check platform support
    const manifest = this.manifests.get(name);
    if (manifest?.platforms) {
      const platform = PlatformDetector.getPlatform();
      if (!manifest.platforms.includes(platform.platform as any)) {
        throw new Error(`Provider '${name}' is not supported on ${platform.platform}`);
      }
    }

    try {
      // Load the provider
      const module = await loader();
      const ProviderClass = module.default;
      
      // Create instance
      const provider = new ProviderClass(config);
      
      // Initialize if needed
      if (provider.initialize) {
        await provider.initialize(config);
      }

      // Cache the provider
      this.providers.set(name, provider);
      
      return provider;
    } catch (error: any) {
      // Check if it's a missing dependency error
      if (error.message?.includes('Cannot find module') || error.message?.includes('Failed to resolve module')) {
        const manifest = this.manifests.get(name);
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
    const provider = this.providers.get(name);
    if (provider?.dispose) {
      provider.dispose();
    }
    this.providers.delete(name);
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
      if (!manifest.platforms || manifest.platforms.includes(platform.platform as any)) {
        supported.push(name);
      }
    }

    return Promise.resolve(supported);
  }
}