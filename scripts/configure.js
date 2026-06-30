#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function configure() {
  console.log('\n🔐 Capacitor Auth Manager Configuration\n');

  // Detect platform
  const platform = await selectPlatform();

  // Select providers
  const providers = await selectProviders();

  // Configure each provider
  const configs = {};
  for (const provider of providers) {
    console.log(`\n📋 Configuring ${provider}...`);
    configs[provider] = await configureProvider(provider);
  }

  // Generate configuration files
  await generateConfigs(platform, configs);

  // Update native projects
  if (platform.includes('ios')) {
    await configureIOS(configs);
  }

  if (platform.includes('android')) {
    await configureAndroid(configs);
  }

  console.log('\n✅ Configuration complete!\n');
  console.log('Next steps:');
  console.log('1. Review the generated configuration files');
  console.log('2. Add your provider-specific credentials');
  console.log('3. Run `npx cap sync` to update your native projects');
  console.log(
    '4. Follow the platform-specific setup instructions in the README\n'
  );

  rl.close();
}

async function selectPlatform() {
  console.log('Which platforms are you targeting?');
  console.log('1. iOS, Android, and Web');
  console.log('2. iOS and Web');
  console.log('3. Android and Web');
  console.log('4. Web only');

  const choice = await question('\nSelect platform (1-4): ');

  switch (choice) {
    case '1':
      return ['ios', 'android', 'web'];
    case '2':
      return ['ios', 'web'];
    case '3':
      return ['android', 'web'];
    case '4':
      return ['web'];
    default:
      console.log('Invalid choice, defaulting to all platforms');
      return ['ios', 'android', 'web'];
  }
}

async function selectProviders() {
  const allProviders = [
    'google',
    'apple',
    'microsoft',
    'facebook',
    'github',
    'slack',
    'linkedin',
    'firebase',
    'email_magic_link',
    'sms',
    'email_password',
    'phone_password',
    'username_password',
    'email_code',
    'biometric',
  ];

  console.log('\nAvailable authentication providers:');
  allProviders.forEach((p, i) => console.log(`${i + 1}. ${p}`));

  const input = await question(
    '\nSelect providers (comma-separated numbers, or "all"): '
  );

  if (input.toLowerCase() === 'all') {
    return allProviders;
  }

  const indices = input.split(',').map((n) => parseInt(n.trim()) - 1);
  return indices
    .filter((i) => i >= 0 && i < allProviders.length)
    .map((i) => allProviders[i]);
}

async function configureProvider(provider) {
  const config = {};

  switch (provider) {
    case 'google':
      config.clientId = await question('Google Client ID (Web): ');
      config.serverClientId = await question(
        'Google Server Client ID (Android): '
      );
      config.iosClientId = await question('Google iOS Client ID: ');
      break;

    case 'apple':
      config.clientId = await question('Apple Service ID: ');
      config.redirectUri = await question('Apple Redirect URI: ');
      break;

    case 'microsoft':
      config.clientId = await question('Microsoft Azure Client ID: ');
      config.tenantId = await question('Microsoft Tenant ID (or "common"): ');
      config.redirectUri = await question('Microsoft Redirect URI: ');
      break;

    case 'facebook':
      config.appId = await question('Facebook App ID: ');
      config.appName = await question('Facebook App Name: ');
      break;

    case 'firebase':
      config.apiKey = await question('Firebase API Key: ');
      config.authDomain = await question('Firebase Auth Domain: ');
      config.projectId = await question('Firebase Project ID: ');
      config.appId = await question('Firebase App ID: ');
      break;

    case 'sms':
      const smsProvider = await question(
        'SMS Provider (twilio/firebase/custom): '
      );
      config.provider = smsProvider;
      if (smsProvider === 'twilio') {
        config.accountSid = await question('Twilio Account SID: ');
        config.authToken = await question('Twilio Auth Token: ');
        config.fromNumber = await question('Twilio From Number: ');
      }
      break;
  }

  return config;
}

async function generateConfigs(platforms, configs) {
  // Create auth config file
  const authConfig = {
    providers: Object.entries(configs).map(([provider, config]) => ({
      provider,
      options: config,
    })),
    persistence: 'local',
    autoRefreshToken: true,
    enableLogging: process.env.NODE_ENV !== 'production',
  };

  const configPath = path.join(process.cwd(), 'capacitor-auth.config.json');
  fs.writeFileSync(configPath, JSON.stringify(authConfig, null, 2));
  console.log(`\n📄 Created ${configPath}`);

  // Create example initialization file
  const exampleCode = `import { CapacitorAuthManager } from 'capacitor-auth-manager';
import authConfig from './capacitor-auth.config.json';

export async function initializeAuth() {
  await CapacitorAuthManager.initialize(authConfig);
  
  // Add auth state listener
  await CapacitorAuthManager.addAuthStateListener((user) => {
    if (user) {
      console.log('User signed in:', user.email);
    } else {
      console.log('User signed out');
    }
  });
}

// Call this in your app initialization
initializeAuth();
`;

  const examplePath = path.join(process.cwd(), 'src', 'auth-init.ts');
  if (!fs.existsSync(path.dirname(examplePath))) {
    fs.mkdirSync(path.dirname(examplePath), { recursive: true });
  }
  fs.writeFileSync(examplePath, exampleCode);
  console.log(`📄 Created ${examplePath}`);
}

async function configureIOS(configs) {
  console.log('\n📱 Configuring iOS...');

  const infoPlistPath = path.join(
    process.cwd(),
    'ios',
    'App',
    'App',
    'Info.plist'
  );
  if (!fs.existsSync(infoPlistPath)) {
    console.log('⚠️  iOS Info.plist not found. Please configure manually.');
    return;
  }

  let plistAdditions = '\n<!-- Capacitor Auth Manager Configuration -->\n';

  // Google Sign-In
  if (configs.google) {
    const reversedClientId = configs.google.iosClientId
      .split('.')
      .reverse()
      .join('.');
    plistAdditions += `
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>${reversedClientId}</string>
    </array>
  </dict>
</array>
`;
  }

  // Facebook
  if (configs.facebook) {
    plistAdditions += `
<key>FacebookAppID</key>
<string>${configs.facebook.appId}</string>
<key>FacebookClientToken</key>
<string>CLIENT_TOKEN_HERE</string>
<key>FacebookDisplayName</key>
<string>${configs.facebook.appName}</string>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
`;
  }

  console.log('\nAdd the following to your Info.plist:');
  console.log(plistAdditions);
}

async function configureAndroid(configs) {
  console.log('\n🤖 Configuring Android...');

  const stringsPath = path.join(
    process.cwd(),
    'android',
    'app',
    'src',
    'main',
    'res',
    'values',
    'strings.xml'
  );
  if (!fs.existsSync(stringsPath)) {
    console.log(
      '⚠️  Android strings.xml not found. Please configure manually.'
    );
    return;
  }

  let stringsAdditions =
    '\n    <!-- Capacitor Auth Manager Configuration -->\n';

  // Google Sign-In
  if (configs.google && configs.google.serverClientId) {
    stringsAdditions += `    <string name="default_web_client_id">${configs.google.serverClientId}</string>\n`;
  }

  // Facebook
  if (configs.facebook) {
    stringsAdditions += `    <string name="facebook_app_id">${configs.facebook.appId}</string>\n`;
    stringsAdditions += `    <string name="facebook_client_token">CLIENT_TOKEN_HERE</string>\n`;
  }

  console.log('\nAdd the following to your strings.xml:');
  console.log(stringsAdditions);

  // Manifest additions
  const manifestAdditions = `
<!-- Add to AndroidManifest.xml -->
${
  configs.google
    ? `
<meta-data
  android:name="com.google.android.gms.auth.api.signin.GoogleSignInOptions"
  android:value="@string/default_web_client_id" />
`
    : ''
}
${
  configs.facebook
    ? `
<meta-data 
  android:name="com.facebook.sdk.ApplicationId" 
  android:value="@string/facebook_app_id"/>
<meta-data 
  android:name="com.facebook.sdk.ClientToken" 
  android:value="@string/facebook_client_token"/>
`
    : ''
}
`;

  console.log('\nAdd the following to your AndroidManifest.xml:');
  console.log(manifestAdditions);
}

// Run configuration
configure().catch(console.error);
