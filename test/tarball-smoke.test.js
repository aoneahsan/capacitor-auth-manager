'use strict';

/**
 * Tarball smoke test — the gate ISSUE-001 / ISSUE-002 / ISSUE-003 / ISSUE-004 never had.
 *
 * A repo build cannot catch these: bundlers resolve extensionless specifiers and jsdom-style
 * environments hide `window` access. Only installing the packed tarball into a clean directory and
 * importing it under bare Node does. Runs with the built-in test runner:
 * `node --test test/tarball-smoke.test.js` (`yarn smoke:tarball`).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

/** Runs Yarn (a .cmd shim on Windows, so it needs a shell there). */
function yarn(args, cwd) {
  return execFileSync(isWindows ? 'yarn.cmd' : 'yarn', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
  });
}

/** Runs a script file with the current Node binary — no shell, so nothing needs quoting. */
function node(scriptPath, cwd) {
  return execFileSync(process.execPath, [scriptPath], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

test('the packed tarball imports under bare Node (ESM + CJS) with no DOM', () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cam-tarball-smoke-'));
  try {
    const registryVersion = process.env.CAM_SMOKE_REGISTRY_VERSION;
    const packOutput = registryVersion
      ? 'registry verification'
      : yarn(
          ['pack', '--out', path.join(scratch, 'candidate.tgz')],
          packageRoot
        );
    const tarball = 'candidate.tgz';
    assert.ok(
      tarball && tarball.endsWith('.tgz'),
      `Yarn pack produced no tarball: ${packOutput}`
    );

    fs.writeFileSync(
      path.join(scratch, 'package.json'),
      JSON.stringify({
        name: 'cam-smoke',
        private: true,
        version: '0.0.0',
        packageManager: 'yarn@4.17.1',
      })
    );
    fs.writeFileSync(
      path.join(scratch, '.yarnrc.yml'),
      'nodeLinker: node-modules\nnpmMinimalAgeGate: 0\n'
    );
    yarn(
      [
        'add',
        '@capacitor/core',
        '@capacitor/preferences',
        'react',
        'react-dom',
        'vue',
        '@angular/core',
        '@angular/common',
        '@angular/router',
        '@angular/platform-browser',
        '@angular/compiler',
        'rxjs',
        'typescript@~6.0.3',
        '@types/react',
        'firebase',
        'esbuild',
        registryVersion
          ? `capacitor-auth-manager@${registryVersion}`
          : `capacitor-auth-manager@file:${path.join(scratch, tarball)}`,
      ],
      scratch
    );

    const manifest = fs.readFileSync(
      path.join(
        scratch,
        'node_modules/capacitor-auth-manager/android/src/main/AndroidManifest.xml'
      ),
      'utf8'
    );
    assert.deepEqual(
      [...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map(
        (match) => match[1]
      ),
      ['android.permission.INTERNET']
    );
    assert.ok(
      fs.existsSync(
        path.join(
          scratch,
          'node_modules/capacitor-auth-manager/android/consumer-rules.pro'
        )
      )
    );
    const installed = fs.readdirSync(path.join(scratch, 'node_modules'));
    assert.ok(installed.includes('capacitor-auth-manager'));
    assert.ok(
      !installed.includes('capacitor-biometric-authentication'),
      'a disabled provider dependency must not be installed for every consumer (ISSUE-004)'
    );

    for (const file of [
      'android/src/main/AndroidManifest.xml',
      'android/src/main/java/com/aoneahsan/capacitor_auth_manager/GoogleAuthProvider.java',
      'ios/Plugin/GoogleAuthProvider.swift',
      'AI-INTEGRATION-GUIDE.md',
    ]) {
      assert.ok(
        fs.existsSync(
          path.join(scratch, 'node_modules/capacitor-auth-manager', file)
        ),
        `Tarball missing ${file}`
      );
    }
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(scratch, 'node_modules/capacitor-auth-manager/package.json')
      )
    );
    for (const [subpath, conditions] of Object.entries(pkg.exports)) {
      for (const target of typeof conditions === 'string'
        ? [conditions]
        : Object.values(conditions)) {
        assert.ok(
          fs.existsSync(
            path.join(scratch, 'node_modules/capacitor-auth-manager', target)
          ),
          `${subpath}: missing ${target}`
        );
      }
    }
    const specifiers = Object.keys(pkg.exports)
      .filter((p) => p !== './package.json')
      .map((p) => (p === '.' ? pkg.name : pkg.name + p.slice(1)));
    const cjsCheck = path.join(scratch, 'check.cjs');
    fs.writeFileSync(
      cjsCheck,
      [
        "require('@angular/compiler');",
        ...specifiers.map(
          (s) =>
            `if (!Object.keys(require('${s}')).length) throw new Error('${s} empty');`
        ),
        "if (require('capacitor-auth-manager').auth !== require('capacitor-auth-manager/core').auth) throw new Error('CJS auth singleton split');",
        "if (typeof require('capacitor-auth-manager/providers/web').GoogleAuthProviderWeb !== 'function') throw new Error('CJS Google export missing');",
        "require('capacitor-auth-manager').auth.configure({providers:{google:{clientId:'test'}}});",
        "const React=require('react'); const {renderToString}=require('react-dom/server'); const {useAuthProvider}=require('capacitor-auth-manager/react');",
        "function App(){return React.createElement('span',null,String(useAuthProvider('google').isConfigured));}",
        "if (renderToString(React.createElement(App)) !== '<span>true</span>') throw new Error('CJS React lost configured auth');",
        "console.log('ok');",
      ].join('\n')
    );
    assert.equal(node(cjsCheck, scratch), 'ok');
    const esmCheck = path.join(scratch, 'check.mjs');
    fs.writeFileSync(
      esmCheck,
      [
        "await import('@angular/compiler');",
        ...specifiers.map(
          (s) =>
            `if (!Object.keys(await import('${s}')).length) throw new Error('${s} empty');`
        ),
        "console.log('ok');",
      ].join('\n')
    );
    assert.equal(node(esmCheck, scratch), 'ok');
    const guide = fs.readFileSync(
      path.join(
        scratch,
        'node_modules/capacitor-auth-manager/AI-INTEGRATION-GUIDE.md'
      ),
      'utf8'
    );
    const blocks = [...guide.matchAll(/```ts\n([\s\S]*?)```/g)].map(
      (match) => match[1]
    );
    // Compile each complete example as its own module, using the installed declarations.
    for (let i = 0; i < blocks.length; i++)
      fs.writeFileSync(path.join(scratch, `example-${i}.ts`), blocks[i]);
    fs.writeFileSync(
      path.join(scratch, 'react.ts'),
      "import { useAuth } from 'capacitor-auth-manager/react'; export type State = ReturnType<typeof useAuth>;\n"
    );
    fs.writeFileSync(
      path.join(scratch, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          skipLibCheck: true,
        },
        include: ['*.ts'],
      })
    );
    yarn(['tsc', '--project', 'tsconfig.json'], scratch);
    fs.writeFileSync(
      path.join(scratch, 'browser.ts'),
      "import { auth, AuthProvider } from 'capacitor-auth-manager'; import { useAuth } from 'capacitor-auth-manager/react'; export { auth, AuthProvider, useAuth };\n"
    );
    yarn(
      [
        'esbuild',
        'browser.ts',
        '--bundle',
        '--platform=browser',
        '--format=esm',
        '--outfile=browser.js',
      ],
      scratch
    );
    const help = execFileSync(
      process.execPath,
      [
        path.join(
          scratch,
          'node_modules/capacitor-auth-manager/scripts/configure.js'
        ),
        '--help',
      ],
      { cwd: scratch, encoding: 'utf8' }
    );
    assert.match(help, /Usage:/);
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
