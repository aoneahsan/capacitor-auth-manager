import type { ProviderManifest } from './types.js';

/**
 * Built-in provider manifests (display metadata + human-readable setup instructions).
 *
 * Extracted from `provider-registry.ts` as a pure data module (zero logic) so the registry stays
 * under the project's file-size guideline. `ProviderRegistry` imports this array and registers each
 * entry in its static initializer — behaviour is unchanged (see F-40).
 */
export const BUILT_IN_PROVIDER_MANIFESTS: ProviderManifest[] = [
  {
    name: 'google',
    displayName: 'Google',
    setupInstructions: `
To use Google authentication:

1. Create (or reuse) an OAuth 2.0 **Web** client in Google Cloud Console — Firebase creates one for you
   when you enable the Google sign-in provider. Add your site origins (including your dev server, e.g.
   http://localhost:5931) under "Authorized JavaScript origins".

2. Configure the provider (no extra npm package is needed — the Google Identity Services script is
   loaded on demand on web; the native SDKs ship with the plugin):
   auth.configure({
     providers: {
       google: {
         clientId: 'YOUR_WEB_CLIENT_ID',        // web + Android serverClientId fallback
         serverClientId: 'YOUR_WEB_CLIENT_ID',  // Android
         iosClientId: 'YOUR_IOS_CLIENT_ID',     // iOS (or GIDClientID in Info.plist)
       }
     }
   })

3. Android: register your signing key's SHA-1 in Firebase / Google Cloud. iOS: add the reversed
   client id as a URL scheme.
`,
    platforms: ['web', 'ios', 'android'],
    configSchema: {
      clientId: { type: 'string', required: true },
      scopes: { type: 'array', items: 'string' },
      hostedDomain: { type: 'string' },
    },
  },
  {
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
      scopes: { type: 'array', items: 'string' },
    },
  },
  {
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
      projectId: { type: 'string', required: true },
    },
  },
  {
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
      scopes: { type: 'array', items: 'string' },
    },
  },
  {
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
      scopes: { type: 'array', items: 'string' },
    },
  },
  {
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
      scopes: { type: 'array', items: 'string' },
    },
  },
  {
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
      redirectUrl: { type: 'string' },
    },
  },
  {
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
      codeLength: { type: 'number' },
    },
  },
  {
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
      passwordRequirements: { type: 'object' },
    },
  },
  {
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
      subtitle: { type: 'string' },
    },
  },
  {
    name: 'slack',
    displayName: 'Slack',
    setupInstructions: `
To use Slack authentication:

1. Create a Slack App:
   - Go to https://api.slack.com/apps
   - Click "Create New App" > "From scratch"
   - Name your app and select workspace

2. Configure OAuth & Permissions:
   - Add redirect URL: https://your-app.com/auth/slack/callback
   - Add required scopes:
     - openid
     - profile
     - email

3. Get your credentials:
   - Go to "Basic Information"
   - Copy Client ID and Client Secret

4. Configure the provider:
   auth.configure({
     providers: {
       slack: {
         clientId: 'YOUR_CLIENT_ID',
         redirectUri: 'https://your-app.com/auth/slack/callback',
         scopes: ['openid', 'profile', 'email'],
         teamId: 'OPTIONAL_TEAM_ID' // Restrict to specific workspace
       }
     }
   })

Note: Slack OAuth requires a backend service to exchange the authorization code for access tokens.
`,
    platforms: ['web'],
    configSchema: {
      clientId: { type: 'string', required: true },
      redirectUri: { type: 'string', required: true },
      scopes: { type: 'array', items: 'string' },
      teamId: { type: 'string' },
    },
  },
  {
    name: 'linkedin',
    displayName: 'LinkedIn',
    setupInstructions: `
To use LinkedIn authentication:

1. Create a LinkedIn App:
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create app"
   - Fill in required information
   - Verify your app

2. Configure OAuth 2.0:
   - Go to the "Auth" tab
   - Add authorized redirect URLs:
     - https://your-app.com/auth/linkedin/callback
   - Note your Client ID and Client Secret

3. Configure scopes:
   - Under "OAuth 2.0 scopes", select:
     - openid
     - profile
     - email

4. Configure the provider:
   auth.configure({
     providers: {
       linkedin: {
         clientId: 'YOUR_CLIENT_ID',
         redirectUri: 'https://your-app.com/auth/linkedin/callback',
         scopes: ['openid', 'profile', 'email']
       }
     }
   })

Note: LinkedIn OAuth requires a backend service to exchange the authorization code for access tokens.
The redirect URI must be HTTPS in production (LinkedIn requirement).
`,
    platforms: ['web'],
    configSchema: {
      clientId: { type: 'string', required: true },
      redirectUri: { type: 'string', required: true },
      scopes: { type: 'array', items: 'string' },
    },
  },
  {
    name: 'username-password',
    displayName: 'Username & Password',
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
   })

3. Sign in:
   await auth.signIn('username-password', {
     username: 'johndoe',
     password: 'password123'
   });

4. Sign up:
   await auth.signUp({
     username: 'johndoe',
     password: 'password123',
     email: 'john@example.com', // optional
     displayName: 'John Doe' // optional
   });

Note: This provider requires a backend service to handle authentication.
`,
    platforms: ['web', 'ios', 'android'],
    configSchema: {
      apiUrl: { type: 'string', required: true },
      usernameRequirements: { type: 'object' },
      passwordRequirements: { type: 'object' },
      allowSignUp: { type: 'boolean' },
    },
  },
];
