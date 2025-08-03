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

    this.registerManifest({
      name: 'microsoft',
      displayName: 'Microsoft',
      packageName: '@azure/msal-browser',
      setupInstructions: `
To use Microsoft authentication:

1. Install the Microsoft Authentication Library:
   npm install @azure/msal-browser

2. Configure your Azure AD app:
   - Go to https://portal.azure.com/
   - Create or select an app registration
   - Add platform configuration for SPA
   - Add redirect URIs

3. Configure the provider:
   auth.configure({
     providers: {
       microsoft: {
         clientId: 'YOUR_CLIENT_ID',
         authority: 'YOUR_AUTHORITY', // optional
         redirectUri: 'YOUR_REDIRECT_URI' // optional
       }
     }
   })
`,
      platforms: ['web'],
      configSchema: {
        clientId: { type: 'string', required: true },
        authority: { type: 'string' },
        redirectUri: { type: 'string' },
        scopes: { type: 'array', items: 'string' }
      }
    });

    this.registerManifest({
      name: 'facebook',
      displayName: 'Facebook',
      setupInstructions: `
To use Facebook authentication:

1. Configure your Facebook app:
   - Go to https://developers.facebook.com/
   - Create or select an app
   - Add Facebook Login product
   - Configure OAuth redirect URIs

2. Add Facebook SDK to your HTML:
   <script async defer crossorigin="anonymous" 
     src="https://connect.facebook.net/en_US/sdk.js"></script>

3. Configure the provider:
   auth.configure({
     providers: {
       facebook: {
         appId: 'YOUR_APP_ID',
         version: 'v18.0' // optional
       }
     }
   })
`,
      platforms: ['web'],
      configSchema: {
        appId: { type: 'string', required: true },
        version: { type: 'string' },
        scopes: { type: 'array', items: 'string' }
      }
    });

    this.registerManifest({
      name: 'github',
      displayName: 'GitHub',
      setupInstructions: `
To use GitHub authentication:

1. Configure your GitHub OAuth app:
   - Go to https://github.com/settings/developers
   - Create a new OAuth App
   - Set authorization callback URL

2. Configure the provider:
   auth.configure({
     providers: {
       github: {
         clientId: 'YOUR_CLIENT_ID',
         redirectUri: 'YOUR_REDIRECT_URI'
       }
     }
   })

Note: You'll need a backend service to exchange the authorization code for an access token.
`,
      platforms: ['web'],
      configSchema: {
        clientId: { type: 'string', required: true },
        redirectUri: { type: 'string' },
        scopes: { type: 'array', items: 'string' }
      }
    });

    // Register all new provider manifests
    this.registerManifest({
      name: 'magic-link',
      displayName: 'Email Magic Link',
      setupInstructions: `
To use Email Magic Link authentication:

1. Set up a backend endpoint to send emails:
   - Endpoint should accept POST requests with email and magic link
   - Send email with the magic link to the user

2. Configure the provider:
   auth.configure({
     providers: {
       'magic-link': {
         sendLinkUrl: 'https://your-api.com/send-magic-link',
         verifyUrl: 'https://your-api.com/verify-magic-link', // Optional
         redirectUrl: window.location.origin + '/auth-callback'
       }
     }
   })
`,
      platforms: ['web'],
      configSchema: {
        sendLinkUrl: { type: 'string', required: true },
        verifyUrl: { type: 'string' },
        redirectUrl: { type: 'string' }
      }
    });

    this.registerManifest({
      name: 'sms',
      displayName: 'SMS Authentication',
      setupInstructions: `
To use SMS authentication:

1. Set up backend endpoints:
   - Send code endpoint: POST request to send SMS
   - Verify code endpoint: POST request to verify SMS code

2. Configure the provider:
   auth.configure({
     providers: {
       sms: {
         sendCodeUrl: 'https://your-api.com/sms/send',
         verifyCodeUrl: 'https://your-api.com/sms/verify',
         countryCode: '+1', // Default country code
         codeLength: 6     // SMS code length
       }
     }
   })
`,
      platforms: ['web', 'ios', 'android'],
      configSchema: {
        sendCodeUrl: { type: 'string', required: true },
        verifyCodeUrl: { type: 'string', required: true },
        countryCode: { type: 'string' },
        codeLength: { type: 'number' }
      }
    });

    this.registerManifest({
      name: 'email-password',
      displayName: 'Email & Password',
      setupInstructions: `
To use Email/Password authentication:

1. Set up backend API endpoints for authentication

2. Configure the provider:
   auth.configure({
     providers: {
       'email-password': {
         apiUrl: 'https://your-api.com',
         passwordRequirements: {
           minLength: 8,
           requireUppercase: true,
           requireNumbers: true
         }
       }
     }
   })
`,
      platforms: ['web', 'ios', 'android'],
      configSchema: {
        apiUrl: { type: 'string', required: true },
        passwordRequirements: { type: 'object' }
      }
    });

    this.registerManifest({
      name: 'biometric',
      displayName: 'Biometric Authentication',
      packageName: 'capacitor-biometric-authentication',
      setupInstructions: `
To use Biometric authentication:

1. Install the capacitor-biometric-authentication plugin:
   npm install capacitor-biometric-authentication
   npx cap sync

2. Configure the provider:
   auth.configure({
     providers: {
       biometric: {
         reason: 'Authenticate to access your account',
         title: 'Authentication Required'
       }
     }
   })

Note: Users must first authenticate with another method before enabling biometric authentication.
`,
      platforms: ['ios', 'android'],
      configSchema: {
        reason: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' }
      }
    });

    // Register provider loaders
    this.registerLoader('google', () => import('../providers/web/google-provider').then(m => ({ default: m.GoogleProvider })));
    this.registerLoader('apple', () => import('../providers/web/apple-provider').then(m => ({ default: m.AppleProvider })));
    this.registerLoader('microsoft', () => import('../providers/web/microsoft-provider').then(m => ({ default: m.MicrosoftProvider })));
    this.registerLoader('facebook', () => import('../providers/web/facebook-provider').then(m => ({ default: m.FacebookProvider })));
    this.registerLoader('github', () => import('../providers/web/github-provider').then(m => ({ default: m.GitHubProvider })));
    this.registerLoader('firebase', () => import('../providers/web/firebase-provider').then(m => ({ default: m.FirebaseProvider })));
    this.registerLoader('magic-link', () => import('../providers/web/magic-link-provider').then(m => ({ default: m.MagicLinkProvider })));
    this.registerLoader('sms', () => import('../providers/web/sms-provider').then(m => ({ default: m.SMSProvider })));
    this.registerLoader('email-password', () => import('../providers/web/email-password-provider').then(m => ({ default: m.EmailPasswordProvider })));
    this.registerLoader('biometric', () => import('../providers/web/biometric-provider').then(m => ({ default: m.BiometricProvider })));
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