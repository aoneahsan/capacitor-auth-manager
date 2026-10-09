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
const yarn = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
function run(command, args, cwd = scratch) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}
try {
  run(yarn, ['pack', '--out', path.join(scratch, 'candidate.tgz')], root);
  const version = require(path.join(root, 'package.json')).devDependencies[
    '@capacitor/core'
  ];
  fs.writeFileSync(
    path.join(scratch, 'package.json'),
    JSON.stringify({
      name: 'cam-native-smoke',
      private: true,
      version: '0.0.0',
      packageManager: 'yarn@4.17.1',
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
  run(yarn, ['install', '--no-immutable']);
  run(yarn, [
    'cap',
    'add',
    platform,
    ...(platform === 'ios' ? ['--packagemanager', 'CocoaPods'] : []),
  ]);
  run(yarn, ['cap', 'sync', platform]);
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
      './gradlew',
      [
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
  if (!process.exitCode) fs.rmSync(scratch, { recursive: true, force: true });
}
