'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const platform = process.argv[2];
if (!['android', 'ios'].includes(platform))
  throw new Error('Specify android or ios');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cam-native-'));
const root = path.resolve(__dirname, '..');
const androidSdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.platform === 'win32'
    ? path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
        'Android',
        'Sdk'
      )
    : null);
const childEnv =
  platform === 'android' && androidSdk && fs.existsSync(androidSdk)
    ? { ...process.env, ANDROID_HOME: androidSdk, ANDROID_SDK_ROOT: androidSdk }
    : process.env;
// Node 24 rejects direct .cmd execution on Windows (spawnSync EINVAL). Invoke Corepack's
// JavaScript entry with Node instead, so arguments are passed without a shell.
const windowsYarnCli = path.join(
  path.dirname(process.execPath),
  'node_modules',
  'corepack',
  'dist',
  'yarn.js'
);
function run(command, args, cwd = scratch) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: childEnv });
}
function runYarn(args, cwd = scratch) {
  if (process.platform === 'win32') {
    if (!fs.existsSync(windowsYarnCli))
      throw new Error(`Corepack's Yarn entry is missing: ${windowsYarnCli}`);
    run(process.execPath, [windowsYarnCli, ...args], cwd);
  } else {
    run('yarn', args, cwd);
  }
}
try {
  if (platform === 'android' && childEnv === process.env)
    throw new Error(
      'Android SDK not found; set ANDROID_HOME or ANDROID_SDK_ROOT'
    );
  runYarn(['pack', '--out', path.join(scratch, 'candidate.tgz')], root);
  const version = require(path.join(root, 'package.json')).devDependencies[
    '@capacitor/core'
  ];
  fs.writeFileSync(
    path.join(scratch, 'package.json'),
    JSON.stringify({
      name: 'cam-native-smoke',
      private: true,
      version: '0.0.0',
      packageManager: 'yarn@4.18.1',
      dependencies: {
        '@capacitor/core': version,
        [`@capacitor/${platform}`]: version,
        'capacitor-auth-manager': 'file:./candidate.tgz',
      },
      devDependencies: { '@capacitor/cli': version, typescript: '~6.0.3' },
    })
  );
  fs.writeFileSync(
    path.join(scratch, '.yarnrc.yml'),
    'nodeLinker: node-modules\nnpmMinimalAgeGate: 0\n'
  );
  fs.mkdirSync(path.join(scratch, 'www'));
  fs.writeFileSync(
    path.join(scratch, 'www/index.html'),
    '<!doctype html><html><head><title>Native compile check</title></head><body>Compile only</body></html>'
  );
  fs.writeFileSync(
    path.join(scratch, 'capacitor.config.json'),
    JSON.stringify({
      appId: 'com.example.authsmoke',
      appName: 'Auth smoke',
      webDir: 'www',
    })
  );
  // This generated consumer has no lockfile yet; the repository install stays immutable.
  runYarn(['install', '--no-immutable']);
  runYarn([
    'cap',
    'add',
    platform,
    ...(platform === 'ios' ? ['--packagemanager', 'CocoaPods'] : []),
  ]);
  runYarn(['cap', 'sync', platform]);
  if (platform === 'android') {
    const appBuildPath = path.join(scratch, 'android/app/build.gradle');
    const appBuild = fs.readFileSync(appBuildPath, 'utf8');
    if (!appBuild.includes('minifyEnabled false'))
      throw new Error('Android template release minification changed');
    fs.writeFileSync(
      appBuildPath,
      appBuild.replace('minifyEnabled false', 'minifyEnabled true')
    );
    run(
      process.platform === 'win32' ? 'cmd.exe' : './gradlew',
      [
        ...(process.platform === 'win32' ? ['/d', '/c', 'gradlew.bat'] : []),
        'assembleDebug',
        'assembleRelease',
        '--no-daemon',
        '--console=plain',
        '--warning-mode=all',
      ],
      path.join(scratch, 'android')
    );
  } else
    run(
      'xcodebuild',
      [
        '-workspace',
        'App.xcworkspace',
        '-scheme',
        'App',
        '-configuration',
        'Debug',
        '-sdk',
        'iphonesimulator',
        '-destination',
        'generic/platform=iOS Simulator',
        'CODE_SIGNING_ALLOWED=NO',
        'build',
      ],
      path.join(scratch, 'ios/App')
    );
} catch (error) {
  console.error(`Native smoke failed; inspect ${scratch}`);
  process.exitCode = 1;
} finally {
  if (!process.exitCode) {
    const resolvedScratch = fs.realpathSync(scratch);
    const tempRoot = fs.realpathSync(os.tmpdir());
    if (
      path.dirname(resolvedScratch) !== tempRoot ||
      !path.basename(resolvedScratch).startsWith('cam-native-')
    ) {
      throw new Error(
        `Refusing to remove a smoke directory outside the system temp root: ${scratch}`
      );
    }
    try {
      // Gradle and Windows virus scanning can briefly hold files after a successful build.
      fs.rmSync(resolvedScratch, {
        recursive: true,
        force: true,
        maxRetries: 20,
        retryDelay: 500,
      });
    } catch (error) {
      console.warn(
        `Native smoke passed, but scratch cleanup needs a retry: ${scratch}`,
        error
      );
    }
  }
}
