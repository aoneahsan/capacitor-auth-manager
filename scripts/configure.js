#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: capacitor-auth-configure [--dry-run]\nInteractive Google-only configuration helper. Creates capacitor-auth.config.json and src/auth-init.ts only when neither exists. Prints native setup instructions; never rewrites native projects. --dry-run prints without writing. Use AI-INTEGRATION-GUIDE.md for automated integration.'
  );
} else if (args.some((arg) => arg !== '--dry-run')) {
  console.error('Unknown option. Run with --help.');
  process.exitCode = 1;
} else if (!process.stdin.isTTY) {
  console.error(
    'This helper needs an interactive terminal. Read AI-INTEGRATION-GUIDE.md for non-interactive setup.'
  );
  process.exitCode = 1;
} else {
  configure().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

async function configure() {
  const configPath = path.resolve('capacitor-auth.config.json');
  const initPath = path.resolve('src/auth-init.ts');
  const dryRun = args.includes('--dry-run');
  if (!dryRun && [configPath, initPath].some((p) => fs.existsSync(p))) {
    throw new Error(
      'Configuration already exists. Merge the documented Google options into your existing app; this helper never overwrites files.'
    );
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const clientId = (
      await rl.question('Web OAuth client ID (also Android serverClientId): ')
    ).trim();
    const iosClientId = (
      await rl.question('iOS OAuth client ID (leave blank for web/Android): ')
    ).trim();
    const valid = (value) =>
      /^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(value);
    if (!valid(clientId) || (iosClientId && !valid(iosClientId)))
      throw new Error(
        'Use valid Google OAuth client IDs, never a client secret.'
      );
    const config = {
      providers: {
        google: {
          clientId,
          serverClientId: clientId,
          ...(iosClientId ? { iosClientId } : {}),
        },
      },
    };
    const init =
      "import { auth, AuthProvider } from 'capacitor-auth-manager';\nimport config from '../capacitor-auth.config.json';\n\nexport async function initializeAuth() {\n  auth.configure({ providers: { google: { ...config.providers.google, webFlow: 'popup' } }, persistence: 'memory' });\n  await auth.prepare(AuthProvider.GOOGLE);\n}\n";
    console.log(JSON.stringify(config, null, 2));
    if (!dryRun) {
      fs.mkdirSync(path.dirname(initPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', {
        flag: 'wx',
      });
      fs.writeFileSync(initPath, init, { flag: 'wx' });
      console.log(
        'Created capacitor-auth.config.json and src/auth-init.ts. Enable JSON imports in your app toolchain.'
      );
    }
    if (iosClientId)
      console.log(
        `iOS Info.plist: GIDClientID = ${iosClientId}; CFBundleURLTypes URL scheme = ${iosClientId.split('.').reverse().join('.')}. Merge into existing URL types. Use CocoaPods and iOS 15+.`
      );
    console.log(
      'Register Android application ID and debug/release/Play signing fingerprints; register web origins. Run yarn cap sync after native setup. Initialize Firebase separately and follow AI-INTEGRATION-GUIDE.md for the credential handoff.'
    );
  } finally {
    rl.close();
  }
}
